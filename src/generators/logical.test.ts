// Kiểm thử phần ra đề Logic từ ngân hàng câu hỏi.
import { describe, expect, it } from 'vitest'
import logicalData from '../data/logical.json'
import type { BankQuestion } from '../types/bank'
import type { Difficulty } from '../types/question'
import { bankItemToQuestion, pickFromBank } from './bank'
import { countLogicalQuestions, generateLogicalQuestions } from './logical'

const bank = logicalData as BankQuestion[]
const RUNS = 200

describe('bankItemToQuestion', () => {
  it('với MỌI câu trong ngân hàng: đáp án đúng sau khi xáo vẫn trỏ đúng nội dung', () => {
    for (const item of bank) {
      for (let i = 0; i < 20; i++) {
        const q = bankItemToQuestion(item, 'logical', 'Lời dẫn')
        const correct = q.options.find((o) => o.id === q.correctOptionId)
        expect(correct?.content).toBe(item.options[item.answerIndex])
        // Đủ lựa chọn, nhãn liên tiếp A, B, C…
        expect(q.options.map((o) => o.content).sort()).toEqual([...item.options].sort())
        expect(q.options.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D', 'E'].slice(0, item.options.length))
      }
    }
  })

  it('câu fixedOrder giữ nguyên thứ tự lựa chọn', () => {
    const fixed = bank.filter((item) => item.fixedOrder)
    expect(fixed.length).toBeGreaterThan(0)
    for (const item of fixed) {
      const q = bankItemToQuestion(item, 'logical', 'Lời dẫn')
      expect(q.options.map((o) => o.content)).toEqual(item.options)
    }
  })

  it('câu không fixedOrder thì có xáo trộn (đáp án không luôn ở cùng một nhãn)', () => {
    const item = bank.find((i) => !i.fixedOrder && i.options.length >= 4)!
    const labels = new Set<string>()
    for (let i = 0; i < RUNS; i++) labels.add(bankItemToQuestion(item, 'logical', 'Lời dẫn').correctOptionId)
    expect(labels.size).toBeGreaterThan(1)
  })
})

describe('pickFromBank', () => {
  it('báo lỗi khi ngân hàng không đủ câu', () => {
    expect(() => pickFromBank(bank.slice(0, 3), 5, undefined, 'logical', 'x')).toThrow(/không đủ/)
  })
})

describe('generateLogicalQuestions', () => {
  it('đếm số câu theo độ khó khớp với dữ liệu', () => {
    expect(countLogicalQuestions()).toBe(bank.length)
    for (const d of ['easy', 'medium', 'hard'] as Difficulty[]) {
      expect(countLogicalQuestions(d)).toBe(bank.filter((q) => q.difficulty === d).length)
    }
  })

  it('đủ số câu, không trùng câu, đúng dạng bài, có lời dẫn', () => {
    for (let i = 0; i < RUNS; i++) {
      const questions = generateLogicalQuestions(20)
      expect(questions).toHaveLength(20)
      expect(new Set(questions.map((q) => q.id)).size).toBe(20)
      for (const q of questions) {
        expect(q.category).toBe('logical')
        expect(q.instruction.trim()).not.toBe('')
      }
    }
  })

  it('giữ đúng độ khó khi được chỉ định, lấy được hết câu của độ khó đó', () => {
    for (const d of ['easy', 'medium', 'hard'] as Difficulty[]) {
      const all = generateLogicalQuestions(countLogicalQuestions(d), d)
      expect(all.every((q) => q.difficulty === d)).toBe(true)
    }
  })
})
