// Kiểm thử các hàm hình học của dạng Suy luận hình.
import { describe, expect, it } from 'vitest'
import type { ShapeKind } from '../types/figure'
import {
  describeFigure,
  isSameRotation,
  layoutSlots,
  placePoints,
  regularPolygon,
  shapePoints,
  type Point,
} from './figure'

const SHAPES_WITH_POINTS: Exclude<ShapeKind, 'circle'>[] = [
  'square',
  'triangle',
  'diamond',
  'pentagon',
  'hexagon',
  'star',
  'arrow',
]

/** Khoảng cách từ điểm tới tâm (0,0). */
const radiusOf = (p: Point) => Math.hypot(p.x, p.y)

describe('regularPolygon', () => {
  it('n đỉnh cách đều tâm một khoảng bằng 1, đỉnh đầu tiên thẳng lên trên', () => {
    const points = regularPolygon(5)
    expect(points).toHaveLength(5)
    for (const p of points) expect(radiusOf(p)).toBeCloseTo(1)
    expect(points[0].x).toBeCloseTo(0)
    expect(points[0].y).toBeCloseTo(-1)
  })
})

describe('shapePoints', () => {
  it('mọi dạng hình nằm gọn trong bán kính 1 (không tràn sang hình bên cạnh)', () => {
    for (const shape of SHAPES_WITH_POINTS) {
      for (const p of shapePoints(shape)) expect(radiusOf(p)).toBeLessThanOrEqual(1 + 1e-9)
    }
  })

  it('số đỉnh đúng với từng dạng hình', () => {
    expect(shapePoints('triangle')).toHaveLength(3)
    expect(shapePoints('square')).toHaveLength(4)
    expect(shapePoints('hexagon')).toHaveLength(6)
    expect(shapePoints('star')).toHaveLength(10)
  })
})

describe('layoutSlots', () => {
  it('1–4 hình: nằm trong ô 100 × 100 và không chồng lên nhau', () => {
    for (let count = 1; count <= 4; count++) {
      const slots = layoutSlots(count)
      expect(slots).toHaveLength(count)
      for (const s of slots) {
        expect(s.x - s.radius).toBeGreaterThanOrEqual(0)
        expect(s.x + s.radius).toBeLessThanOrEqual(100)
        expect(s.y - s.radius).toBeGreaterThanOrEqual(0)
        expect(s.y + s.radius).toBeLessThanOrEqual(100)
      }
      // Hai hình bất kỳ: khoảng cách giữa hai tâm lớn hơn tổng hai bán kính
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const distance = Math.hypot(slots[i].x - slots[j].x, slots[i].y - slots[j].y)
          expect(distance).toBeGreaterThan(slots[i].radius + slots[j].radius)
        }
      }
    }
  })

  it('báo lỗi khi số hình ngoài khoảng 1–4', () => {
    expect(() => layoutSlots(0)).toThrow()
    expect(() => layoutSlots(5)).toThrow()
  })
})

describe('placePoints', () => {
  it('xoay 90° theo chiều kim đồng hồ: đỉnh hướng lên chuyển sang hướng phải', () => {
    const [p] = placePoints([{ x: 0, y: -1 }], { x: 50, y: 50, radius: 10 }, 90)
    expect(p.x).toBeCloseTo(60)
    expect(p.y).toBeCloseTo(50)
  })

  it('không xoay: chỉ phóng theo bán kính và dời tới vị trí', () => {
    const [p] = placePoints([{ x: 0.5, y: 0.5 }], { x: 20, y: 30, radius: 10 }, 0)
    expect(p).toEqual({ x: 25, y: 35 })
  })
})

describe('isSameRotation', () => {
  it('xét đúng chu kỳ đối xứng của từng dạng hình', () => {
    expect(isSameRotation('circle', 0, 37)).toBe(true)
    expect(isSameRotation('triangle', 0, 120)).toBe(true)
    expect(isSameRotation('triangle', 0, 90)).toBe(false)
    expect(isSameRotation('square', 0, 90)).toBe(true)
    expect(isSameRotation('square', 0, 45)).toBe(false)
    expect(isSameRotation('arrow', 0, 180)).toBe(false)
    expect(isSameRotation('arrow', -90, 270)).toBe(true)
  })
})

describe('describeFigure', () => {
  it('mô tả bằng lời, chỉ nêu góc xoay khi hình nhìn thấy khác', () => {
    expect(describeFigure({ shape: 'triangle', fill: 'solid', count: 2, rotation: 90 })).toBe(
      '2 tam giác tô đặc, xoay 90°',
    )
    expect(describeFigure({ shape: 'square', fill: 'outline', count: 1, rotation: 90 })).toBe('1 hình vuông để rỗng')
    expect(describeFigure({ shape: 'circle', fill: 'striped', count: 3, rotation: 0 })).toBe('3 hình tròn kẻ sọc')
  })
})
