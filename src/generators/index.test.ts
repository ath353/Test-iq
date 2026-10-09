// Kiểm thử hàm sinh đề chung.
import { describe, expect, it } from 'vitest'
import { CATEGORY_OPTIONS, MIXED_CATEGORIES, MIXED_QUESTIONS_PER_CATEGORY } from '../config/testOptions'
import type { TestConfig } from '../types/question'
import { generateQuestions } from './index'

describe('generateQuestions', () => {
  // Bảo vệ: dạng bài nào đã bật trên trang chủ (available) thì phải sinh được đề,
  // tránh trường hợp bật trên giao diện nhưng quên đăng ký bộ sinh đề
  for (const category of CATEGORY_OPTIONS.filter((c) => c.available)) {
    it(`dạng "${category.label}" đã bật trên trang chủ thì sinh được đề đúng dạng`, () => {
      // Dùng lựa chọn số câu đầu tiên của dạng đó (thi thử tổng hợp chỉ có 25 câu)
      const questionCount = category.questionCounts?.[0] ?? 10
      const questions = generateQuestions({ category: category.id, questionCount, difficulty: 'mixed', timeLimitSec: null })
      expect(questions).toHaveLength(questionCount)
      if (category.id === 'mixed') {
        // Bài tổng hợp: mỗi dạng đúng 5 câu, mã câu không trùng
        for (const c of MIXED_CATEGORIES) {
          expect(questions.filter((q) => q.category === c)).toHaveLength(MIXED_QUESTIONS_PER_CATEGORY)
        }
        expect(new Set(questions.map((q) => q.id)).size).toBe(questionCount)
      } else {
        expect(questions.every((q) => q.category === category.id)).toBe(true)
      }
    })
  }

  it('thi thử tổng hợp: trộn lẫn ngẫu nhiên (không xếp liền theo từng dạng), giữ đúng độ khó đã chọn', () => {
    let grouped = 0
    for (let i = 0; i < 20; i++) {
      const questions = generateQuestions({ category: 'mixed', questionCount: 25, difficulty: 'hard', timeLimitSec: null })
      expect(questions.every((q) => q.difficulty === 'hard')).toBe(true)
      // Đếm số lần đổi dạng giữa hai câu liền nhau; nếu xếp liền theo dạng thì chỉ đổi đúng 4 lần
      const switches = questions.slice(1).filter((q, k) => q.category !== questions[k].category).length
      if (switches === 4) grouped++
    }
    expect(grouped).toBeLessThan(20)
  })

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
    // Mọi dạng bài đều đã hỗ trợ; dùng một mã dạng bài không tồn tại để kiểm tra nhánh báo lỗi
    const unknown = 'unknown' as TestConfig['category']
    expect(() => generateQuestions({ category: unknown, questionCount: 10, difficulty: 'easy', timeLimitSec: null })).toThrow()
  })
})
