// Kiểm thử định dạng và làm tròn số.
import { describe, expect, it } from 'vitest'
import { formatNumber, formatPercent, roundTo } from './format'

describe('roundTo', () => {
  it('làm tròn đúng, kể cả các số dễ lỗi số thực', () => {
    expect(roundTo(12.345, 1)).toBe(12.3)
    expect(roundTo(12.35, 1)).toBe(12.4)
    expect(roundTo(1.005, 2)).toBe(1.01)
    expect(roundTo(-2.25, 1)).toBe(-2.3)
    expect(roundTo(7.5, 0)).toBe(8)
  })

  it('không trả về -0', () => {
    expect(Object.is(roundTo(-0.01, 1), 0)).toBe(true)
  })
})

describe('formatNumber', () => {
  it('dấu chấm ngăn hàng nghìn, dấu phẩy ngăn thập phân', () => {
    expect(formatNumber(1234)).toBe('1.234')
    expect(formatNumber(123456)).toBe('123.456')
    expect(formatNumber(1234.56, 1)).toBe('1.234,6')
    expect(formatNumber(12, 1)).toBe('12,0')
    expect(formatNumber(999)).toBe('999')
  })
})

describe('formatPercent', () => {
  it('thêm dấu % và làm tròn 1 chữ số thập phân', () => {
    expect(formatPercent(12.345)).toBe('12,3%')
    expect(formatPercent(5)).toBe('5,0%')
  })
})
