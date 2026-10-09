// Kiểm thử component vẽ hình: kết xuất ra SVG rồi kiểm tra nội dung.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Figure } from '../types/figure'
import FigureView from './FigureView'

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
