// Kiểm thử trang Bí kíp: kết xuất ra HTML rồi kiểm tra đủ các phần, đúng thứ tự, lộ trình mở sẵn.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CATEGORY_OPTIONS } from '../config/testOptions'
import { TIPS } from '../utils/tips'
import TipsPage from './TipsPage'

const html = renderToStaticMarkup(<TipsPage onHome={() => {}} />)

describe('TipsPage', () => {
  it('lộ trình người mới đứng đầu và mở sẵn; có đủ các giai đoạn', () => {
    expect(html.indexOf('Lộ trình cho người mới bắt đầu')).toBeLessThan(html.indexOf('Bí kíp từng dạng'))
    expect(html).toMatch(/<details class="tips-block" open="">\s*<summary class="tips-block__summary">Lộ trình/)
    for (const phase of TIPS.beginnerPlan.phases) expect(html).toContain(phase.title)
  })

  it('mọi dạng bài trên trang chủ đều có một khối bí kíp (đóng sẵn), kèm mã để link tới', () => {
    for (const option of CATEGORY_OPTIONS) {
      if (option.id === 'mixed') continue
      expect(html).toContain(`<details class="tips-block" id="tips-${option.id}"><summary class="tips-block__summary">${option.label}</summary>`)
    }
  })

  it('hiện đủ nội dung: mọi ý của bí kíp chung và của từng dạng', () => {
    // So sánh sau khi kết xuất: React đổi ký tự đặc biệt (dấu nháy…) thành mã HTML, nên kết xuất ý mẫu theo cùng cách
    const escape = (text: string) => renderToStaticMarkup(<>{text}</>)
    for (const section of TIPS.general) for (const item of section.items) expect(html).toContain(escape(item))
    for (const tips of Object.values(TIPS.categories)) {
      for (const section of tips.sections) for (const item of section.items) expect(html).toContain(escape(item))
    }
  })
})
