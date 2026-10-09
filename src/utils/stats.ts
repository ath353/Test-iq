// Tính thống kê từ lịch sử làm bài: % đúng theo dạng bài, theo độ khó, dạng yếu nhất, tiến bộ qua các lần làm.
// Toàn bộ là hàm thuần (không phụ thuộc React) để test được.
//
// Cách tính % đúng: theo TỪNG CÂU (tổng câu đúng ÷ tổng câu), câu bỏ trống tính là sai.
// % theo độ khó dùng độ khó của từng câu, nên bài "Hỗn hợp" vẫn được tách đúng vào từng mức.

import type { Difficulty, QuestionCategory } from '../types/question'
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
  /** Số bài đã làm. */
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
    const own = entries.filter((e) => e.result.config.category === category)
    const byDifficulty: Record<Difficulty, Tally> = { easy: emptyTally(), medium: emptyTally(), hard: emptyTally() }
    let questions = 0
    let correct = 0
    let seconds = 0

    for (const { result } of own) {
      const answerById = new Map(result.answers.map((a) => [a.questionId, a]))
      seconds += result.durationSec
      for (const q of result.questions) {
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
      attempts: own.length,
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
  category: QuestionCategory
  /** Thời điểm nộp bài (ISO). */
  finishedAt: string
  /** % đúng của bài (0–100, làm tròn). */
  accuracy: number
}

/**
 * Dữ liệu biểu đồ tiến bộ: % đúng của từng bài, theo thứ tự thời gian (cũ → mới), lấy `limit` bài gần nhất.
 * @param entries Lịch sử (thứ tự bất kỳ).
 * @param category Lọc theo dạng bài; 'all' là mọi dạng.
 * @param limit Số bài gần nhất cần lấy.
 */
export function progressSeries(
  entries: HistoryEntry[],
  category: QuestionCategory | 'all',
  limit = 20,
): ProgressPoint[] {
  return entries
    .filter((e) => category === 'all' || e.result.config.category === category)
    .map((e) => ({
      id: e.id,
      category: e.result.config.category,
      finishedAt: e.result.finishedAt,
      accuracy:
        e.result.questions.length === 0 ? 0 : Math.round((e.result.correctCount / e.result.questions.length) * 100),
    }))
    .sort((a, b) => a.finishedAt.localeCompare(b.finishedAt))
    .slice(-limit)
}
