// Kiểm thử bộ soát dữ liệu dạng Ngôn ngữ, và soát luôn file verbal.json thật.
import { describe, expect, it } from 'vitest'
import verbalData from '../data/verbal.json'
import type { VerbalBank } from '../types/bank'
import type { Difficulty } from '../types/question'
import {
  countVerbalStatements,
  generateVerbalQuestions,
  loadVerbalBank,
  statementToQuestion,
  validateVerbalBank,
} from './verbal'

/** Bộ dữ liệu hợp lệ làm mẫu; các test bên dưới làm hỏng từng phần để xem có bắt được lỗi không. */
function validBank() {
  return {
    passages: [{ id: 'vb-p01', title: 'Mẫu', text: 'Công ty A có 100 nhân viên.' }],
    statements: [
      {
        id: 'vb-001',
        passageId: 'vb-p01',
        difficulty: 'easy',
        statement: 'Công ty A có hơn 50 nhân viên.',
        answer: 'true',
        explanationSteps: ['100 > 50.'],
      },
    ],
  }
}

describe('validateVerbalBank', () => {
  it('dữ liệu hợp lệ thì không có lỗi', () => {
    expect(validateVerbalBank(validBank())).toEqual([])
  })

  // Mỗi trường hợp: tên + cách làm hỏng + đoạn chữ phải xuất hiện trong thông báo lỗi
  const brokenStatement: [string, Record<string, unknown>, string][] = [
    ['đáp án không hợp lệ', { answer: 'yes' }, 'answer'],
    ['thiếu đáp án', { answer: undefined }, 'answer'],
    ['thiếu lời giải', { explanationSteps: [] }, 'explanationSteps'],
    ['lời giải có bước rỗng', { explanationSteps: [' '] }, 'explanationSteps'],
    ['nhận định rỗng', { statement: '' }, 'statement'],
    ['trỏ tới đoạn văn không tồn tại', { passageId: 'vb-p99' }, 'passageId'],
    ['mã sai dạng', { id: 'vb-1' }, 'id'],
    ['độ khó sai', { difficulty: 'x' }, 'difficulty'],
  ]
  for (const [name, change, expected] of brokenStatement) {
    it(`bắt được lỗi nhận định: ${name}`, () => {
      const bank = validBank()
      bank.statements[0] = { ...bank.statements[0], ...change }
      expect(validateVerbalBank(bank).some((e) => e.includes(expected))).toBe(true)
    })
  }

  it('bắt được đoạn văn thiếu nội dung, sai mã', () => {
    const bank = validBank()
    bank.passages[0] = { id: 'p1', title: '', text: '' }
    const errors = validateVerbalBank(bank)
    expect(errors.some((e) => e.includes('id phải có dạng "vb-p01"'))).toBe(true)
    expect(errors.some((e) => e.includes('title'))).toBe(true)
    expect(errors.some((e) => e.includes('text'))).toBe(true)
  })

  it('bắt được mã trùng và đoạn văn chưa có nhận định', () => {
    const bank = validBank()
    bank.passages.push({ id: 'vb-p02', title: 'Thừa', text: 'Không ai dùng.' })
    bank.statements.push({ ...bank.statements[0] })
    const errors = validateVerbalBank(bank)
    expect(errors).toContain('vb-001: id bị trùng')
    expect(errors).toContain('vb-p02: đoạn văn chưa có nhận định nào')
  })

  it('sai cấu trúc tổng thể thì báo lỗi', () => {
    expect(validateVerbalBank([])).not.toEqual([])
    expect(validateVerbalBank({ passages: [] })).not.toEqual([])
  })
})

describe('File verbal.json thật', () => {
  it('không có lỗi nào', () => {
    expect(validateVerbalBank(verbalData)).toEqual([])
  })

  it('đáp án phân bố tương đối đều giữa Đúng / Sai / Không đủ thông tin (mỗi loại ≥ 25%)', () => {
    // Tránh bộ đề lệch hẳn về một đáp án, người làm đoán bừa cũng được điểm cao
    const total = verbalData.statements.length
    for (const answer of ['true', 'false', 'cannot-say']) {
      const count = verbalData.statements.filter((s) => s.answer === answer).length
      expect(count / total).toBeGreaterThanOrEqual(0.25)
    }
  })
})

describe('Ra đề Ngôn ngữ', () => {
  const bank = verbalData as VerbalBank
  const RUNS = 200

  it('statementToQuestion: 3 lựa chọn cố định A Đúng / B Sai / C Không đủ thông tin, đáp án đúng nhãn', () => {
    const expected = { true: 'A', false: 'B', 'cannot-say': 'C' } as const
    for (const s of bank.statements) {
      const passage = bank.passages.find((p) => p.id === s.passageId)!
      const q = statementToQuestion(s, passage)
      expect(q.options).toEqual([
        { id: 'A', content: 'Đúng' },
        { id: 'B', content: 'Sai' },
        { id: 'C', content: 'Không đủ thông tin' },
      ])
      expect(q.correctOptionId).toBe(expected[s.answer])
      expect(q.stimulus).toEqual({ type: 'passage', title: passage.title, text: passage.text })
      expect(q.prompt).toBe(s.statement)
    }
  })

  it('đủ số câu, không trùng, và các nhận định cùng đoạn văn luôn đứng liền nhau', () => {
    for (let i = 0; i < RUNS; i++) {
      const questions = generateVerbalQuestions(20)
      expect(questions).toHaveLength(20)
      expect(new Set(questions.map((q) => q.id)).size).toBe(20)
      // Gom theo đoạn văn: một đoạn văn đã kết thúc thì không xuất hiện lại phía sau
      const titles = questions.map((q) => (q.stimulus?.type === 'passage' ? q.stimulus.title : ''))
      const finished = new Set<string>()
      titles.forEach((title, k) => {
        expect(finished.has(title)).toBe(false)
        if (titles[k + 1] !== title) finished.add(title)
      })
    }
  })

  it('giữ đúng độ khó; đếm số nhận định theo độ khó khớp dữ liệu', () => {
    for (const d of ['easy', 'medium', 'hard'] as Difficulty[]) {
      const count = countVerbalStatements(d)
      expect(count).toBe(bank.statements.filter((s) => s.difficulty === d).length)
      expect(generateVerbalQuestions(count, d).every((q) => q.difficulty === d)).toBe(true)
    }
    expect(countVerbalStatements()).toBe(bank.statements.length)
  })

  it('báo lỗi khi không đủ nhận định', () => {
    expect(() => generateVerbalQuestions(bank.statements.length + 1)).toThrow(/không đủ/)
  })

  it('loadVerbalBank dừng lại khi dữ liệu sai', () => {
    expect(() => loadVerbalBank({ passages: [], statements: [{}] })).toThrow(/có lỗi/)
  })
})
