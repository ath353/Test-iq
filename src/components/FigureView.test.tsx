// Kiểm thử component vẽ hình: kết xuất ra SVG rồi kiểm tra nội dung.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Figure } from '../types/figure'
import { generateAbstractQuestion } from '../generators/abstract'
import FigureView from './FigureView'
import QuestionCard from './QuestionCard'

/** Kết xuất một ô hình ra chuỗi SVG. */
const render = (figure: Figure) => renderToStaticMarkup(<FigureView figure={figure} />)

describe('FigureView', () => {
  it('vẽ đúng số hình trong ô', () => {
    for (let count = 1; count <= 4; count++) {
      const svg = render({ shape: 'triangle', fill: 'outline', count, rotation: 0 })
      expect(svg.match(/<polygon/g)).toHaveLength(count)
    }
    expect(render({ shape: 'circle', fill: 'solid', count: 3, rotation: 0 }).match(/<circle/g)).toHaveLength(3)
  })

  it('kiểu tô: đặc dùng màu chữ, rỗng không tô, sọc dùng mẫu kẻ sọc', () => {
    expect(render({ shape: 'square', fill: 'solid', count: 1, rotation: 0 })).toContain('fill="currentColor"')
    expect(render({ shape: 'square', fill: 'outline', count: 1, rotation: 0 })).toContain('fill="none"')
    const striped = render({ shape: 'square', fill: 'striped', count: 1, rotation: 0 })
    expect(striped).toContain('<pattern')
    expect(striped).toMatch(/fill="url\(#stripes-[^"]+\)"/)
  })

  it('có mô tả bằng lời cho trình đọc màn hình', () => {
    expect(render({ shape: 'star', fill: 'solid', count: 2, rotation: 0 })).toContain(
      'aria-label="2 ngôi sao tô đặc"',
    )
  })

  it('hai ô kẻ sọc trên cùng trang có mã mẫu khác nhau (không dùng nhầm mẫu của nhau)', () => {
    const html = renderToStaticMarkup(
      <>
        <FigureView figure={{ shape: 'square', fill: 'striped', count: 1, rotation: 0 }} />
        <FigureView figure={{ shape: 'circle', fill: 'striped', count: 1, rotation: 0 }} />
      </>,
    )
    const ids = [...html.matchAll(/<pattern id="([^"]+)"/g)].map((m) => m[1])
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })
})

describe('Hiển thị câu Suy luận hình', () => {
  it('ma trận có 8 hình và 1 ô dấu "?"; lựa chọn hiện hình và đọc được bằng mô tả', () => {
    const q = generateAbstractQuestion('q', 'medium')
    const html = renderToStaticMarkup(<QuestionCard question={q} selectedOptionId={null} onSelect={() => {}} />)
    expect(html).toContain('matrix-view__cell--missing')
    // 8 ô ma trận + 5 lựa chọn = 13 hình SVG
    expect(html.match(/<svg/g)).toHaveLength(13)
    expect(html).toContain('question-card__options--figures')
    for (const o of q.options) expect(html).toContain(`aria-label="Lựa chọn ${o.id}: ${o.content}"`)
  })
})
