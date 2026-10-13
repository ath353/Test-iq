// Kiểm thử phần soát nội dung Bí kíp: file thật phải hợp lệ; dữ liệu sai phải bị báo đúng chỗ.
import { describe, expect, it } from 'vitest'
import { CATEGORY_OPTIONS } from '../config/testOptions'
import tipsData from '../data/tips.json'
import { TIPS, validateTips } from './tips'

/** Bản sao sâu của nội dung thật để sửa thử mà không ảnh hưởng file gốc. */
const clone = () => JSON.parse(JSON.stringify(tipsData))

describe('Nội dung Bí kíp (file thật)', () => {
  it('hợp lệ, không có lỗi', () => {
    expect(validateTips(tipsData)).toEqual([])
  })

  it('mọi dạng bài trên trang chủ đều có bí kíp, đủ 5 nhóm: nhận dạng, quy trình, mẹo nhanh, bẫy, cách luyện', () => {
    for (const option of CATEGORY_OPTIONS) {
      if (option.id === 'mixed') continue
      const tips = TIPS.categories[option.id]
      expect(tips.sections.map((s) => s.id)).toEqual(['recognize', 'process', 'speed', 'traps', 'practice'])
    }
  })

  it('lộ trình người mới có đủ giai đoạn, bản rút gọn và dấu hiệu sẵn sàng', () => {
    expect(TIPS.beginnerPlan.phases.length).toBeGreaterThanOrEqual(4)
    expect(TIPS.beginnerPlan.readiness.items.length).toBeGreaterThan(0)
    expect(TIPS.beginnerPlan.shortPlan.items.length).toBeGreaterThan(0)
  })

  it('lời khuyên dùng đúng tên lựa chọn đang có trên web (tốc độ, độ khó)', () => {
    const text = JSON.stringify(tipsData)
    for (const name of ['Không giới hạn', 'Thoải mái', 'Chuẩn', 'Áp lực', 'Hỗn hợp']) expect(text).toContain(name)
    // Tên cũ / không tồn tại thì không được xuất hiện
    expect(text).not.toMatch(/tốc độ (Nhanh|Chậm)/)
  })
})

describe('validateTips (dữ liệu sai)', () => {
  it('báo dạng bài thiếu bí kíp', () => {
    const data = clone()
    delete data.categories['word-problem']
    expect(validateTips(data)).toContain('Dạng "Toán đố": chưa có bí kíp')
  })

  it('báo ý rỗng và id trùng', () => {
    const data = clone()
    data.general[0].items[1] = '  '
    data.general[1].id = data.general[0].id
    const errors = validateTips(data)
    expect(errors.some((e) => e.includes('Bí kíp chung, nhóm 1') && e.includes('ý 2'))).toBe(true)
    expect(errors.some((e) => e.includes('bị trùng'))).toBe(true)
  })

  it('báo giai đoạn lộ trình thiếu mục tiêu hoặc không có việc cần làm', () => {
    const data = clone()
    data.beginnerPlan.phases[0].goal = ''
    data.beginnerPlan.phases[1].tasks = []
    const errors = validateTips(data)
    expect(errors).toContain('Lộ trình, giai đoạn 1: thiếu "goal"')
    expect(errors.some((e) => e.startsWith('Lộ trình, giai đoạn 2'))).toBe(true)
  })
})
