// Kiểm thử phần soát dữ liệu ngân hàng câu hỏi, và soát luôn file logical.json thật.
import { describe, expect, it } from 'vitest'
import logicalData from '../data/logical.json'
import { loadBank, validateBank, validateBankQuestion } from './bank'
import { LOGICAL_BANK_RULES } from './logical'

const rules = { idPrefix: 'lg', topics: ['ordering', 'syllogism'] }

/** Một câu hợp lệ làm mẫu; các test bên dưới làm hỏng từng phần để xem có bắt được lỗi không. */
const valid = {
  id: 'lg-001',
  difficulty: 'easy',
  topic: 'ordering',
  prompt: 'An cao hơn Bình.\nAi thấp hơn?',
  options: ['An', 'Bình', 'Không xác định'],
  answerIndex: 1,
  explanationSteps: ['An > Bình nên Bình thấp hơn.'],
}

describe('validateBankQuestion', () => {
  it('câu hợp lệ thì không có lỗi', () => {
    expect(validateBankQuestion(valid, rules)).toEqual([])
    expect(validateBankQuestion({ ...valid, fixedOrder: true }, rules)).toEqual([])
  })

  // Mỗi trường hợp: tên + cách làm hỏng + đoạn chữ phải xuất hiện trong thông báo lỗi
  const broken: [string, Record<string, unknown>, string][] = [
    ['thiếu đáp án', { answerIndex: undefined }, 'answerIndex'],
    ['đáp án nằm ngoài danh sách lựa chọn', { answerIndex: 3 }, 'answerIndex'],
    ['đáp án không phải số nguyên', { answerIndex: 1.5 }, 'answerIndex'],
    ['thiếu lời giải', { explanationSteps: [] }, 'explanationSteps'],
    ['lời giải có bước rỗng', { explanationSteps: ['Bước 1', '  '] }, 'explanationSteps'],
    ['đề bài rỗng', { prompt: '' }, 'prompt'],
    ['quá ít lựa chọn', { options: ['An', 'Bình'], answerIndex: 0 }, 'options'],
    ['quá nhiều lựa chọn', { options: ['1', '2', '3', '4', '5', '6'] }, 'options'],
    ['lựa chọn trùng nhau (khác hoa thường)', { options: ['An', 'an', 'Bình'] }, 'trùng'],
    ['lựa chọn rỗng', { options: ['An', '', 'Bình'] }, 'options'],
    ['mã sai dạng', { id: 'lg-1' }, 'id'],
    ['mã sai tiền tố', { id: 'vb-001' }, 'id'],
    ['độ khó sai', { difficulty: 'super' }, 'difficulty'],
    ['chủ đề không có trong danh sách', { topic: 'seating' }, 'topic'],
    ['fixedOrder sai kiểu', { fixedOrder: 'yes' }, 'fixedOrder'],
  ]
  for (const [name, change, expected] of broken) {
    it(`bắt được lỗi: ${name}`, () => {
      const errors = validateBankQuestion({ ...valid, ...change }, rules)
      expect(errors.some((e) => e.includes(expected))).toBe(true)
    })
  }

  it('không phải object thì báo lỗi', () => {
    expect(validateBankQuestion(null, rules)).not.toEqual([])
    expect(validateBankQuestion('abc', rules)).not.toEqual([])
  })
})

describe('validateBank', () => {
  it('bắt được mã câu bị trùng và ghi rõ mã câu lỗi', () => {
    const errors = validateBank([valid, { ...valid }], rules)
    expect(errors).toContain('lg-001: id bị trùng')
  })

  it('file không phải mảng thì báo lỗi', () => {
    expect(validateBank({}, rules)).toEqual(['file phải là một mảng các câu hỏi'])
  })

  it('loadBank dừng lại và liệt kê lỗi khi dữ liệu sai', () => {
    expect(() => loadBank([{ ...valid, answerIndex: 9 }], rules)).toThrow(/lg-001: answerIndex/)
  })
})

describe('File logical.json thật', () => {
  it('không có lỗi nào', () => {
    // In đủ danh sách lỗi nếu có, để biết sửa câu nào
    expect(validateBank(logicalData, LOGICAL_BANK_RULES)).toEqual([])
  })
})
