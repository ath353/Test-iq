// Tính thống kê từ lịch sử làm bài: % đúng theo dạng bài, theo độ khó, dạng yếu nhất, tiến bộ qua các lần làm.
// Toàn bộ là hàm thuần (không phụ thuộc React) để test được.
//
// Cách tính % đúng: theo TỪNG CÂU (tổng câu đúng ÷ tổng câu), câu bỏ trống tính là sai.
// Mỗi câu được tính vào DẠNG CỦA CÂU ĐÓ (không phải loại bài), nên câu trong bài thi thử tổng hợp
// được cộng đúng vào dạng của nó. Tương tự, % theo độ khó dùng độ khó của từng câu.

import type { Difficulty, QuestionCategory, TestCategory } from '../types/question'
import type { HistoryEntry } from './history'
import { getAnswerStatus } from './scoring'

/** Thứ tự cố định của các dạng bài trong thống kê (giống trang chủ). */
export const STATS_CATEGORIES: QuestionCategory[] = ['number-series', 'numerical', 'logical', 'verbal', 'abstract']
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

/** Một dạng phải làm ít nhất ngần này câu mới được xét là "dạng yếu nhất" (ít câu quá thì % chưa đáng tin). */
export const MIN_QUESTIONS_FOR_WEAKEST = 10

/** Số câu và số câu đúng; accuracy là % đúng (0–100), null nếu chưa có câu nào. */
export interface Tally {
  questions: number
  correct: number
  accuracy: number | null
}

/** Thống kê của một dạng bài. */
export interface CategoryStats extends Tally {
  category: QuestionCategory
  /** Số bài đã làm có câu thuộc dạng này (kể cả bài thi thử tổng hợp). */
  attempts: number
  /** Thống kê theo độ khó của từng câu. */
  byDifficulty: Record<Difficulty, Tally>
  /** Thời gian trung bình mỗi câu (giây); null nếu chưa làm. */
  avgSecondsPerQuestion: number | null
}

/** Thống kê tổng hợp. */
export interface OverallStats extends Tally {
  attempts: number
  /** Thống kê từng dạng, theo thứ tự cố định STATS_CATEGORIES (kể cả dạng chưa làm). */
  categories: CategoryStats[]
  /** Dạng có % đúng thấp nhất (trong các dạng đủ số câu); null nếu chưa đủ dữ liệu để so sánh. */
  weakest: QuestionCategory | null
}

/** Tạo bộ đếm rỗng. */
function emptyTally(): Tally {
  return { questions: 0, correct: 0, accuracy: null }
}

/** Tính lại % đúng (làm tròn số nguyên) từ số câu và số câu đúng. */
function withAccuracy(t: Tally): Tally {
  return { ...t, accuracy: t.questions === 0 ? null : Math.round((t.correct / t.questions) * 100) }
}

/**
 * Tính thống kê tổng hợp từ lịch sử.
 * @param entries Lịch sử (thứ tự bất kỳ).
 */
export function computeStats(entries: HistoryEntry[]): OverallStats {
  const categories = STATS_CATEGORIES.map((category) => {
    const byDifficulty: Record<Difficulty, Tally> = { easy: emptyTally(), medium: emptyTally(), hard: emptyTally() }
    let attempts = 0
    let questions = 0
    let correct = 0
    let seconds = 0

    for (const { result } of entries) {
      // Chỉ xét các câu thuộc dạng này (bài một dạng: cả bài; bài tổng hợp: phần câu của dạng này)
      const own = result.questions.filter((q) => q.category === category)
      if (own.length === 0) continue
      attempts++
      const answerById = new Map(result.answers.map((a) => [a.questionId, a]))
      // Thời gian chia đều cho mọi câu trong bài (không đo riêng từng câu), rồi cộng phần của dạng này
      seconds += (result.durationSec / result.questions.length) * own.length
      for (const q of own) {
        const isCorrect = getAnswerStatus(q, answerById.get(q.id)) === 'correct'
        questions++
        byDifficulty[q.difficulty].questions++
        if (isCorrect) {
          correct++
          byDifficulty[q.difficulty].correct++
        }
      }
    }

    for (const d of DIFFICULTIES) byDifficulty[d] = withAccuracy(byDifficulty[d])
    const stats: CategoryStats = {
      category,
      attempts,
      ...withAccuracy({ questions, correct, accuracy: null }),
      byDifficulty,
      avgSecondsPerQuestion: questions === 0 ? null : Math.round(seconds / questions),
    }
    return stats
  })

  // Dạng yếu nhất: chỉ xét dạng đủ số câu; cần ít nhất 2 dạng như vậy thì mới có gì để so sánh.
  // So bằng tỉ lệ chính xác (chưa làm tròn) để tránh hai dạng "bằng nhau" do làm tròn.
  const eligible = categories.filter((c) => c.questions >= MIN_QUESTIONS_FOR_WEAKEST)
  const weakest =
    eligible.length >= 2
      ? eligible.reduce((a, b) => (b.correct / b.questions < a.correct / a.questions ? b : a)).category
      : null

  const questions = categories.reduce((s, c) => s + c.questions, 0)
  const correct = categories.reduce((s, c) => s + c.correct, 0)
  return { attempts: entries.length, ...withAccuracy({ questions, correct, accuracy: null }), categories, weakest }
}

/** Một điểm trên biểu đồ tiến bộ. */
export interface ProgressPoint {
  /** Mã mục lịch sử (để mở lại bài nếu cần). */
  id: string
  /** Loại bài (một dạng hoặc thi thử tổng hợp). */
  category: TestCategory
  /** Thời điểm nộp bài (ISO). */
  finishedAt: string
  /** % đúng của bài (0–100, làm tròn). */
  accuracy: number
}

/**
 * Dữ liệu biểu đồ tiến bộ: % đúng của từng bài, theo thứ tự thời gian (cũ → mới), lấy `limit` bài gần nhất.
 * Lọc theo một dạng bài: lấy mọi bài có câu thuộc dạng đó, và % chỉ tính trên các câu của dạng đó
 * (bài thi thử tổng hợp cũng góp một điểm, tính trên 5 câu của dạng đó).
 * @param entries Lịch sử (thứ tự bất kỳ).
 * @param category Lọc theo dạng bài; 'all' là mọi bài, % tính trên cả bài.
 * @param limit Số bài gần nhất cần lấy.
 */
export function progressSeries(
  entries: HistoryEntry[],
  category: QuestionCategory | 'all',
  limit = 20,
): ProgressPoint[] {
  const points: ProgressPoint[] = []
  for (const { id, result } of entries) {
    const own = category === 'all' ? result.questions : result.questions.filter((q) => q.category === category)
    if (own.length === 0) continue
    const answerById = new Map(result.answers.map((a) => [a.questionId, a]))
    const correct = own.filter((q) => getAnswerStatus(q, answerById.get(q.id)) === 'correct').length
    points.push({
      id,
      category: result.config.category,
      finishedAt: result.finishedAt,
      accuracy: Math.round((correct / own.length) * 100),
    })
  }
  return points.sort((a, b) => a.finishedAt.localeCompare(b.finishedAt)).slice(-limit)
}
