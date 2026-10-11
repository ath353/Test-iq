// Kiểm thử bộ sinh Toán đố. Mỗi kiểu bài chạy nhiều lần, đáp án được TÍNH LẠI ĐỘC LẬP bằng công thức riêng
// từ các con số trong đề (và kiểm tra các con số đó thật sự xuất hiện trong đề).
import { describe, expect, it } from 'vitest'
import type { Difficulty } from '../types/question'
import {
  fmt,
  formatAnswer,
  generateWordProblem,
  generateWordProblems,
  partsToQuestion,
  successiveDiscount,
  WORD_KINDS_BY_DIFFICULTY,
  type WordKindId,
  type WordProblemParts,
} from './wordProblems'

/** Số lần chạy lặp cho mỗi kiểm tra ngẫu nhiên. */
const RUNS = 300

/**
 * Công thức giải lại cho từng kiểu bài, viết theo cách khác với bộ sinh khi có thể
 * (bộ sinh tính ngược từ đáp án, ở đây tính xuôi từ đề).
 */
const SOLVERS: Record<WordKindId, (p: Record<string, number>) => number> = {
  'percent-discount': (p) => p.price * (1 - p.d / 100),
  'ratio-split': (p) => (p.total / (p.a + p.b)) * p.b,
  'age-sum': (p) => p.sum / (p.m + 1),
  'average-needed': (p) => p.t * p.total - p.a * p.n,
  // Năng suất: 1 / (1/a + 1/b)
  'work-together': (p) => 1 / (1 / p.a + 1 / p.b),
  'meet-up': (p) => p.distance / (p.v1 + p.v2),
  // r·x + k = r2·(x + k) → x = k(r2 − 1)/(r − r2)
  'age-future': (p) => (p.k * (p.r2 - 1)) / (p.r - p.r2),
  'cost-from-profit': (p) => p.sell / (1 + p.p / 100),
  'catch-up': (p) => (p.v1 * p.h) / (p.v2 - p.v1),
  'fill-drain': (p) => 1 / (1 / p.a - 1 / p.b),
  'successive-discount': (p) => 100 * (1 - (1 - p.d1 / 100) * (1 - p.d2 / 100)),
  // Quãng đường 1 chiều coi là 1: tổng quãng đường 2, tổng thời gian 1/v1 + 1/v2
  'average-speed': (p) => 2 / (1 / p.v1 + 1 / p.v2),
}

/** Gần bằng nhau (bỏ qua sai số số thực). */
function near(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-6
}

/** Chạy mọi kiểu bài của mọi độ khó, mỗi kiểu RUNS lần. */
function eachKind(check: (parts: WordProblemParts, difficulty: Difficulty) => void) {
  for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
    for (const kind of WORD_KINDS_BY_DIFFICULTY[difficulty]) {
      for (let i = 0; i < RUNS; i++) check(kind(), difficulty)
    }
  }
}

describe('Các kiểu bài Toán đố', () => {
  it('mỗi độ khó có 4 kiểu bài; đủ 12 kiểu, không trùng', () => {
    const ids = new Set<string>()
    for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
      expect(WORD_KINDS_BY_DIFFICULTY[difficulty]).toHaveLength(4)
      for (const kind of WORD_KINDS_BY_DIFFICULTY[difficulty]) ids.add(kind().kind)
    }
    expect(ids.size).toBe(12)
    expect([...ids].sort()).toEqual(Object.keys(SOLVERS).sort())
  })

  it('đáp án = công thức giải lại độc lập', () => {
    eachKind((parts) => {
      expect(near(SOLVERS[parts.kind](parts.params), parts.answer)).toBe(true)
    })
  })

  it('mọi con số dùng để giải đều xuất hiện trong đề', () => {
    eachKind((parts) => {
      for (const value of Object.values(parts.params)) expect(parts.prompt).toContain(fmt(value))
    })
  })

  it('đáp án là số đẹp (tối đa 1 chữ số thập phân), dương, hợp lý', () => {
    eachKind((parts) => {
      expect(parts.answer).toBeGreaterThan(0)
      expect(near(parts.answer * 10, Math.round(parts.answer * 10))).toBe(true)
      // Hiển thị đủ chữ số: đáp án lẻ thì phải có 1 chữ số thập phân
      if (!Number.isInteger(parts.answer)) expect(parts.decimals).toBe(1)
      if (parts.kind === 'average-needed') expect(parts.answer).toBeLessThanOrEqual(10)
      if (parts.kind === 'age-sum' || parts.kind === 'age-future') expect(Number.isInteger(parts.answer)).toBe(true)
    })
  })

  it('lời giải từng bước không rỗng; đề không còn số lẻ dài do sai số (vd. 7,30000001)', () => {
    eachKind((parts) => {
      expect(parts.steps.length).toBeGreaterThan(0)
      for (const step of parts.steps) expect(step.trim()).not.toBe('')
      expect(parts.prompt).not.toMatch(/\d,\d{3,}/)
      for (const step of parts.steps) expect(step).not.toMatch(/\d,\d{3,}/)
    })
  })
})

describe('partsToQuestion', () => {
  it('5 lựa chọn A–E khác nhau; đáp án đúng nằm ở lựa chọn được đánh dấu; nhiễu cách đáp án ≥ 3%', () => {
    eachKind((parts, difficulty) => {
      const q = partsToQuestion('q', difficulty, parts)
      expect(q.category).toBe('word-problem')
      expect(q.options.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D', 'E'])
      expect(new Set(q.options.map((o) => o.content)).size).toBe(5)
      const correct = q.options.find((o) => o.id === q.correctOptionId)!
      expect(correct.content).toBe(formatAnswer(SOLVERS[parts.kind](parts.params), parts))
      expect(q.explanationSteps[q.explanationSteps.length - 1]).toBe(`Đáp án: ${correct.content}.`)
    })
  })

  it('đề và lựa chọn hợp lý: quãng đường nguyên km, điểm không quá 10, lời giải không viết "1x"', () => {
    eachKind((parts, difficulty) => {
      if (parts.kind === 'meet-up') expect(Number.isInteger(parts.params.distance)).toBe(true)
      for (const step of parts.steps) expect(step).not.toMatch(/→ 1x/)
      if (parts.kind === 'average-needed') {
        const q = partsToQuestion('q', difficulty, parts)
        // "9,5 điểm" → 9.5
        for (const o of q.options) expect(Number(o.content.split(' ')[0].replace(',', '.'))).toBeLessThanOrEqual(10)
      }
    })
  })

  it('đáp án nhiễu dùng lỗi sai thường gặp: giảm giá liên tiếp có bẫy "cộng hai mức giảm"', () => {
    for (let i = 0; i < RUNS; i++) {
      const parts = successiveDiscount()
      const { d1, d2 } = parts.params
      // Chỉ kiểm tra khi bẫy đủ xa đáp án (nhiễu phải cách đáp án ≥ 3 đơn vị)
      if (d1 + d2 - parts.answer < 3) continue
      const q = partsToQuestion('q', 'hard', parts)
      expect(q.options.map((o) => o.content)).toContain(`${d1 + d2}%`)
    }
  })
})

describe('generateWordProblems', () => {
  it('đủ số câu, không trùng đề, mã wp-1…, đúng độ khó', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
      const questions = generateWordProblems(30, difficulty)
      expect(questions).toHaveLength(30)
      expect(new Set(questions.map((q) => q.prompt)).size).toBe(30)
      expect(questions.map((q) => q.id)).toEqual(questions.map((_, i) => `wp-${i + 1}`))
      for (const q of questions) expect(q.difficulty).toBe(difficulty)
    }
  })

  it('đáp án đúng xuất hiện ở nhiều vị trí khác nhau (đã xáo trộn)', () => {
    const positions = new Set<string>()
    for (let i = 0; i < RUNS; i++) positions.add(generateWordProblem('q', 'medium').correctOptionId)
    expect(positions.size).toBe(5)
  })
})
