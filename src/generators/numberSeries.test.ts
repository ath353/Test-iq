// Kiểm thử bộ sinh Dãy số. Mỗi quy luật chạy nhiều lần với tham số ngẫu nhiên,
// và kiểm tra lại toán học một cách độc lập (không tin vào đáp án do bộ sinh trả về).
import { describe, expect, it } from 'vitest'
import type { Difficulty, Question } from '../types/question'
import {
  alternatingSeries,
  arithmeticSeries,
  buildDistractors,
  cubeSeries,
  doublingDifferenceSeries,
  fibonacciSeries,
  generateNumberSeriesQuestion,
  generateNumberSeriesQuestions,
  geometricSeries,
  increasingDifferenceSeries,
  multiplyAddSeries,
  RULES_BY_DIFFICULTY,
  squareSeries,
  type SeriesData,
} from './numberSeries'

/** Số lần chạy lặp cho mỗi kiểm tra ngẫu nhiên. */
const RUNS = 500

/** Tính hiệu các số liền kề. */
const diffs = (ns: number[]) => ns.slice(1).map((n, i) => n - ns[i])

/** Ghép các số trong đề với đáp án thành dãy đầy đủ. */
const fullSeries = (data: SeriesData) => [...data.terms, data.answer]

/** Kiểm tra mảng có mọi phần tử bằng nhau không. */
const allEqual = (ns: number[]) => ns.every((n) => n === ns[0])

/** Kiểm tra chung cho mọi quy luật: số nguyên dương, lời giải hợp lệ. */
function expectValidData(data: SeriesData) {
  for (const n of fullSeries(data)) {
    expect(Number.isInteger(n)).toBe(true)
    expect(n).toBeGreaterThan(0)
  }
  expect(data.steps.length).toBeGreaterThan(0)
  for (const step of data.steps) expect(step.trim()).not.toBe('')
  // Bước cuối của lời giải phải nêu ra đúng đáp án
  expect(data.steps[data.steps.length - 1]).toContain(String(data.answer))
}

describe('Quy luật cộng đều', () => {
  it('hiệu giữa các số liền kề (kể cả đáp án) luôn bằng nhau', () => {
    for (let i = 0; i < RUNS; i++) {
      const data = arithmeticSeries()
      expectValidData(data)
      expect(allEqual(diffs(fullSeries(data)))).toBe(true)
    }
  })
})

describe('Quy luật nhân đều', () => {
  it('thương giữa các số liền kề (kể cả đáp án) luôn bằng nhau', () => {
    for (let i = 0; i < RUNS; i++) {
      const data = geometricSeries()
      expectValidData(data)
      const s = fullSeries(data)
      const ratios = s.slice(1).map((n, j) => n / s[j])
      expect(allEqual(ratios)).toBe(true)
    }
  })
})

describe('Quy luật cộng tăng dần', () => {
  it('hiệu tăng đều (hiệu bậc 2 bằng nhau và dương)', () => {
    for (let i = 0; i < RUNS; i++) {
      const data = increasingDifferenceSeries()
      expectValidData(data)
      const second = diffs(diffs(fullSeries(data)))
      expect(allEqual(second)).toBe(true)
      expect(second[0]).toBeGreaterThan(0)
    }
  })
})

describe('Quy luật bình phương', () => {
  it('có dạng n² + c với n tăng dần từng đơn vị', () => {
    for (let i = 0; i < RUNS; i++) {
      const data = squareSeries()
      expectValidData(data)
      const s = fullSeries(data)
      // n² + c với n liên tiếp thì hiệu bậc 2 luôn bằng 2
      expect(diffs(diffs(s)).every((d) => d === 2)).toBe(true)
    }
  })
})

describe('Quy luật xen kẽ', () => {
  it('vị trí lẻ và vị trí chẵn đều là dãy cộng đều', () => {
    for (let i = 0; i < RUNS; i++) {
      const data = alternatingSeries()
      expectValidData(data)
      const s = fullSeries(data)
      const odd = s.filter((_, j) => j % 2 === 0)
      const even = s.filter((_, j) => j % 2 === 1)
      expect(allEqual(diffs(odd))).toBe(true)
      expect(allEqual(diffs(even))).toBe(true)
      // Đáp án ở vị trí thứ 8, thuộc dãy chẵn
      expect(s.length).toBe(8)
    }
  })
})

describe('Quy luật lập phương', () => {
  it('có dạng n³ + c với n liên tiếp (hiệu bậc 3 luôn bằng 6)', () => {
    for (let i = 0; i < RUNS; i++) {
      const data = cubeSeries()
      expectValidData(data)
      expect(diffs(diffs(diffs(fullSeries(data)))).every((d) => d === 6)).toBe(true)
    }
  })
})

describe('Quy luật Fibonacci', () => {
  it('mỗi số (kể cả đáp án) bằng tổng hai số đứng trước', () => {
    for (let i = 0; i < RUNS; i++) {
      const data = fibonacciSeries()
      expectValidData(data)
      const s = fullSeries(data)
      for (let k = 2; k < s.length; k++) expect(s[k]).toBe(s[k - 1] + s[k - 2])
    }
  })
})

describe('Quy luật nhân rồi cộng', () => {
  it('tồn tại a, b cố định để mỗi số = số trước × a + b (b ≠ 0), dãy tăng', () => {
    for (let i = 0; i < RUNS; i++) {
      const data = multiplyAddSeries()
      expectValidData(data)
      const s = fullSeries(data)
      // Tìm a, b từ 3 số đầu: s1 = a·s0 + b, s2 = a·s1 + b → a = (s2 − s1) / (s1 − s0)
      const a = (s[2] - s[1]) / (s[1] - s[0])
      const b = s[1] - a * s[0]
      expect(Number.isInteger(a) && a >= 2).toBe(true)
      expect(b).not.toBe(0)
      for (let k = 1; k < s.length; k++) expect(s[k]).toBe(s[k - 1] * a + b)
      expect(diffs(s).every((d) => d > 0)).toBe(true)
    }
  })
})

describe('Quy luật hiệu tăng gấp đôi', () => {
  it('mỗi hiệu (kể cả hiệu tới đáp án) gấp đôi hiệu trước', () => {
    for (let i = 0; i < RUNS; i++) {
      const data = doublingDifferenceSeries()
      expectValidData(data)
      const d = diffs(fullSeries(data))
      for (let k = 1; k < d.length; k++) expect(d[k]).toBe(d[k - 1] * 2)
    }
  })
})

describe('Số quy luật theo độ khó', () => {
  it('mức Khó có ít nhất 3 quy luật, mức Trung bình ít nhất 3', () => {
    expect(RULES_BY_DIFFICULTY.hard.length).toBeGreaterThanOrEqual(3)
    expect(RULES_BY_DIFFICULTY.medium.length).toBeGreaterThanOrEqual(3)
  })

  it('làm nhiều câu Khó thì gặp đủ các quy luật (đề không lặp một kiểu)', () => {
    // Nhận diện quy luật qua câu đầu của lời giải
    const kinds = new Set<string>()
    for (let i = 0; i < 200; i++) kinds.add(generateNumberSeriesQuestion('q', 'hard').explanationSteps[0].slice(0, 12))
    expect(kinds.size).toBeGreaterThanOrEqual(4)
  })
})

describe('buildDistractors', () => {
  it('trả về 4 số nguyên dương, không trùng nhau, không trùng đáp án', () => {
    for (let i = 0; i < RUNS; i++) {
      const answer = Math.floor(Math.random() * 200) + 1
      // Cố tình đưa vào lỗi sai trùng đáp án, trùng nhau, số âm, số thập phân
      const result = buildDistractors(answer, [answer, answer + 1, answer + 1, -5, 2.5])
      expect(result).toHaveLength(4)
      expect(new Set(result).size).toBe(4)
      expect(result).not.toContain(answer)
      for (const n of result) {
        expect(Number.isInteger(n)).toBe(true)
        expect(n).toBeGreaterThan(0)
      }
    }
  })

  it('vẫn đủ 4 số khi đáp án rất nhỏ (ít số dương gần đáp án)', () => {
    for (let i = 0; i < RUNS; i++) expect(buildDistractors(1, [])).toHaveLength(4)
  })
})

describe('generateNumberSeriesQuestion', () => {
  /** Kiểm tra cấu trúc của một câu hỏi hoàn chỉnh. */
  function expectValidQuestion(q: Question, difficulty: Difficulty) {
    expect(q.category).toBe('number-series')
    expect(q.difficulty).toBe(difficulty)
    expect(q.instruction.trim()).not.toBe('')
    expect(q.stimulus).toBeUndefined()
    expect(q.prompt.endsWith(', ?')).toBe(true)
    // 5 lựa chọn A–E, nội dung không trùng nhau
    expect(q.options.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(new Set(q.options.map((o) => o.content)).size).toBe(5)
    // Đáp án đúng phải nằm trong các lựa chọn
    const correct = q.options.find((o) => o.id === q.correctOptionId)
    expect(correct).toBeDefined()
    // Lời giải từng bước: ít nhất 1 bước, không bước nào rỗng, bước cuối nêu đúng đáp án
    expect(q.explanationSteps.length).toBeGreaterThan(0)
    for (const step of q.explanationSteps) expect(step.trim()).not.toBe('')
    expect(q.explanationSteps[q.explanationSteps.length - 1]).toContain(`= ${correct!.content}.`)
  }

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    it(`câu hỏi độ khó "${difficulty}" hợp lệ`, () => {
      for (let i = 0; i < RUNS; i++) {
        expectValidQuestion(generateNumberSeriesQuestion('q', difficulty), difficulty)
      }
    })
  }

  it('đáp án đúng xuất hiện ở nhiều vị trí khác nhau (đã xáo trộn)', () => {
    const positions = new Set<string>()
    for (let i = 0; i < RUNS; i++) positions.add(generateNumberSeriesQuestion('q', 'easy').correctOptionId)
    expect(positions.size).toBe(5)
  })
})

describe('generateNumberSeriesQuestions', () => {
  it('sinh đúng số câu, mã câu không trùng, đề không trùng', () => {
    const questions = generateNumberSeriesQuestions(30)
    expect(questions).toHaveLength(30)
    expect(new Set(questions.map((q) => q.id)).size).toBe(30)
    expect(new Set(questions.map((q) => q.prompt)).size).toBe(30)
  })

  it('giữ đúng độ khó khi được chỉ định', () => {
    const questions = generateNumberSeriesQuestions(20, 'hard')
    expect(questions.every((q) => q.difficulty === 'hard')).toBe(true)
  })
})
