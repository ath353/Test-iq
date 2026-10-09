// Kiểm thử cách tính thời gian theo mức tốc độ và hệ số của dạng bài.
import { describe, expect, it } from 'vitest'
import type { TestConfig } from '../types/question'
import {
  findSpeedId,
  getQuestionCountChoices,
  getSecondsPerQuestion,
  getSpeedLabel,
  resolveQuestionCount,
  SPEED_OPTIONS,
} from './testOptions'

/** Lấy mức tốc độ theo mã. */
const speed = (id: string) => SPEED_OPTIONS.find((s) => s.id === id)!

describe('getSecondsPerQuestion', () => {
  it('Dãy số giữ nguyên mức gốc, Số liệu gấp đôi', () => {
    expect(getSecondsPerQuestion(speed('standard'), 'number-series')).toBe(45)
    expect(getSecondsPerQuestion(speed('standard'), 'numerical')).toBe(90)
    expect(getSecondsPerQuestion(speed('pressure'), 'numerical')).toBe(60)
    expect(getSecondsPerQuestion(speed('relaxed'), 'numerical')).toBe(120)
  })

  it('Suy luận hình (hệ số 4/3): 80 / 60 / 40 giây, là số nguyên', () => {
    expect(getSecondsPerQuestion(speed('relaxed'), 'abstract')).toBe(80)
    expect(getSecondsPerQuestion(speed('standard'), 'abstract')).toBe(60)
    expect(getSecondsPerQuestion(speed('pressure'), 'abstract')).toBe(40)
    expect(getSpeedLabel(speed('standard'), 'abstract')).toBe('Chuẩn · 60 giây/câu')
    expect(findSpeedId({ category: 'abstract', questionCount: 10, difficulty: 'mixed', timeLimitSec: 400 })).toBe('pressure')
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

describe('getQuestionCountChoices', () => {
  it('dạng sinh bằng code: 10/20/30, không khóa lựa chọn nào', () => {
    expect(getQuestionCountChoices('number-series', null)).toEqual([
      { count: 10, disabled: false },
      { count: 20, disabled: false },
      { count: 30, disabled: false },
    ])
  })

  it('Logic: chỉ 10/20; khóa lựa chọn vượt quá số câu hiện có', () => {
    expect(getQuestionCountChoices('logical', 40)).toEqual([
      { count: 10, disabled: false },
      { count: 20, disabled: false },
    ])
    expect(getQuestionCountChoices('logical', 13)).toEqual([
      { count: 10, disabled: false },
      { count: 20, disabled: true },
    ])
  })
})

describe('resolveQuestionCount', () => {
  const choices = (...items: [number, boolean][]) => items.map(([count, disabled]) => ({ count, disabled }))

  it('giữ nguyên lựa chọn nếu còn hợp lệ', () => {
    expect(resolveQuestionCount(20, choices([10, false], [20, false]))).toBe(20)
  })

  it('lựa chọn bị khóa thì lùi về lựa chọn lớn nhất còn mở (20 → 10)', () => {
    expect(resolveQuestionCount(20, choices([10, false], [20, true]))).toBe(10)
  })

  it('lựa chọn không có trong danh sách thì lấy lựa chọn lớn nhất không vượt quá (30 → 20)', () => {
    expect(resolveQuestionCount(30, choices([10, false], [20, false]))).toBe(20)
  })

  it('mọi lựa chọn đều bị khóa thì trả về null', () => {
    expect(resolveQuestionCount(10, choices([10, true], [20, true]))).toBeNull()
  })
})
