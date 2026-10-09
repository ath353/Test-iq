// Bộ sinh câu hỏi dạng CHUỖI HÌNH (kiểu SHL Inductive Reasoning): cho 5 hình, tìm hình thứ 6.
//
// Mỗi thuộc tính của hình (dạng hình, kiểu tô, số lượng, góc xoay) biến đổi theo MỘT quy luật dọc chuỗi:
//   - constant : không đổi.
//   - cycle2   : lặp lại theo chu kỳ 2 (A, B, A, B, …).
//   - cycle3   : lặp lại theo chu kỳ 3 (A, B, C, A, B, C, …).
//   - rotate   : (chỉ góc xoay) mỗi hình xoay thêm một góc cố định (45° hoặc 90°).
// Độ khó = số thuộc tính thay đổi (1 / 2 / 3); mức khó luôn có ít nhất một chu kỳ 3
// (hai chu kỳ khác nhau chạy song song rất khó nhận ra).
//
// Đảm bảo chỉ một đáp án đúng: giống ma trận (abstract.ts), mỗi đáp án nhiễu được đặt thử vào vị trí thứ 6;
// nếu chuỗi vẫn hợp lệ theo bất kỳ quy luật nào thì loại.

import type { Figure, ShapeKind } from '../types/figure'
import type { Difficulty, Option, Question } from '../types/question'
import { describeFigure, FILL_NAMES, SHAPE_NAMES } from '../utils/figure'
import { pickOne, randomInt, shuffle } from '../utils/random'
import {
  ALL_COUNTS,
  ALL_FILLS,
  ALL_SHAPES,
  ATTRIBUTES,
  type Attribute,
  ROTATABLE_SHAPES,
  sameFigure,
  visualRotation,
} from './abstract'

/** Số hình trong chuỗi (kể cả hình cần tìm ở cuối). */
export const SEQUENCE_LENGTH = 6

/** Các loại quy luật của chuỗi. */
export type SequenceRule = 'constant' | 'cycle2' | 'cycle3' | 'rotate'

const VARYING_COUNT: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 }
const OPTION_IDS = ['A', 'B', 'C', 'D', 'E']

// ─────────────────────────────── Kiểm tra quy luật ───────────────────────────────

/** Giá trị nhìn thấy của một thuộc tính (góc xoay quy về chu kỳ đối xứng của dạng hình). */
function visibleValue(figure: Figure, attribute: Attribute): string | number {
  return attribute === 'rotation' ? visualRotation(figure.shape, figure.rotation) : figure[attribute]
}

/**
 * Các quy luật mà một thuộc tính đang thỏa mãn trên cả chuỗi (đã điền hình cuối).
 * @param cells Toàn bộ chuỗi hình.
 * @param attribute Thuộc tính cần xét.
 */
export function sequenceRules(cells: Figure[], attribute: Attribute): SequenceRule[] {
  const v = cells.map((f) => visibleValue(f, attribute))
  const rules: SequenceRule[] = []
  const periodic = (p: number) => v.every((x, i) => i < p || x === v[i - p])

  if (v.every((x) => x === v[0])) rules.push('constant')
  // Chu kỳ 2: lặp lại sau 2 hình, và hai giá trị trong chu kỳ khác nhau
  if (periodic(2) && v[0] !== v[1]) rules.push('cycle2')
  // Chu kỳ 3: lặp lại sau 3 hình, và ba giá trị trong chu kỳ khác nhau từng đôi
  if (periodic(3) && new Set(v.slice(0, 3)).size === 3) rules.push('cycle3')

  if (attribute === 'rotation') {
    // Xoay đều: bước xoay (góc gốc, mod 360) giống nhau giữa mọi cặp hình liền nhau, khác 0,
    // và hai hình liền nhau phải NHÌN khác nhau (tránh xoay mà mắt không thấy khác)
    const raw = cells.map((f) => ((f.rotation % 360) + 360) % 360)
    const step = (i: number) => (((raw[i + 1] - raw[i]) % 360) + 360) % 360
    const steady = step(0) !== 0 && raw.slice(0, -1).every((_, i) => step(i) === step(0))
    const distinct = v.slice(0, -1).every((x, i) => x !== v[i + 1])
    if (steady && distinct) rules.push('rotate')
  }
  return rules
}

/** Chuỗi có hợp lệ không: MỌI thuộc tính đều thỏa mãn ít nhất một quy luật. */
export function isValidSequence(cells: Figure[]): boolean {
  return ATTRIBUTES.every((a) => sequenceRules(cells, a).length > 0)
}

// ─────────────────────────────── Sinh chuỗi ───────────────────────────────

/** Kế hoạch một thuộc tính: quy luật + giá trị tại từng vị trí trong chuỗi. */
interface SequencePlan<T> {
  rule: SequenceRule
  values: T[]
}

/** Toàn bộ kế hoạch một chuỗi. */
export interface SeriesPlan {
  shape: SequencePlan<ShapeKind>
  fill: SequencePlan<Figure['fill']>
  count: SequencePlan<number>
  rotation: SequencePlan<number>
  /** Bước xoay (độ) nếu góc xoay theo quy luật xoay đều. */
  rotationStep?: number
}

/** Dãy lặp lại theo chu kỳ: chọn `period` giá trị khác nhau rồi lặp cho đủ độ dài chuỗi. */
function cycle<T>(domain: T[], period: number): T[] {
  const base = shuffle(domain).slice(0, period)
  return Array.from({ length: SEQUENCE_LENGTH }, (_, i) => base[i % period])
}

/** Dãy không đổi. */
function constant<T>(value: T): T[] {
  return Array.from({ length: SEQUENCE_LENGTH }, () => value)
}

/**
 * Chọn các thuộc tính thay đổi theo độ khó.
 * Ràng buộc: góc xoay thay đổi thì dạng hình phải cố định (một hình xoay được) để quy luật xoay nhìn rõ.
 */
function chooseVarying(difficulty: Difficulty): Attribute[] {
  for (;;) {
    const chosen = shuffle(ATTRIBUTES).slice(0, VARYING_COUNT[difficulty])
    if (!(chosen.includes('rotation') && chosen.includes('shape'))) return chosen
  }
}

/**
 * Lập kế hoạch ngẫu nhiên cho một chuỗi.
 * - Dễ: chỉ chu kỳ 2 hoặc xoay 90°.
 * - Trung bình: chu kỳ 2 / 3, xoay 45° hoặc 90°; KHÔNG được mọi thuộc tính thay đổi đều theo chu kỳ 2
 *   (khi đó cả chuỗi lặp lại sau 2 hình, đáp án chính là hình thứ 4 → chỉ cần "chép", quá dễ).
 * - Khó: như trung bình, và có ít nhất một thuộc tính theo chu kỳ 3.
 */
export function planSeries(difficulty: Difficulty): SeriesPlan {
  for (;;) {
    const varying = chooseVarying(difficulty)
    const rotationVaries = varying.includes('rotation')
    const periods = difficulty === 'easy' ? [2] : [2, 3]
    const cyclePlan = <T>(domain: T[]): SequencePlan<T> => {
      const p = pickOne(periods)
      return { rule: p === 2 ? 'cycle2' : 'cycle3', values: cycle(domain, p) }
    }

    const shape: SequencePlan<ShapeKind> = varying.includes('shape')
      ? cyclePlan(ALL_SHAPES)
      : { rule: 'constant', values: constant(pickOne(rotationVaries ? ROTATABLE_SHAPES : ALL_SHAPES)) }
    const fill = varying.includes('fill') ? cyclePlan(ALL_FILLS) : { rule: 'constant' as const, values: constant(pickOne(ALL_FILLS)) }
    const count = varying.includes('count') ? cyclePlan(ALL_COUNTS) : { rule: 'constant' as const, values: constant(randomInt(1, 4)) }

    let rotation: SequencePlan<number> = { rule: 'constant', values: constant(0) }
    let rotationStep: number | undefined
    if (rotationVaries) {
      // Tam giác chỉ xoay 90° (45° trông lệch); mức dễ chỉ xoay 90°
      rotationStep = shape.values[0] === 'arrow' && difficulty !== 'easy' ? pickOne([45, 90]) : 90
      const start = pickOne([0, 90, 180, 270])
      rotation = { rule: 'rotate', values: Array.from({ length: SEQUENCE_LENGTH }, (_, i) => (start + i * rotationStep!) % 360) }
    }

    const plan: SeriesPlan = { shape, fill, count, rotation, rotationStep }
    const varyingRules = [shape, fill, count, rotation].map((p) => p.rule).filter((r) => r !== 'constant')
    // Mức trung bình: không để mọi thuộc tính thay đổi cùng chu kỳ 2 (chuỗi lặp sau 2 hình, chỉ cần chép)
    if (difficulty === 'medium' && varyingRules.every((r) => r === 'cycle2')) continue
    // Mức khó: bắt buộc có ít nhất một chu kỳ 3 (nếu chưa có thì lập kế hoạch lại)
    if (difficulty === 'hard' && !varyingRules.includes('cycle3')) continue
    return plan
  }
}

/** Ghép kế hoạch thành chuỗi hình. */
export function buildSeriesCells(plan: SeriesPlan): Figure[] {
  return Array.from({ length: SEQUENCE_LENGTH }, (_, i) => ({
    shape: plan.shape.values[i],
    fill: plan.fill.values[i],
    count: plan.count.values[i],
    rotation: plan.rotation.values[i],
  }))
}

// ─────────────────────────────── Đáp án nhiễu ───────────────────────────────

/** Các biến thể của đáp án khi đổi đúng MỘT thuộc tính. */
function variantsOf(answer: Figure, attribute: Attribute): Figure[] {
  switch (attribute) {
    case 'shape':
      return ALL_SHAPES.filter((s) => s !== answer.shape).map((shape) => ({ ...answer, shape }))
    case 'fill':
      return ALL_FILLS.filter((f) => f !== answer.fill).map((fill) => ({ ...answer, fill }))
    case 'count':
      return ALL_COUNTS.filter((n) => n !== answer.count).map((count) => ({ ...answer, count }))
    case 'rotation':
      // Chỉ xoay tam giác / mũi tên (hình vuông xoay 45° trông như hình thoi, dễ gây nhầm)
      return ROTATABLE_SHAPES.includes(answer.shape)
        ? [45, 90, 180, 270].map((d) => ({ ...answer, rotation: (answer.rotation + d) % 360 }))
        : []
  }
}

/**
 * Tạo 4 đáp án nhiễu, ưu tiên:
 *   1. Lặp lại hình cuối hoặc hình đầu của chuỗi (bẫy "chép hình đã thấy").
 *   2. Đáp án sai đúng một thuộc tính đang thay đổi (hiểu sai quy luật).
 *   3. Đáp án sai một thuộc tính cố định (bổ sung khi chưa đủ).
 * Mỗi đáp án nhiễu nhìn khác đáp án đúng, khác nhau, và KHÔNG làm chuỗi hợp lệ khi đặt vào vị trí cuối.
 */
export function buildSeriesDistractors(cells: Figure[], plan: SeriesPlan): Figure[] {
  const answer = cells[SEQUENCE_LENGTH - 1]
  const varying = ATTRIBUTES.filter((a) => plan[a].rule !== 'constant')
  const fixed = ATTRIBUTES.filter((a) => plan[a].rule === 'constant')
  const candidates = [
    ...shuffle([cells[SEQUENCE_LENGTH - 2], cells[0]]),
    ...shuffle(varying.flatMap((a) => variantsOf(answer, a))),
    ...shuffle(fixed.flatMap((a) => variantsOf(answer, a))),
  ]
  const known = cells.slice(0, SEQUENCE_LENGTH - 1)
  const result: Figure[] = []
  for (const c of candidates) {
    if (result.length >= 4) break
    if (sameFigure(c, answer) || result.some((r) => sameFigure(r, c))) continue
    if (isValidSequence([...known, c])) continue
    result.push(c)
  }
  return result
}

// ─────────────────────────────── Lời giải ───────────────────────────────

/** Viết lời giải: mỗi thuộc tính một bước, bước cuối nêu hình cần tìm. */
export function explainSeries(plan: SeriesPlan, answer: Figure): string[] {
  const steps = ['Quan sát lần lượt từng đặc điểm của các hình từ trái sang phải.']

  /** Diễn đạt một thuộc tính dạng "loại" hoặc số lượng theo quy luật của nó. */
  const describe = <T,>(label: string, p: SequencePlan<T>, name: (v: T) => string) => {
    const last = name(p.values[SEQUENCE_LENGTH - 1])
    if (p.rule === 'constant') return `${label}: không đổi (${name(p.values[0])}).`
    const period = p.rule === 'cycle2' ? 2 : 3
    const cycleValues = p.values.slice(0, period).map(name).join(' → ')
    return `${label}: lặp lại theo chu kỳ ${period} hình (${cycleValues} → …); hình thứ 6 là ${last}.`
  }
  steps.push(describe('Dạng hình', plan.shape, (v) => SHAPE_NAMES[v]))
  steps.push(describe('Kiểu tô', plan.fill, (v) => FILL_NAMES[v]))
  steps.push(describe('Số lượng', plan.count, (v) => `${v} hình`))
  if (plan.rotation.rule === 'rotate') {
    const angles = plan.rotation.values.map((a) => `${a}°`).join(' → ')
    steps.push(`Góc xoay: mỗi hình xoay thêm ${plan.rotationStep}° theo chiều kim đồng hồ (${angles}).`)
  }
  steps.push(`Hình cần tìm: ${describeFigure(answer)}.`)
  return steps
}

// ─────────────────────────────── Ghép thành câu hỏi ───────────────────────────────

/**
 * Sinh một câu hỏi chuỗi hình hoàn chỉnh.
 * @param id Mã câu hỏi.
 * @param difficulty Độ khó.
 * @returns Câu hỏi: dữ kiện là chuỗi 6 ô (ô cuối trống), 5 lựa chọn dạng hình đã xáo trộn.
 */
export function generateSeriesQuestion(id: string, difficulty: Difficulty): Question {
  const plan = planSeries(difficulty)
  const cells = buildSeriesCells(plan)
  const answer = cells[SEQUENCE_LENGTH - 1]
  const figures = shuffle([answer, ...buildSeriesDistractors(cells, plan)])
  const options: Option[] = figures.map((figure, i) => ({ id: OPTION_IDS[i], content: describeFigure(figure), figure }))

  return {
    id,
    category: 'abstract',
    difficulty,
    instruction: 'Quan sát quy luật biến đổi của chuỗi hình từ trái sang phải.',
    stimulus: { type: 'sequence', cells: [...cells.slice(0, SEQUENCE_LENGTH - 1), null] },
    prompt: 'Hình nào là hình tiếp theo của chuỗi?',
    options,
    correctOptionId: OPTION_IDS[figures.indexOf(answer)],
    explanationSteps: explainSeries(plan, answer),
  }
}
