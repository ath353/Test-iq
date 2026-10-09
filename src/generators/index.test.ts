// Kiểm thử hàm sinh đề chung.
import { describe, expect, it } from 'vitest'
import { CATEGORY_OPTIONS } from '../config/testOptions'
import { generateQuestions } from './index'

describe('generateQuestions', () => {
  // Bảo vệ: dạng bài nào đã bật trên trang chủ (available) thì phải sinh được đề,
  // tránh trường hợp bật trên giao diện nhưng quên đăng ký bộ sinh đề
  for (const category of CATEGORY_OPTIONS.filter((c) => c.available)) {
    it(`dạng "${category.label}" đã bật trên trang chủ thì sinh được đề đúng dạng`, () => {
      const questions = generateQuestions({
        category: category.id,
        questionCount: 10,
        difficulty: 'mixed',
        timeLimitSec: null,
      })
      expect(questions).toHaveLength(10)
      expect(questions.every((q) => q.category === category.id)).toBe(true)
    })
  }

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
