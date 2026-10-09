// Kiểm thử thống kê, dùng dữ liệu dựng tay để biết trước kết quả.
import { describe, expect, it } from 'vitest'
import type { Difficulty, Question, QuestionCategory } from '../types/question'
import type { HistoryEntry } from './history'
import { computeStats, MIN_QUESTIONS_FOR_WEAKEST, progressSeries } from './stats'

/** Tạo câu hỏi giả thuộc dạng `category`, đáp án đúng luôn là 'A'. */
function q(id: string, difficulty: Difficulty, category: QuestionCategory): Question {
  return {
    id,
    category,
    difficulty,
    instruction: 'x',
    prompt: 'x',
    options: [
      { id: 'A', content: '1' },
      { id: 'B', content: '2' },
    ],
    correctOptionId: 'A',
    explanationSteps: ['x'],
  }
}

/**
 * Tạo một mục lịch sử.
 * @param pattern Mỗi ký tự là một câu: 'c' đúng, 'w' sai, 's' bỏ trống. Độ khó lần lượt dễ/trung bình/khó xoay vòng.
 */
function entry(id: string, category: QuestionCategory, pattern: string, finishedAt: string, durationSec = 60): HistoryEntry {
  const levels: Difficulty[] = ['easy', 'medium', 'hard']
  const questions = [...pattern].map((_, i) => q(`${id}-${i}`, levels[i % 3], category))
  const answers = [...pattern].map((p, i) => ({
    questionId: questions[i].id,
    selectedOptionId: p === 'c' ? 'A' : p === 'w' ? 'B' : null,
  }))
  return {
    id,
    result: {
      config: { category, questionCount: pattern.length, difficulty: 'mixed', timeLimitSec: null },
      questions,
      answers,
      correctCount: [...pattern].filter((p) => p === 'c').length,
      durationSec,
      timedOut: false,
      finishedAt,
    },
  }
}

describe('computeStats', () => {
  it('không có lịch sử: mọi số đều 0 / null, chưa có dạng yếu nhất', () => {
    const s = computeStats([])
    expect(s.attempts).toBe(0)
    expect(s.accuracy).toBeNull()
    expect(s.weakest).toBeNull()
    expect(s.categories).toHaveLength(5)
    expect(s.categories.every((c) => c.accuracy === null && c.avgSecondsPerQuestion === null)).toBe(true)
  })

  it('tính % đúng theo từng câu, câu bỏ trống tính là sai, gộp nhiều bài cùng dạng', () => {
    // Dãy số: bài 1 đúng 2/3, bài 2 đúng 1/3 → tổng 3/6 = 50%
    const s = computeStats([
      entry('a', 'number-series', 'cwc', '2026-01-01T00:00:00Z', 30),
      entry('b', 'number-series', 'scs', '2026-01-02T00:00:00Z', 90),
    ])
    const ns = s.categories.find((c) => c.category === 'number-series')!
    expect(ns.attempts).toBe(2)
    expect(ns.questions).toBe(6)
    expect(ns.correct).toBe(3)
    expect(ns.accuracy).toBe(50)
    // Thời gian trung bình mỗi câu: (30 + 90) ÷ 6 = 20 giây
    expect(ns.avgSecondsPerQuestion).toBe(20)
    expect(s.accuracy).toBe(50)
  })

  it('tách % theo độ khó của TỪNG CÂU', () => {
    // 6 câu, độ khó dễ/TB/khó/dễ/TB/khó; đúng câu 1, 2, 4 → dễ 2/2, TB 1/2, khó 0/2
    const s = computeStats([entry('a', 'logical', 'ccwcww', '2026-01-01T00:00:00Z')])
    const lg = s.categories.find((c) => c.category === 'logical')!
    expect(lg.byDifficulty.easy).toEqual({ questions: 2, correct: 2, accuracy: 100 })
    expect(lg.byDifficulty.medium).toEqual({ questions: 2, correct: 1, accuracy: 50 })
    expect(lg.byDifficulty.hard).toEqual({ questions: 2, correct: 0, accuracy: 0 })
  })

  it('dạng yếu nhất: dạng có % thấp nhất trong các dạng đủ số câu', () => {
    const many = (p: string) => p.repeat(MIN_QUESTIONS_FOR_WEAKEST)
    const s = computeStats([
      entry('a', 'number-series', many('c'), '2026-01-01T00:00:00Z'), // 100%
      entry('b', 'verbal', many('w'), '2026-01-02T00:00:00Z'), // 0%
      entry('c', 'abstract', 'www', '2026-01-03T00:00:00Z'), // 0% nhưng chưa đủ số câu → không xét
    ])
    expect(s.weakest).toBe('verbal')
  })

  it('chỉ có 1 dạng đủ số câu thì chưa xác định dạng yếu nhất', () => {
    const s = computeStats([entry('a', 'numerical', 'w'.repeat(20), '2026-01-01T00:00:00Z')])
    expect(s.weakest).toBeNull()
  })
})

describe('progressSeries', () => {
  const entries = [
    entry('new', 'verbal', 'cccc', '2026-03-01T00:00:00Z'), // 100%
    entry('old', 'number-series', 'cwww', '2026-01-01T00:00:00Z'), // 25%
    entry('mid', 'number-series', 'ccww', '2026-02-01T00:00:00Z'), // 50%
  ]

  it('sắp theo thời gian từ cũ đến mới, % đúng từng bài', () => {
    expect(progressSeries(entries, 'all').map((p) => [p.id, p.accuracy])).toEqual([
      ['old', 25],
      ['mid', 50],
      ['new', 100],
    ])
  })

  it('lọc theo dạng bài và giới hạn số bài gần nhất', () => {
    expect(progressSeries(entries, 'number-series').map((p) => p.id)).toEqual(['old', 'mid'])
    expect(progressSeries(entries, 'all', 2).map((p) => p.id)).toEqual(['mid', 'new'])
    expect(progressSeries(entries, 'abstract')).toEqual([])
  })
})

describe('Bài thi thử tổng hợp trong thống kê', () => {
  it('mỗi câu được tính vào đúng dạng của nó', () => {
    // Bài tổng hợp 4 câu: 2 câu Dãy số (đúng cả 2), 2 câu Hình (sai cả 2)
    const mixed = entry('m', 'number-series', 'ccww', '2026-05-01T00:00:00Z', 80)
    mixed.result.config.category = 'mixed'
    mixed.result.questions[2].category = 'abstract'
    mixed.result.questions[3].category = 'abstract'
    const s = computeStats([mixed])
    const ns = s.categories.find((c) => c.category === 'number-series')!
    const ab = s.categories.find((c) => c.category === 'abstract')!
    expect([ns.questions, ns.correct, ns.attempts]).toEqual([2, 2, 1])
    expect([ab.questions, ab.correct, ab.attempts]).toEqual([2, 0, 1])
    // Thời gian chia đều: 80 giây / 4 câu = 20 giây mỗi câu
    expect(ns.avgSecondsPerQuestion).toBe(20)
    // Biểu đồ tiến bộ lọc theo Hình: % tính trên 2 câu Hình của bài tổng hợp = 0%
    expect(progressSeries([mixed], 'abstract').map((p) => p.accuracy)).toEqual([0])
    expect(progressSeries([mixed], 'all').map((p) => [p.accuracy, p.category])).toEqual([[50, 'mixed']])
  })
})
