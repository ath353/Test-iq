// Kiểm thử hàm sinh đề chung.
import { describe, expect, it } from 'vitest'
import { generateQuestions } from './index'

describe('generateQuestions', () => {
  it('sinh đúng số câu và đúng độ khó khi chọn mức cố định', () => {
    const questions = generateQuestions({
      category: 'number-series',
      questionCount: 20,
      difficulty: 'medium',
      timeLimitSec: null,
    })
    expect(questions).toHaveLength(20)
    expect(questions.every((q) => q.difficulty === 'medium')).toBe(true)
  })

  it('chế độ hỗn hợp: các câu có nhiều mức độ khó', () => {
    const questions = generateQuestions({
      category: 'number-series',
      questionCount: 30,
      difficulty: 'mixed',
      timeLimitSec: 900,
    })
    expect(new Set(questions.map((q) => q.difficulty)).size).toBeGreaterThan(1)
  })

  it('báo lỗi với dạng bài chưa hỗ trợ', () => {
    expect(() =>
      generateQuestions({ category: 'verbal', questionCount: 10, difficulty: 'easy', timeLimitSec: null }),
    ).toThrow()
  })
})
