// Hàm tiện ích cho hình vẽ (dạng Suy luận hình): toạ độ các đỉnh, vị trí xếp hình, mô tả bằng lời.
// Tách khỏi component để test được và dùng lại cho bộ sinh đề.

import type { Figure, ShapeFill, ShapeKind } from '../types/figure'

/** Tên tiếng Việt của từng dạng hình. */
export const SHAPE_NAMES: Record<ShapeKind, string> = {
  circle: 'hình tròn',
  square: 'hình vuông',
  triangle: 'tam giác',
  diamond: 'hình thoi',
  pentagon: 'ngũ giác',
  hexagon: 'lục giác',
  star: 'ngôi sao',
  arrow: 'mũi tên',
}

/** Tên tiếng Việt của từng kiểu tô. */
export const FILL_NAMES: Record<ShapeFill, string> = {
  solid: 'tô đặc',
  outline: 'để rỗng',
  striped: 'kẻ sọc',
}

/**
 * Chu kỳ đối xứng xoay của từng dạng hình (độ): xoay một góc bằng bội số của chu kỳ thì hình trông y hệt.
 * Ví dụ tam giác đều: xoay 120° trông như cũ. Hình tròn: xoay bao nhiêu cũng như cũ (chu kỳ 0 = luôn giống).
 * Bộ sinh đề dùng để tránh quy luật xoay "vô hình" (xoay mà mắt không thấy khác).
 */
export const ROTATION_PERIOD: Record<ShapeKind, number> = {
  circle: 0,
  square: 90,
  diamond: 90,
  triangle: 120,
  pentagon: 72,
  hexagon: 60,
  star: 72,
  arrow: 360,
}

/**
 * Hai góc xoay có cho ra cùng một hình nhìn thấy không (xét chu kỳ đối xứng của dạng hình).
 * Ví dụ tam giác: 0° và 120° là giống nhau; mũi tên: 0° và 180° là khác nhau.
 */
export function isSameRotation(shape: ShapeKind, a: number, b: number): boolean {
  const period = ROTATION_PERIOD[shape]
  if (period === 0) return true
  return (((a - b) % period) + period) % period === 0
}

/** Một điểm trong hệ toạ độ của hình (tâm ở 0,0, bán kính 1). */
export interface Point {
  x: number
  y: number
}

/**
 * Các đỉnh của đa giác đều n cạnh, bán kính 1, đỉnh đầu tiên hướng lên trên.
 * @param n Số đỉnh.
 * @param startDeg Góc của đỉnh đầu tiên (−90 = thẳng lên trên).
 */
export function regularPolygon(n: number, startDeg = -90): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const angle = ((startDeg + (360 / n) * i) * Math.PI) / 180
    return { x: Math.cos(angle), y: Math.sin(angle) }
  })
}

/** Các đỉnh của ngôi sao 5 cánh: xen kẽ đỉnh ngoài (bán kính 1) và đỉnh trong (bán kính 0,45). */
export function starPoints(): Point[] {
  return Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? 1 : 0.45
    const angle = ((-90 + 36 * i) * Math.PI) / 180
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
  })
}

/** Các đỉnh của mũi tên chỉ lên trên (đầu tam giác + thân chữ nhật), nằm gọn trong bán kính 1. */
export function arrowPoints(): Point[] {
  return [
    { x: 0, y: -1 },
    { x: 0.7, y: -0.2 },
    { x: 0.28, y: -0.2 },
    { x: 0.28, y: 0.9 },
    { x: -0.28, y: 0.9 },
    { x: -0.28, y: -0.2 },
    { x: -0.7, y: -0.2 },
  ]
}

/**
 * Đỉnh của một dạng hình (trừ hình tròn), chưa xoay, tâm (0,0), bán kính 1.
 * Hình vuông dùng 4 đỉnh ở góc 45° để cạnh nằm ngang; hình thoi là 4 đỉnh thẳng trên-dưới-trái-phải.
 */
export function shapePoints(shape: Exclude<ShapeKind, 'circle'>): Point[] {
  switch (shape) {
    case 'square':
      return regularPolygon(4, -45).map((p) => ({ x: p.x * 0.85, y: p.y * 0.85 }))
    case 'diamond':
      return regularPolygon(4, -90)
    case 'triangle':
      return regularPolygon(3)
    case 'pentagon':
      return regularPolygon(5)
    case 'hexagon':
      return regularPolygon(6)
    case 'star':
      return starPoints()
    case 'arrow':
      return arrowPoints()
  }
}

/**
 * Đặt hình vào ô: xoay quanh tâm hình (theo chiều kim đồng hồ), phóng theo bán kính, rồi dời tới vị trí.
 * Tính sẵn toạ độ thay vì dùng transform của SVG, để mẫu kẻ sọc không bị phóng to theo hình.
 * @param points Đỉnh của hình (tâm 0,0, bán kính 1).
 * @param slot Vị trí và bán kính trong ô.
 * @param rotationDeg Góc xoay (độ).
 */
export function placePoints(points: Point[], slot: Slot, rotationDeg: number): Point[] {
  const angle = (rotationDeg * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  // Trục y của SVG hướng xuống dưới, nên công thức xoay này cho chiều kim đồng hồ trên màn hình
  return points.map((p) => ({
    x: slot.x + slot.radius * (p.x * cos - p.y * sin),
    y: slot.y + slot.radius * (p.x * sin + p.y * cos),
  }))
}

/** Chuyển danh sách đỉnh thành chuỗi cho thuộc tính points của SVG, làm tròn 3 chữ số cho gọn. */
export function toSvgPoints(points: Point[]): string {
  return points.map((p) => `${+p.x.toFixed(3)},${+p.y.toFixed(3)}`).join(' ')
}

/** Vị trí đặt một hình trong ô (hệ toạ độ ô 100 × 100) và bán kính hình. */
export interface Slot {
  x: number
  y: number
  radius: number
}

/**
 * Cách xếp 1–4 hình trong ô 100 × 100 sao cho không chồng lên nhau và cân đối:
 * 1 hình ở giữa; 2 hình nằm ngang; 3 hình xếp tam giác; 4 hình xếp lưới 2 × 2.
 * @param count Số hình (1–4).
 */
export function layoutSlots(count: number): Slot[] {
  switch (count) {
    case 1:
      return [{ x: 50, y: 50, radius: 32 }]
    case 2:
      return [
        { x: 28, y: 50, radius: 19 },
        { x: 72, y: 50, radius: 19 },
      ]
    case 3:
      return [
        { x: 50, y: 28, radius: 17 },
        { x: 28, y: 70, radius: 17 },
        { x: 72, y: 70, radius: 17 },
      ]
    case 4:
      return [
        { x: 29, y: 29, radius: 17 },
        { x: 71, y: 29, radius: 17 },
        { x: 29, y: 71, radius: 17 },
        { x: 71, y: 71, radius: 17 },
      ]
    default:
      throw new Error(`Số hình trong ô phải từ 1 đến 4 (đang là ${count})`)
  }
}

/**
 * Mô tả một ô hình bằng lời, dùng cho trình đọc màn hình và lời giải.
 * Ví dụ: "2 tam giác tô đặc, xoay 90°". Góc xoay chỉ nêu khi hình nhìn thấy khác với lúc chưa xoay.
 */
export function describeFigure(figure: Figure): string {
  const base = `${figure.count} ${SHAPE_NAMES[figure.shape]} ${FILL_NAMES[figure.fill]}`
  return isSameRotation(figure.shape, figure.rotation, 0) ? base : `${base}, xoay ${figure.rotation}°`
}
