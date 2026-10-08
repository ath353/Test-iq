// Kiểm thử phần chấm điểm.
import { describe, expect, it } from 'vitest'
import type { Question, TestConfig, UserAnswer } from '../types/question'
import { countByStatus, getAnswerStatus, gradeTest } from './scoring'

/** Tạo câu hỏi giả để test, đáp án đúng là correctOptionId. */
function makeQuestion(id: string, correctOptionId: string): Question {
  return {
    id,
    category: 'number-series',
    difficulty: 'easy',
    prompt: '1, 2, 3, ?',
    options: ['A', 'B', 'C', 'D', 'E'].map((o) => ({ id: o, content: o })),
    correctOptionId,
    explanationSteps: ['Cộng 1.'],
  }
}

const config: TestConfig = { category: 'number-series', questionCount: 4, timeLimitSec: 180 }
const questions = [makeQuestion('q1', 'A'), makeQuestion('q2', 'B'), makeQuestion('q3', 'C'), makeQuestion('q4', 'D')]

describe('getAnswerStatus', () => {
  it('phân biệt đúng, sai, bỏ trống', () => {
    const q = makeQuestion('q', 'B')
    expect(getAnswerStatus(q, { questionId: 'q', selectedOptionId: 'B' })).toBe('correct')
    expect(getAnswerStatus(q, { questionId: 'q', selectedOptionId: 'A' })).toBe('wrong')
    expect(getAnswerStatus(q, { questionId: 'q', selectedOptionId: null })).toBe('skipped')
    expect(getAnswerStatus(q, undefined)).toBe('skipped')
  })
})

describe('gradeTest', () => {
  // q1 đúng, q2 sai, q3 bỏ trống, q4 không có câu trả lời; cố tình xáo thứ tự mảng answers
  const answers: UserAnswer[] = [
    { questionId: 'q3', selectedOptionId: null },
    { questionId: 'q2', selectedOptionId: 'E' },
    { questionId: 'q1', selectedOptionId: 'A' },
  ]

  it('đếm đúng số câu đúng, không phụ thuộc thứ tự câu trả lời', () => {
    const result = gradeTest(config, questions, answers, 95, false)
    expect(result.correctCount).toBe(1)
    expect(result.durationSec).toBe(95)
    expect(result.timedOut).toBe(false)
    expect(() => new Date(result.finishedAt).toISOString()).not.toThrow()
  })

  it('đạt điểm tối đa khi trả lời đúng hết', () => {
    const all = questions.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId }))
    expect(gradeTest(config, questions, all, 60, false).correctCount).toBe(4)
  })

  it('countByStatus: câu không có câu trả lời được tính là bỏ trống', () => {
    const result = gradeTest(config, questions, answers, 95, true)
    expect(countByStatus(result)).toEqual({ correct: 1, wrong: 1, skipped: 2 })
  })
})
