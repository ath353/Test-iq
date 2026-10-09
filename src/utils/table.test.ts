// Kiểm thử hàm tiện ích cho bảng số liệu.
import { describe, expect, it } from 'vitest'
import { isNumericCell } from './table'

describe('isNumericCell', () => {
  it('nhận diện đúng số, số âm, số có dấu chấm/phẩy, phần trăm', () => {
    for (const cell of ['120', '1.200', '5,5', '12%', '-2%', '−3,5%', ' 42 ']) {
      expect(isNumericCell(cell)).toBe(true)
    }
  })

  it('không coi chữ là số', () => {
    for (const cell of ['Q1', 'Ổn định', '', '12 tỷ']) expect(isNumericCell(cell)).toBe(false)
  })
})
