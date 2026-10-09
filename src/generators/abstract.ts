// Bộ sinh câu hỏi dạng Suy luận hình (ma trận 3 × 3, kiểu Raven / SHL).
//
// Mỗi ô là một Figure với 4 thuộc tính: dạng hình, kiểu tô, số lượng, góc xoay.
// Mỗi thuộc tính tuân theo MỘT quy luật, áp dụng giống nhau cho cả 3 hàng (đọc từ trái sang phải):
//   - constant    : không đổi, mọi ô giống nhau.
//   - row         : mỗi hàng một giá trị riêng (3 ô trong hàng giống nhau).
//   - progression : tăng/giảm đều qua từng ô (số lượng +1 / −1; góc xoay +45° / +90°).
//   - latin       : mỗi hàng có đủ 3 giá trị khác nhau, mỗi hàng xếp thứ tự khác (hoán vị).
// Độ khó = số thuộc tính THAY ĐỔI (không phải constant): dễ 1, trung bình 2, khó 3.
// Riêng mức khó không dùng quy luật "row" (liếc là thấy), chỉ dùng hoán vị / tăng dần.
//
// Đảm bảo chỉ một đáp án đúng: mỗi đáp án nhiễu được đặt thử vào ô trống; nếu ma trận vẫn hợp lệ theo
// BẤT KỲ quy luật nào thì loại (isValidMatrix), để không có hai lựa chọn cùng đúng.

import type { Figure, ShapeFill, ShapeKind } from '../types/figure'
import type { Difficulty, Option, Question } from '../types/question'
import { describeFigure, FILL_NAMES, ROTATION_PERIOD, SHAPE_NAMES } from '../utils/figure'
import { pickOne, randomInt, shuffle } from '../utils/random'

/** Các thuộc tính của một ô hình. */
export type Attribute = 'shape' | 'fill' | 'count' | 'rotation'
/** Các loại quy luật (xem giải thích đầu file). */
export type RuleKind = 'constant' | 'row' | 'progression' | 'latin'

const ATTRIBUTES: Attribute[] = ['shape', 'fill', 'count', 'rotation']
const ALL_SHAPES: ShapeKind[] = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon', 'star', 'arrow']
const ALL_FILLS: ShapeFill[] = ['solid', 'outline', 'striped']
const ALL_COUNTS = [1, 2, 3, 4]
/** Dạng hình dùng cho quy luật xoay: xoay 90° nhìn thấy rõ khác (tam giác, mũi tên). */
const ROTATABLE_SHAPES: ShapeKind[] = ['arrow', 'triangle']

/** Số thuộc tính thay đổi theo độ khó. */
const VARYING_COUNT: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 }

/** Số lựa chọn mỗi câu (A–E). */
const OPTION_COUNT = 5
const OPTION_IDS = ['A', 'B', 'C', 'D', 'E']

// ─────────────────────────────── So sánh & kiểm tra quy luật ───────────────────────────────

/** Góc xoay "nhìn thấy": quy về trong một chu kỳ đối xứng của dạng hình (hình tròn luôn là 0). */
export function visualRotation(shape: ShapeKind, rotation: number): number {
  const period = ROTATION_PERIOD[shape]
  return period === 0 ? 0 : ((rotation % period) + period) % period
}

/** Hai ô hình có nhìn giống hệt nhau không (xét cả đối xứng xoay). */
export function sameFigure(a: Figure, b: Figure): boolean {
  return (
    a.shape === b.shape &&
    a.fill === b.fill &&
    a.count === b.count &&
    visualRotation(a.shape, a.rotation) === visualRotation(b.shape, b.rotation)
  )
}

/** Giá trị nhìn thấy của một thuộc tính (góc xoay đã quy về chu kỳ đối xứng). */
function visibleValue(figure: Figure, attribute: Attribute): string | number {
  if (attribute === 'rotation') return visualRotation(figure.shape, figure.rotation)
  return figure[attribute]
}

/** Tách 9 ô thành 3 hàng. */
function toRows<T>(cells: T[]): T[][] {
  return [cells.slice(0, 3), cells.slice(3, 6), cells.slice(6, 9)]
}

/**
 * Các quy luật mà một thuộc tính đang thỏa mãn trên ma trận đầy đủ 9 ô.
 * @param cells 9 ô (đã điền ô cuối).
 * @param attribute Thuộc tính cần xét.
 * @returns Danh sách quy luật thỏa mãn (rỗng nghĩa là thuộc tính này không theo quy luật nào).
 */
export function matchingRules(cells: Figure[], attribute: Attribute): RuleKind[] {
  const rows = toRows(cells.map((f) => visibleValue(f, attribute)))
  const rules: RuleKind[] = []
  const flat = rows.flat()

  if (flat.every((v) => v === flat[0])) rules.push('constant')
  if (rows.every((row) => row.every((v) => v === row[0]))) rules.push('row')

  // Hoán vị: mỗi hàng có đủ 3 giá trị khác nhau, và cả 3 hàng dùng cùng một bộ 3 giá trị
  const sortedKey = (row: (string | number)[]) => [...row].map(String).sort().join('|')
  if (rows.every((row) => new Set(row).size === 3) && rows.every((row) => sortedKey(row) === sortedKey(rows[0]))) {
    rules.push('latin')
  }

  // Tăng dần: chỉ với số lượng và góc xoay; mọi hàng cùng bước nhảy khác 0
  if (attribute === 'count' || attribute === 'rotation') {
    // Góc xoay dùng giá trị gốc (mod 360) vì phép cộng góc không giữ nguyên khi quy về chu kỳ đối xứng
    const raw = toRows(cells.map((f) => (attribute === 'count' ? f.count : ((f.rotation % 360) + 360) % 360)))
    const step = (a: number, b: number) => (attribute === 'rotation' ? (((b - a) % 360) + 360) % 360 : b - a)
    const s = step(raw[0][0], raw[0][1])
    const isProgression = s !== 0 && raw.every((row) => step(row[0], row[1]) === s && step(row[1], row[2]) === s)
    // Với góc xoay, 3 ô trong mỗi hàng còn phải NHÌN khác nhau (tránh xoay mà mắt không thấy khác)
    const visiblyDistinct = attribute === 'count' || rows.every((row) => new Set(row).size === 3)
    if (isProgression && visiblyDistinct) rules.push('progression')
  }
  return rules
}

/** Ma trận 9 ô có hợp lệ không: MỌI thuộc tính đều thỏa mãn ít nhất một quy luật. */
export function isValidMatrix(cells: Figure[]): boolean {
  return ATTRIBUTES.every((attribute) => matchingRules(cells, attribute).length > 0)
}

// ─────────────────────────────── Sinh ma trận ───────────────────────────────

/** Kế hoạch cho một thuộc tính: quy luật + bảng giá trị 3 × 3 ([hàng][cột]). */
interface AttributePlan<T> {
  rule: RuleKind
  grid: T[][]
}

/** Bảng 3 × 3 cùng một giá trị. */
function constantGrid<T>(value: T): T[][] {
  return [0, 1, 2].map(() => [value, value, value])
}

/** Quy luật theo hàng: chọn 3 giá trị khác nhau, mỗi hàng dùng một giá trị. */
function rowGrid<T>(domain: T[]): T[][] {
  const values = shuffle(domain).slice(0, 3)
  return values.map((v) => [v, v, v])
}

/**
 * Quy luật hoán vị: chọn 3 giá trị khác nhau; hàng r, cột c lấy giá trị thứ (c + shift × r) mod 3.
 * shift = 1 hoặc 2 nên mỗi hàng (và mỗi cột) đều có đủ 3 giá trị, thứ tự khác nhau.
 */
function latinGrid<T>(domain: T[]): T[][] {
  const values = shuffle(domain).slice(0, 3)
  const shift = pickOne([1, 2])
  return [0, 1, 2].map((r) => [0, 1, 2].map((c) => values[(c + shift * r) % 3]))
}

/** Số lượng tăng / giảm đều 1 qua từng ô; mỗi hàng có điểm bắt đầu riêng, luôn nằm trong 1–4. */
function countProgressionGrid(): number[][] {
  const step = pickOne([1, -1])
  return [0, 1, 2].map(() => {
    const start = step === 1 ? randomInt(1, 2) : randomInt(3, 4)
    return [0, 1, 2].map((c) => start + c * step)
  })
}

/** Góc xoay tăng đều (45° hoặc 90°) qua từng ô; mỗi hàng có góc bắt đầu riêng. */
function rotationProgressionGrid(shape: ShapeKind): { grid: number[][]; step: number } {
  // Tam giác xoay 45° trông lệch, khó nhìn; chỉ mũi tên mới dùng bước 45°
  const step = shape === 'arrow' ? pickOne([45, 90]) : 90
  const grid = [0, 1, 2].map(() => {
    const start = pickOne([0, 90, 180, 270])
    return [0, 1, 2].map((c) => (start + c * step) % 360)
  })
  return { grid, step }
}

/** Toàn bộ kế hoạch của một ma trận. */
export interface MatrixPlan {
  shape: AttributePlan<ShapeKind>
  fill: AttributePlan<ShapeFill>
  count: AttributePlan<number>
  rotation: AttributePlan<number>
  /** Bước xoay (độ) nếu góc xoay theo quy luật tăng dần. */
  rotationStep?: number
}

/**
 * Chọn các thuộc tính thay đổi theo độ khó.
 * Ràng buộc: nếu góc xoay thay đổi thì dạng hình phải cố định (một hình xoay được), để quy luật xoay nhìn rõ.
 */
function chooseVaryingAttributes(difficulty: Difficulty): Attribute[] {
  for (;;) {
    const chosen = shuffle(ATTRIBUTES).slice(0, VARYING_COUNT[difficulty])
    if (!(chosen.includes('rotation') && chosen.includes('shape'))) return chosen
  }
}

/**
 * Lập kế hoạch ngẫu nhiên cho một ma trận.
 * @param difficulty Độ khó (quyết định số thuộc tính thay đổi).
 */
export function planMatrix(difficulty: Difficulty): MatrixPlan {
  const varying = chooseVaryingAttributes(difficulty)
  const rotationVaries = varying.includes('rotation')
  // Mức khó bỏ quy luật "theo hàng" (liếc là thấy), chỉ dùng hoán vị / tăng dần (phải so sánh nhiều ô)
  const allowRowRule = difficulty !== 'hard'

  const shape: AttributePlan<ShapeKind> = varying.includes('shape')
    ? pickOne([
        () => ({ rule: 'latin' as const, grid: latinGrid(ALL_SHAPES) }),
        ...(allowRowRule ? [() => ({ rule: 'row' as const, grid: rowGrid(ALL_SHAPES) })] : []),
      ])()
    : { rule: 'constant', grid: constantGrid(pickOne(rotationVaries ? ROTATABLE_SHAPES : ALL_SHAPES)) }

  const fill: AttributePlan<ShapeFill> = varying.includes('fill')
    ? pickOne([
        () => ({ rule: 'latin' as const, grid: latinGrid(ALL_FILLS) }),
        ...(allowRowRule ? [() => ({ rule: 'row' as const, grid: rowGrid(ALL_FILLS) })] : []),
      ])()
    : { rule: 'constant', grid: constantGrid(pickOne(ALL_FILLS)) }

  const count: AttributePlan<number> = varying.includes('count')
    ? pickOne([
        () => ({ rule: 'progression' as const, grid: countProgressionGrid() }),
        () => ({ rule: 'latin' as const, grid: latinGrid(ALL_COUNTS) }),
        ...(allowRowRule ? [() => ({ rule: 'row' as const, grid: rowGrid(ALL_COUNTS) })] : []),
      ])()
    : { rule: 'constant', grid: constantGrid(randomInt(1, 4)) }

  if (rotationVaries) {
    const { grid, step } = rotationProgressionGrid(shape.grid[0][0])
    return { shape, fill, count, rotation: { rule: 'progression', grid }, rotationStep: step }
  }
  return { shape, fill, count, rotation: { rule: 'constant', grid: constantGrid(0) } }
}

/** Ghép kế hoạch thành 9 ô hình. */
export function buildCells(plan: MatrixPlan): Figure[] {
  return [0, 1, 2].flatMap((r) =>
    [0, 1, 2].map((c) => ({
      shape: plan.shape.grid[r][c],
      fill: plan.fill.grid[r][c],
      count: plan.count.grid[r][c],
      rotation: plan.rotation.grid[r][c],
    })),
  )
}

// ─────────────────────────────── Đáp án nhiễu ───────────────────────────────

/**
 * Các biến thể của đáp án khi đổi đúng MỘT thuộc tính (lỗi hay gặp: đúng 3 phần, sai 1 phần).
 * @param answer Đáp án đúng.
 * @param attribute Thuộc tính cần đổi.
 */
function variantsOf(answer: Figure, attribute: Attribute): Figure[] {
  switch (attribute) {
    case 'shape':
      return ALL_SHAPES.filter((s) => s !== answer.shape).map((shape) => ({ ...answer, shape }))
    case 'fill':
      return ALL_FILLS.filter((f) => f !== answer.fill).map((fill) => ({ ...answer, fill }))
    case 'count':
      return ALL_COUNTS.filter((n) => n !== answer.count).map((count) => ({ ...answer, count }))
    case 'rotation':
      // Chỉ xoay tam giác và mũi tên, mỗi lần một bội số của 90°. Không xoay các hình khác vì dễ gây nhầm,
      // ví dụ hình vuông xoay 45° trông gần như hình thoi.
      return ROTATABLE_SHAPES.includes(answer.shape)
        ? [90, 180, 270].map((d) => ({ ...answer, rotation: (answer.rotation + d) % 360 }))
        : []
  }
}

/**
 * Tạo 4 đáp án nhiễu, theo thứ tự ưu tiên:
 *   1. Chép lại ô bên trái hoặc ô phía trên ô trống (bẫy "chép hình gần nhất").
 *   2. Đáp án đổi một thuộc tính ĐANG THAY ĐỔI trong ma trận (đoán sai quy luật).
 *   3. Đáp án đổi một thuộc tính cố định (bổ sung khi chưa đủ).
 * Mỗi đáp án nhiễu phải nhìn khác đáp án đúng, khác nhau, và KHÔNG làm ma trận hợp lệ khi đặt vào ô trống.
 * @param cells 9 ô của ma trận (ô cuối là đáp án đúng).
 * @param plan Kế hoạch ma trận (để biết thuộc tính nào đang thay đổi).
 */
export function buildFigureDistractors(cells: Figure[], plan: MatrixPlan): Figure[] {
  const answer = cells[8]
  const varying = ATTRIBUTES.filter((a) => plan[a].rule !== 'constant')
  const fixed = ATTRIBUTES.filter((a) => plan[a].rule === 'constant')
  const candidates = [
    ...shuffle([cells[7], cells[5]]),
    ...shuffle(varying.flatMap((a) => variantsOf(answer, a))),
    ...shuffle(fixed.flatMap((a) => variantsOf(answer, a))),
  ]

  const result: Figure[] = []
  for (const candidate of candidates) {
    if (result.length >= OPTION_COUNT - 1) break
    if (sameFigure(candidate, answer) || result.some((r) => sameFigure(r, candidate))) continue
    // Đặt thử vào ô trống: nếu ma trận vẫn hợp lệ thì đây cũng là một đáp án đúng → loại
    if (isValidMatrix([...cells.slice(0, 8), candidate])) continue
    result.push(candidate)
  }
  return result
}

// ─────────────────────────────── Lời giải ───────────────────────────────

/** Liệt kê các giá trị theo dạng "a, b và c". */
function listValues(values: string[]): string {
  return values.length <= 1 ? values.join('') : `${values.slice(0, -1).join(', ')} và ${values[values.length - 1]}`
}

/**
 * Viết lời giải từng bước: mỗi thuộc tính một bước (nêu quy luật và giá trị ở hàng 3), bước cuối nêu hình cần tìm.
 * @param plan Kế hoạch ma trận.
 * @param answer Đáp án đúng.
 */
export function explainMatrix(plan: MatrixPlan, answer: Figure): string[] {
  const steps: string[] = ['Quan sát lần lượt từng đặc điểm của hình theo mỗi hàng (từ trái sang phải).']

  /**
   * Diễn đạt quy luật của dạng hình / kiểu tô (hai thuộc tính dạng "loại", cùng cách nói, chỉ khác bảng tên).
   * @param label Tên thuộc tính, ví dụ 'Dạng hình'.
   * @param attributePlan Kế hoạch của thuộc tính.
   * @param names Bảng tên tiếng Việt của các giá trị.
   * @param answerValue Giá trị của thuộc tính ở đáp án.
   */
  function describeCategorical<T extends string>(
    label: string,
    attributePlan: AttributePlan<T>,
    names: Record<T, string>,
    answerValue: T,
  ): string {
    switch (attributePlan.rule) {
      case 'constant':
        return `${label}: không đổi, mọi ô đều là ${names[answerValue]}.`
      case 'row':
        return `${label}: mỗi hàng dùng một loại riêng; hàng 3 là ${names[answerValue]}.`
      default: {
        const all = [...new Set(attributePlan.grid[0])].map((v) => names[v])
        return `${label}: mỗi hàng có đủ ${listValues(all)}; hàng 3 còn thiếu ${names[answerValue]}.`
      }
    }
  }
  steps.push(describeCategorical('Dạng hình', plan.shape, SHAPE_NAMES, answer.shape))
  steps.push(describeCategorical('Kiểu tô', plan.fill, FILL_NAMES, answer.fill))

  // Số lượng
  const counts = plan.count.grid[2]
  switch (plan.count.rule) {
    case 'constant':
      steps.push(`Số lượng: không đổi, mọi ô đều có ${counts[0]} hình.`)
      break
    case 'row':
      steps.push(`Số lượng: mỗi hàng có một số hình riêng; hàng 3 có ${counts[0]} hình.`)
      break
    case 'progression':
      steps.push(
        `Số lượng: mỗi ô ${counts[1] > counts[0] ? 'nhiều hơn' : 'ít hơn'} ô bên trái 1 hình; hàng 3: ${counts[0]} → ${counts[1]} → ${counts[2]} hình.`,
      )
      break
    case 'latin':
      steps.push(
        `Số lượng: mỗi hàng có đủ các ô ${listValues([...new Set(plan.count.grid[0])].sort().map(String))} hình; hàng 3 còn thiếu ô ${answer.count} hình.`,
      )
      break
  }

  // Góc xoay: chỉ nêu khi có quy luật xoay (khi không xoay thì bỏ qua cho gọn)
  if (plan.rotation.rule === 'progression') {
    const angles = plan.rotation.grid[2]
    steps.push(
      `Góc xoay: mỗi ô xoay thêm ${plan.rotationStep}° theo chiều kim đồng hồ so với ô bên trái; hàng 3: ${angles[0]}° → ${angles[1]}° → ${angles[2]}°.`,
    )
  }

  steps.push(`Hình cần tìm: ${describeFigure(answer)}.`)
  return steps
}

// ─────────────────────────────── Ghép thành câu hỏi ───────────────────────────────

/**
 * Sinh một câu hỏi Suy luận hình hoàn chỉnh.
 * @param id Mã câu hỏi.
 * @param difficulty Độ khó.
 * @returns Câu hỏi: dữ kiện là ma trận 9 ô (ô cuối trống), 5 lựa chọn dạng hình đã xáo trộn.
 */
export function generateAbstractQuestion(id: string, difficulty: Difficulty): Question {
  const plan = planMatrix(difficulty)
  const cells = buildCells(plan)
  const answer = cells[8]
  const distractors = buildFigureDistractors(cells, plan)

  const figures = shuffle([answer, ...distractors])
  const options: Option[] = figures.map((figure, i) => ({
    id: OPTION_IDS[i],
    content: describeFigure(figure),
    figure,
  }))

  return {
    id,
    category: 'abstract',
    difficulty,
    instruction: 'Quan sát quy luật của các hình theo từng hàng trong ma trận 3 × 3.',
    stimulus: { type: 'matrix', cells: [...cells.slice(0, 8), null] },
    prompt: 'Hình nào phù hợp để điền vào ô có dấu "?"',
    options,
    correctOptionId: OPTION_IDS[figures.indexOf(answer)],
    explanationSteps: explainMatrix(plan, answer),
  }
}

/**
 * Sinh một bộ câu hỏi Suy luận hình, không có hai ma trận trùng nhau.
 * @param count Số câu.
 * @param difficulty Độ khó cố định; bỏ trống thì mỗi câu lấy độ khó ngẫu nhiên.
 * @returns Danh sách câu hỏi với mã 'ab-1', 'ab-2', …
 */
export function generateAbstractQuestions(count: number, difficulty?: Difficulty): Question[] {
  const questions: Question[] = []
  const used = new Set<string>()
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard']
  while (questions.length < count) {
    const question = generateAbstractQuestion(`ab-${questions.length + 1}`, difficulty ?? pickOne(difficulties))
    const key = JSON.stringify(question.stimulus)
    if (used.has(key)) continue
    used.add(key)
    questions.push(question)
  }
  return questions
}
