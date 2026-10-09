// Kiểm thử cách tính thời gian theo mức tốc độ và hệ số của dạng bài.
import { describe, expect, it } from 'vitest'
import type { TestConfig } from '../types/question'
import { findSpeedId, getSecondsPerQuestion, getSpeedLabel, SPEED_OPTIONS } from './testOptions'

/** Lấy mức tốc độ theo mã. */
const speed = (id: string) => SPEED_OPTIONS.find((s) => s.id === id)!

describe('getSecondsPerQuestion', () => {
  it('Dãy số giữ nguyên mức gốc, Số liệu gấp đôi', () => {
    expect(getSecondsPerQuestion(speed('standard'), 'number-series')).toBe(45)
    expect(getSecondsPerQuestion(speed('standard'), 'numerical')).toBe(90)
    expect(getSecondsPerQuestion(speed('pressure'), 'numerical')).toBe(60)
    expect(getSecondsPerQuestion(speed('relaxed'), 'numerical')).toBe(120)
  })

  it('Không giới hạn thì trả về null với mọi dạng bài', () => {
    expect(getSecondsPerQuestion(speed('unlimited'), 'numerical')).toBeNull()
  })
})

describe('getSpeedLabel', () => {
  it('nhãn đổi theo dạng bài', () => {
    expect(getSpeedLabel(speed('standard'), 'number-series')).toBe('Chuẩn · 45 giây/câu')
    expect(getSpeedLabel(speed('standard'), 'numerical')).toBe('Chuẩn · 90 giây/câu')
    expect(getSpeedLabel(speed('unlimited'), 'numerical')).toBe('Không giới hạn')
  })
})

describe('findSpeedId', () => {
  /** Tạo cấu hình mẫu. */
  const config = (category: TestConfig['category'], timeLimitSec: number | null): TestConfig => ({
    category,
    questionCount: 10,
    difficulty: 'mixed',
    timeLimitSec,
  })

  it('tìm lại đúng mức tốc độ từ cấu hình cũ, có tính hệ số dạng bài', () => {
    expect(findSpeedId(config('number-series', 300))).toBe('pressure') // 10 câu × 30 giây
    expect(findSpeedId(config('numerical', 600))).toBe('pressure') // 10 câu × 60 giây
    expect(findSpeedId(config('numerical', 900))).toBe('standard') // 10 câu × 90 giây
    expect(findSpeedId(config('numerical', null))).toBe('unlimited')
  })

  it('không có cấu hình cũ hoặc không khớp thì dùng mức mặc định', () => {
    expect(findSpeedId(null)).toBe('standard')
    expect(findSpeedId(config('number-series', 123))).toBe('standard')
  })
})
