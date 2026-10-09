// Kiểm thử bộ sinh Số liệu. Mỗi kiểu câu hỏi chạy nhiều lần với dữ liệu ngẫu nhiên, và đáp án được
// TÍNH LẠI ĐỘC LẬP: đọc tên dòng / tên kỳ xuất hiện trong câu hỏi, lấy số từ bảng, tính theo công thức.
import { describe, expect, it } from 'vitest'
import type { Difficulty } from '../types/question'
import { formatNumber, formatPercent } from '../utils/format'
import {
  averageQuestion,
  buildDataset,
  buildNumericDistractors,
  CONTEXTS,
  type Dataset,
  differenceQuestion,
  generateNumericalQuestion,
  generateNumericalQuestions,
  highestGrowthQuestion,
  percentChangeQuestion,
  projectionQuestion,
  type QuestionParts,
  shareQuestion,
  toTable,
  totalQuestion,
} from './numerical'

/** Số lần chạy lặp cho mỗi kiểm tra ngẫu nhiên. */
const RUNS = 300

/** Vị trí các dòng có tên xuất hiện trong câu hỏi. */
function entitiesIn(prompt: string, ds: Dataset): number[] {
  return ds.entities.map((name, i) => (prompt.includes(name) ? i : -1)).filter((i) => i >= 0)
}

/** Vị trí các kỳ có tên xuất hiện trong câu hỏi (theo thứ tự thời gian). */
function periodsIn(prompt: string, ds: Dataset): number[] {
  const lower = prompt.toLowerCase()
  return ds.context.periodPhrases.map((p, i) => (lower.includes(p) ? i : -1)).filter((i) => i >= 0)
}

/** Gọi kiểu câu hỏi cho đến khi nhận được kết quả (bỏ qua các lần từ chối dữ liệu). */
function generate(kind: (ds: Dataset) => QuestionParts | null): { ds: Dataset; parts: QuestionParts } {
  for (;;) {
    const ds = buildDataset()
    const parts = kind(ds)
    if (parts) return { ds, parts }
  }
}

/** Kiểm tra chung: đáp án nhiễu không trùng, lời giải hợp lệ, bước cuối nêu đúng đáp án. */
function expectValidParts(parts: QuestionParts, optionCount = 5) {
  const all = [parts.answer, ...parts.distractors]
  expect(all).toHaveLength(optionCount)
  expect(new Set(all).size).toBe(optionCount)
  expect(parts.steps.length).toBeGreaterThan(0)
  for (const step of parts.steps) expect(step.trim()).not.toBe('')
  expect(parts.steps[parts.steps.length - 1]).toContain(parts.answer)
}

describe('buildDataset', () => {
  it('bảng 4 dòng, tên dòng không trùng, số nguyên dương, 2 kỳ liền kề luôn khác nhau', () => {
    for (let i = 0; i < RUNS; i++) {
      const ds = buildDataset()
      expect(ds.entities).toHaveLength(4)
      expect(new Set(ds.entities).size).toBe(4)
      for (const row of ds.values) {
        expect(row).toHaveLength(ds.context.periods.length)
        for (const v of row) {
          expect(Number.isInteger(v)).toBe(true)
          expect(v).toBeGreaterThan(0)
        }
        for (let p = 1; p < row.length; p++) expect(row[p]).not.toBe(row[p - 1])
      }
    }
  })

  it('mọi bối cảnh có số tên kỳ trong bảng bằng số tên kỳ trong câu', () => {
    for (const c of CONTEXTS) expect(c.periodPhrases).toHaveLength(c.periods.length)
  })

  it('toTable: số được định dạng kiểu Việt Nam, có ghi chú đơn vị', () => {
    const ds = buildDataset(CONTEXTS[0])
    const table = toTable(ds)
    expect(table.headers).toEqual(['Chi nhánh', 'Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'])
    expect(table.rows[0][1]).toBe(formatNumber(ds.values[0][0]))
    expect(table.note).toContain('tỷ đồng')
  })
})

describe('buildNumericDistractors', () => {
  it('trả về 4 số dương, không trùng, đủ xa đáp án', () => {
    for (let i = 0; i < RUNS; i++) {
      const answer = Math.round(Math.random() * 1000) / 10 + 0.1
      const result = buildNumericDistractors(answer, [answer, -5, answer + 0.01], 1, formatPercent)
      expect(result).toHaveLength(4)
      expect(new Set(result).size).toBe(4)
      expect(result).not.toContain(formatPercent(answer))
    }
  })
})

describe('Chênh lệch', () => {
  it('đáp án = |kỳ sau − kỳ trước| của đúng dòng được hỏi', () => {
    for (let i = 0; i < RUNS; i++) {
      const { ds, parts } = generate(differenceQuestion)
      expectValidParts(parts)
      const [e] = entitiesIn(parts.prompt, ds)
      const [p1, p2] = periodsIn(parts.prompt, ds)
      expect(parts.answer).toBe(formatNumber(Math.abs(ds.values[e][p2] - ds.values[e][p1])))
      // "nhiều hơn" / "ít hơn" phải khớp với chiều thay đổi
      const increased = ds.values[e][p2] > ds.values[e][p1]
      expect(parts.prompt.includes('nhiều hơn')).toBe(increased)
    }
  })
})

describe('Tổng', () => {
  it('đáp án = tổng cả dòng', () => {
    for (let i = 0; i < RUNS; i++) {
      const { ds, parts } = generate(totalQuestion)
      expectValidParts(parts)
      const [e] = entitiesIn(parts.prompt, ds)
      expect(parts.answer).toBe(formatNumber(ds.values[e].reduce((a, b) => a + b, 0)))
    }
  })
})

describe('Phần trăm thay đổi', () => {
  it('đáp án = |sau − trước| ÷ trước × 100, chia cho kỳ GỐC (kỳ sớm hơn)', () => {
    for (let i = 0; i < RUNS; i++) {
      const { ds, parts } = generate(percentChangeQuestion)
      expectValidParts(parts)
      const [e] = entitiesIn(parts.prompt, ds)
      const [p1, p2] = periodsIn(parts.prompt, ds)
      const a = ds.values[e][p1]
      const b = ds.values[e][p2]
      expect(parts.answer).toBe(formatPercent((Math.abs(b - a) / a) * 100))
      expect(parts.prompt.includes(' tăng ')).toBe(b > a)
    }
  })
})

describe('Trung bình', () => {
  it('đáp án = tổng dòng ÷ số kỳ', () => {
    for (let i = 0; i < RUNS; i++) {
      const { ds, parts } = generate(averageQuestion)
      expectValidParts(parts)
      const [e] = entitiesIn(parts.prompt, ds)
      const row = ds.values[e]
      expect(parts.answer).toBe(formatNumber(row.reduce((a, b) => a + b, 0) / row.length, 1))
    }
  })
})

describe('Tỉ trọng', () => {
  it('đáp án = giá trị ÷ tổng cả cột của kỳ được hỏi × 100', () => {
    for (let i = 0; i < RUNS; i++) {
      const { ds, parts } = generate(shareQuestion)
      expectValidParts(parts)
      const [e] = entitiesIn(parts.prompt, ds)
      const [p] = periodsIn(parts.prompt, ds)
      const total = ds.values.reduce((s, row) => s + row[p], 0)
      expect(parts.answer).toBe(formatPercent((ds.values[e][p] / total) * 100))
    }
  })
})

describe('Tăng trưởng cao nhất', () => {
  it('đáp án là dòng có % tăng cao nhất, cách dòng cao nhì ít nhất 1 điểm %', () => {
    for (let i = 0; i < RUNS; i++) {
      const { ds, parts } = generate(highestGrowthQuestion)
      // Kiểu này chỉ có 4 lựa chọn (4 dòng của bảng)
      expectValidParts(parts, 4)
      const growths = ds.values.map((row) => (row[row.length - 1] - row[0]) / row[0])
      const best = growths.indexOf(Math.max(...growths))
      expect(parts.answer).toContain(ds.entities[best])
      const sorted = [...growths].sort((x, y) => y - x)
      expect((sorted[0] - sorted[1]) * 100).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('Dự báo', () => {
  it('đáp án = kỳ cuối × (1 + tỉ lệ thay đổi giữa 2 kỳ cuối), làm tròn số nguyên', () => {
    for (let i = 0; i < RUNS; i++) {
      const { ds, parts } = generate(projectionQuestion)
      expectValidParts(parts)
      const [e] = entitiesIn(parts.prompt, ds)
      const row = ds.values[e]
      const a = row[row.length - 2]
      const b = row[row.length - 1]
      expect(parts.answer).toBe(formatNumber(b * (1 + (b - a) / a)))
    }
  })
})

describe('generateNumericalQuestion', () => {
  for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
    it(`câu hỏi độ khó "${difficulty}" hợp lệ`, () => {
      for (let i = 0; i < RUNS; i++) {
        const q = generateNumericalQuestion('q', difficulty)
        expect(q.category).toBe('numerical')
        expect(q.difficulty).toBe(difficulty)
        expect(q.instruction.trim()).not.toBe('')
        expect(q.stimulus?.type).toBe('table')
        // Nhãn lựa chọn liên tiếp từ A, đáp án đúng nằm trong các lựa chọn
        expect(q.options.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D', 'E'].slice(0, q.options.length))
        expect(q.options.some((o) => o.id === q.correctOptionId)).toBe(true)
        for (const step of q.explanationSteps) expect(step.trim()).not.toBe('')
      }
    })
  }

  it('đáp án đúng xuất hiện ở nhiều vị trí khác nhau (đã xáo trộn)', () => {
    const positions = new Set<string>()
    for (let i = 0; i < RUNS; i++) positions.add(generateNumericalQuestion('q', 'medium').correctOptionId)
    expect(positions.size).toBe(5)
  })
})

describe('generateNumericalQuestions', () => {
  it('sinh đúng số câu, mã câu không trùng', () => {
    const questions = generateNumericalQuestions(30)
    expect(questions).toHaveLength(30)
    expect(new Set(questions.map((q) => q.id)).size).toBe(30)
  })
})
