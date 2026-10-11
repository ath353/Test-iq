// Kiểm thử bộ sinh Dãy chữ cái. Quy luật được kiểm tra lại độc lập: đọc các chữ trong đề + đáp án,
// đổi sang số thứ tự (A = 1) rồi kiểm tra tính chất của từng quy luật.
import { describe, expect, it } from 'vitest'
import type { Difficulty, Question } from '../types/question'
import {
  ALPHABET,
  buildLetterDistractors,
  generateLetterSeriesQuestion,
  LETTER_RULES_BY_DIFFICULTY,
  letterAlternating,
  letterArithmetic,
  letterFibonacci,
  letterIncreasingDifference,
  toLetter,
  toPosition,
} from './letterSeries'
import { generateNumberSeriesQuestions } from './numberSeries'

const RUNS = 300

/** Hiệu giữa các số liền kề. */
const diffs = (ns: number[]) => ns.slice(1).map((n, i) => n - ns[i])

/** Cả dãy (5 số trong đề + đáp án) đều nằm trong A–Z. */
const inRange = (ns: number[]) => ns.every((n) => Number.isInteger(n) && n >= 1 && n <= 26)

/** Đọc lại dãy số thứ tự từ câu hỏi: 5 chữ trong đề + chữ của đáp án đúng. */
function positionsOf(q: Question): number[] {
  const letters = q.prompt.replace(', ?', '').split(', ')
  const answer = q.options.find((o) => o.id === q.correctOptionId)!.content
  return [...letters, answer].map(toPosition)
}

describe('Đổi chữ ↔ số thứ tự', () => {
  it('A = 1, Z = 26, đổi qua lại khớp nhau; ngoài A–Z thì báo lỗi', () => {
    expect(toPosition('A')).toBe(1)
    expect(toPosition('Z')).toBe(26)
    for (let n = 1; n <= 26; n++) expect(toPosition(toLetter(n))).toBe(n)
    expect(() => toLetter(0)).toThrow()
    expect(() => toLetter(27)).toThrow()
  })
})

describe('Các quy luật (kiểm tra cả dãy kể cả đáp án)', () => {
  it('cách đều: mọi hiệu bằng nhau, bước đúng khoảng của độ khó', () => {
    for (const [min, max] of [[2, 3], [4, 5]]) {
      for (let i = 0; i < RUNS; i++) {
        const { terms, answer } = letterArithmetic(min, max)
        const all = [...terms, answer]
        expect(inRange(all)).toBe(true)
        const ds = diffs(all)
        expect(new Set(ds).size).toBe(1)
        expect(Math.abs(ds[0])).toBeGreaterThanOrEqual(min)
        expect(Math.abs(ds[0])).toBeLessThanOrEqual(max)
      }
    }
  })

  it('hiệu tăng dần: hiệu tăng đúng 1 mỗi lần', () => {
    for (let i = 0; i < RUNS; i++) {
      const { terms, answer } = letterIncreasingDifference()
      const all = [...terms, answer]
      expect(inRange(all)).toBe(true)
      expect(diffs(diffs(all)).every((d) => d === 1)).toBe(true)
    }
  })

  it('xen kẽ: vị trí lẻ và chẵn đều cách đều, hai bước khác nhau', () => {
    for (let i = 0; i < RUNS; i++) {
      const { terms, answer } = letterAlternating()
      const all = [...terms, answer]
      expect(inRange(all)).toBe(true)
      const odd = [all[0], all[2], all[4]]
      const even = [all[1], all[3], all[5]]
      expect(new Set(diffs(odd)).size).toBe(1)
      expect(new Set(diffs(even)).size).toBe(1)
      expect(diffs(odd)[0]).not.toBe(diffs(even)[0])
    }
  })

  it('kiểu Fibonacci: mỗi số = tổng hai số trước', () => {
    for (let i = 0; i < RUNS; i++) {
      const { terms, answer } = letterFibonacci()
      const all = [...terms, answer]
      expect(inRange(all)).toBe(true)
      for (let k = 2; k < 6; k++) expect(all[k]).toBe(all[k - 1] + all[k - 2])
    }
  })
})

describe('buildLetterDistractors', () => {
  it('4 số trong A–Z, không trùng nhau, không trùng đáp án — kể cả đáp án ở sát mép A hoặc Z', () => {
    for (const answer of [1, 2, 13, 25, 26]) {
      for (let i = 0; i < 50; i++) {
        const result = buildLetterDistractors(answer, [answer, 0, 27, answer + 1])
        expect(result).toHaveLength(4)
        expect(new Set(result).size).toBe(4)
        expect(result).not.toContain(answer)
        expect(inRange(result)).toBe(true)
      }
    }
  })
})

describe('generateLetterSeriesQuestion', () => {
  it('đề 5 chữ + "?"; 5 lựa chọn là chữ cái khác nhau; đáp án đúng khớp quy luật; lời giải nêu chữ cần tìm', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
      for (let i = 0; i < RUNS; i++) {
        const q = generateLetterSeriesQuestion('q', difficulty)
        expect(q.category).toBe('number-series')
        expect(q.prompt).toMatch(/^([A-Z], ){5}\?$/)
        expect(q.options.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D', 'E'])
        for (const o of q.options) expect(ALPHABET).toContain(o.content)
        expect(new Set(q.options.map((o) => o.content)).size).toBe(5)
        const all = positionsOf(q)
        expect(inRange(all)).toBe(true)
        for (const step of q.explanationSteps) expect(step.trim()).not.toBe('')
        const answerLetter = toLetter(all[5])
        expect(q.explanationSteps[q.explanationSteps.length - 1]).toBe(`Số thứ tự ${all[5]} ứng với chữ ${answerLetter}.`)
      }
    }
  })

  it('mỗi độ khó có quy luật riêng; mức Khó không dùng quy luật cách đều', () => {
    expect(LETTER_RULES_BY_DIFFICULTY.hard).toHaveLength(2)
    for (let i = 0; i < RUNS; i++) {
      const all = positionsOf(generateLetterSeriesQuestion('q', 'hard'))
      expect(new Set(diffs(all)).size).toBeGreaterThan(1)
    }
  })
})

describe('Ghép vào dạng Dãy số', () => {
  it('bài Dãy số có cả câu dãy chữ cái và câu dãy số (khoảng 1/4 là chữ cái)', () => {
    const questions = generateNumberSeriesQuestions(400)
    const letters = questions.filter((q) => /^[A-Z]/.test(q.prompt)).length
    expect(letters).toBeGreaterThan(60) // kỳ vọng ~100; ngưỡng rộng để test không chập chờn
    expect(letters).toBeLessThan(140)
  })
})
