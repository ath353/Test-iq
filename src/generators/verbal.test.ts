// Kiểm thử bộ soát dữ liệu dạng Ngôn ngữ, và soát luôn file verbal.json thật.
import { describe, expect, it } from 'vitest'
import verbalData from '../data/verbal.json'
import { validateVerbalBank } from './verbal'

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
