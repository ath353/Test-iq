// Kiểm thử các hàm xử lý thời gian.
import { describe, expect, it } from 'vitest'
import { formatTime, getRemainingSec } from './time'

describe('formatTime', () => {
  it('định dạng đúng phút:giây, giây luôn 2 chữ số', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(5)).toBe('0:05')
    expect(formatTime(75)).toBe('1:15')
    expect(formatTime(600)).toBe('10:00')
  })

  it('bỏ phần lẻ và coi số âm là 0', () => {
    expect(formatTime(59.9)).toBe('0:59')
    expect(formatTime(-3)).toBe('0:00')
  })
})

describe('getRemainingSec', () => {
  it('làm tròn lên phần giây lẻ', () => {
    expect(getRemainingSec(10_000, 0)).toBe(10)
    expect(getRemainingSec(10_000, 500)).toBe(10)
    expect(getRemainingSec(10_000, 9_001)).toBe(1)
  })

  it('trả về 0 khi đã đến hoặc quá thời điểm kết thúc', () => {
    expect(getRemainingSec(10_000, 10_000)).toBe(0)
    expect(getRemainingSec(10_000, 99_000)).toBe(0)
  })
})
