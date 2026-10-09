// Bộ sinh câu Logic dạng SẮP XẾP THỨ TỰ (không giới hạn số câu).
//
// Cách sinh một câu:
//   1. Tạo một thứ tự ẩn cho 4–6 người (vị trí 0 = đầu / cao nhất / về đích đầu tiên).
//   2. Liệt kê mọi dữ kiện ĐÚNG với thứ tự đó (A đứng trước B, A ngay trước B, A đứng đầu…).
//   3. Thêm dần dữ kiện (thứ tự ngẫu nhiên) cho đến khi vét cạn mọi hoán vị chỉ còn ĐÚNG MỘT thứ tự thỏa mãn.
//   4. Bỏ bớt dữ kiện thừa: thử bỏ từng dữ kiện, còn duy nhất thì bỏ → đề có ít dữ kiện nhất có thể.
// Vì luôn vét cạn, mỗi câu sinh ra chắc chắn chỉ có một đáp án đúng.

import type { Difficulty, Option, Question } from '../types/question'
import { pickOne, shuffle } from '../utils/random'

// ─────────────────────────────── Dữ kiện & vét cạn ───────────────────────────────

/** Một dữ kiện về thứ tự (người ghi bằng vị trí trong danh sách người, không phải vị trí xếp hạng). */
export type OrderFact =
  | { kind: 'before'; a: number; b: number } // a đứng trước b (không nhất thiết liền nhau)
  | { kind: 'immediately'; a: number; b: number } // a đứng ngay trước b
  | { kind: 'first'; a: number } // a đứng đầu
  | { kind: 'last'; a: number } // a đứng cuối

/**
 * Kiểm tra một thứ tự có thỏa mãn một dữ kiện không.
 * @param rank rank[người] = vị trí của người đó (0 = đầu).
 */
export function satisfies(rank: number[], fact: OrderFact): boolean {
  switch (fact.kind) {
    case 'before':
      return rank[fact.a] < rank[fact.b]
    case 'immediately':
      return rank[fact.b] === rank[fact.a] + 1
    case 'first':
      return rank[fact.a] === 0
    case 'last':
      return rank[fact.a] === rank.length - 1
  }
}

/** Mọi hoán vị của [0, 1, …, n−1] (n ≤ 6 nên tối đa 720 hoán vị). */
function permutations(n: number): number[][] {
  if (n === 0) return [[]]
  return permutations(n - 1).flatMap((p) => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]))
}

/** Bộ nhớ đệm danh sách hoán vị theo n, để không tính lại mỗi lần vét cạn. */
const permutationCache = new Map<number, number[][]>()

/**
 * Vét cạn: mọi thứ tự (dạng rank[người] = vị trí) thỏa mãn tất cả dữ kiện.
 * @param n Số người.
 * @param facts Các dữ kiện.
 */
export function solveOrdering(n: number, facts: OrderFact[]): number[][] {
  if (!permutationCache.has(n)) permutationCache.set(n, permutations(n))
  return permutationCache.get(n)!.filter((rank) => facts.every((f) => satisfies(rank, f)))
}

// ─────────────────────────────── Bối cảnh & câu chữ ───────────────────────────────

/** Một bối cảnh: cách nói các dữ kiện và câu hỏi. Vị trí đầu = cao nhất / về trước / đứng trước. */
interface OrderingContext {
  names: string[]
  /** Câu giới thiệu, nhận danh sách tên đã nối. */
  intro: (names: string) => string
  /** "a đứng trước b" nói xuôi và nói ngược ("b đứng sau a"). */
  before: (a: string, b: string) => string
  beforeReversed: (a: string, b: string) => string
  /** "a ngay trước b"; null nếu bối cảnh không có khái niệm "liền nhau" (ví dụ chiều cao). */
  immediately: ((a: string, b: string) => string) | null
  first: (a: string) => string
  last: (a: string) => string
  /** Câu hỏi vị trí thứ k (k bắt đầu từ 1), n là số người. */
  ask: (k: number, n: number) => string
  /** Câu hỏi "thứ tự nào đúng" và cách gọi chiều thứ tự. */
  askOrder: string
  /** Ký hiệu trong lời giải: "X → Y" nghĩa là… */
  arrowMeaning: string
}

const PEOPLE = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Khoa', 'Lan', 'Minh', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Thảo']

const CONTEXTS: OrderingContext[] = [
  {
    names: PEOPLE,
    intro: (names) => `Trong một cuộc thi chạy, ${names} về đích ở các vị trí khác nhau.`,
    before: (a, b) => `${a} về đích trước ${b}.`,
    beforeReversed: (a, b) => `${b} về đích sau ${a}.`,
    immediately: (a, b) => `${b} về đích ngay sau ${a}.`,
    first: (a) => `${a} về đích đầu tiên.`,
    last: (a) => `${a} về đích cuối cùng.`,
    ask: (k, n) => (k === 1 ? 'Ai về đích đầu tiên?' : k === n ? 'Ai về đích cuối cùng?' : `Ai về đích thứ ${k}?`),
    askOrder: 'Thứ tự về đích (từ đầu tiên đến cuối cùng) nào đúng?',
    arrowMeaning: 'về đích trước',
  },
  {
    names: PEOPLE,
    intro: (names) => `${names} có chiều cao khác nhau.`,
    before: (a, b) => `${a} cao hơn ${b}.`,
    beforeReversed: (a, b) => `${b} thấp hơn ${a}.`,
    immediately: null,
    first: (a) => `${a} cao nhất.`,
    last: (a) => `${a} thấp nhất.`,
    ask: (k, n) => (k === 1 ? 'Ai cao nhất?' : k === n ? 'Ai thấp nhất?' : `Ai cao thứ ${k}?`),
    askOrder: 'Thứ tự từ cao nhất đến thấp nhất nào đúng?',
    arrowMeaning: 'cao hơn',
  },
  {
    names: PEOPLE,
    intro: (names) => `${names} xếp thành một hàng dọc để mua vé (vị trí 1 là đầu hàng).`,
    before: (a, b) => `${a} đứng trước ${b}.`,
    beforeReversed: (a, b) => `${b} đứng sau ${a}.`,
    immediately: (a, b) => `${a} đứng ngay trước ${b}.`,
    first: (a) => `${a} đứng đầu hàng.`,
    last: (a) => `${a} đứng cuối hàng.`,
    ask: (k) => `Ai đứng ở vị trí thứ ${k}?`,
    askOrder: 'Thứ tự từ đầu hàng đến cuối hàng nào đúng?',
    arrowMeaning: 'đứng trước',
  },
  {
    names: PEOPLE,
    intro: (names) => `Trong một bài kiểm tra, ${names} đạt điểm khác nhau.`,
    before: (a, b) => `Điểm của ${a} cao hơn điểm của ${b}.`,
    beforeReversed: (a, b) => `Điểm của ${b} thấp hơn điểm của ${a}.`,
    immediately: null,
    first: (a) => `${a} có điểm cao nhất.`,
    last: (a) => `${a} có điểm thấp nhất.`,
    ask: (k, n) =>
      k === 1 ? 'Ai có điểm cao nhất?' : k === n ? 'Ai có điểm thấp nhất?' : `Ai có điểm cao thứ ${k}?`,
    askOrder: 'Thứ tự điểm từ cao xuống thấp nào đúng?',
    arrowMeaning: 'có điểm cao hơn',
  },
]

/** Nối tên: "An, Bình và Chi". */
function joinNames(names: string[]): string {
  return `${names.slice(0, -1).join(', ')} và ${names[names.length - 1]}`
}

// ─────────────────────────────── Sinh câu đố ───────────────────────────────

/** Số người theo độ khó. */
const PEOPLE_COUNT: Record<Difficulty, number> = { easy: 4, medium: 5, hard: 6 }

/** Một câu đố đã sinh (dữ liệu thô, trước khi thành câu hỏi). */
export interface OrderingPuzzle {
  people: string[]
  /** Thứ tự đúng: order[vị trí] = người (chỉ số trong people). */
  order: number[]
  /** Các dữ kiện đã chọn (đủ để suy ra duy nhất `order`, không có dữ kiện thừa). */
  facts: OrderFact[]
}

/**
 * Liệt kê các dữ kiện ĐÚNG với thứ tự ẩn, theo độ khó:
 * - dễ: chỉ so sánh hai người liền kề (dễ ghép thành chuỗi) + đầu / cuối;
 * - trung bình: so sánh bất kỳ hai người + đầu / cuối;
 * - khó: so sánh bất kỳ + "ngay trước" (nếu bối cảnh có), KHÔNG cho biết ai đầu / cuối.
 */
function candidateFacts(order: number[], difficulty: Difficulty, hasImmediately: boolean): OrderFact[] {
  const n = order.length
  const facts: OrderFact[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (difficulty === 'easy' && j !== i + 1) continue
      facts.push({ kind: 'before', a: order[i], b: order[j] })
    }
  }
  if (difficulty === 'hard' && hasImmediately) {
    for (let i = 0; i + 1 < n; i++) facts.push({ kind: 'immediately', a: order[i], b: order[i + 1] })
  }
  if (difficulty !== 'hard') {
    facts.push({ kind: 'first', a: order[0] }, { kind: 'last', a: order[n - 1] })
  }
  return facts
}

/**
 * Sinh một câu đố có đúng một thứ tự thỏa mãn, với ít dữ kiện nhất có thể.
 * @param difficulty Độ khó (số người, loại dữ kiện).
 * @param hasImmediately Bối cảnh có dữ kiện "ngay trước" không.
 */
export function buildOrderingPuzzle(difficulty: Difficulty, hasImmediately = true): OrderingPuzzle {
  const n = PEOPLE_COUNT[difficulty]
  const people = shuffle(PEOPLE).slice(0, n)
  const order = shuffle(Array.from({ length: n }, (_, i) => i))

  // Bước 3: thêm dần dữ kiện; chỉ giữ dữ kiện làm giảm số thứ tự còn khả năng
  let facts: OrderFact[] = []
  let remaining = solveOrdering(n, facts).length
  for (const candidate of shuffle(candidateFacts(order, difficulty, hasImmediately))) {
    if (remaining === 1) break
    const next = solveOrdering(n, [...facts, candidate]).length
    if (next < remaining) {
      facts = [...facts, candidate]
      remaining = next
    }
  }

  // Bước 4: bỏ dữ kiện thừa (bỏ mà vẫn còn duy nhất một thứ tự thì bỏ)
  for (const fact of shuffle(facts)) {
    const without = facts.filter((f) => f !== fact)
    if (solveOrdering(n, without).length === 1) facts = without
  }
  return { people, order, facts }
}

// ─────────────────────────────── Thành câu hỏi ───────────────────────────────

const OPTION_IDS = ['A', 'B', 'C', 'D', 'E']

/** Viết một dữ kiện thành câu, chọn ngẫu nhiên cách nói xuôi / ngược cho tự nhiên. */
function phrase(fact: OrderFact, people: string[], ctx: OrderingContext): string {
  switch (fact.kind) {
    case 'before':
      return pickOne([ctx.before, ctx.beforeReversed])(people[fact.a], people[fact.b])
    case 'immediately':
      return ctx.immediately!(people[fact.a], people[fact.b])
    case 'first':
      return ctx.first(people[fact.a])
    case 'last':
      return ctx.last(people[fact.a])
  }
}

/** Viết dữ kiện thành ký hiệu cho lời giải: "An → Bình", "An ⇒ Bình (liền nhau)", "An đứng đầu". */
function symbol(fact: OrderFact, people: string[]): string {
  switch (fact.kind) {
    case 'before':
      return `${people[fact.a]} → ${people[fact.b]}`
    case 'immediately':
      return `${people[fact.a]} → ${people[fact.b]} (liền nhau)`
    case 'first':
      return `${people[fact.a]} ở đầu`
    case 'last':
      return `${people[fact.a]} ở cuối`
  }
}

/**
 * Tạo các thứ tự SAI để làm đáp án nhiễu cho câu hỏi "thứ tự nào đúng":
 * đổi chỗ hai người liền nhau (lỗi hay gặp), chỉ giữ thứ tự vi phạm ít nhất một dữ kiện.
 */
function wrongOrders(puzzle: OrderingPuzzle, count: number): number[][] {
  const n = puzzle.order.length
  const result: number[][] = []
  const seen = new Set([puzzle.order.join(',')])
  for (const i of shuffle(Array.from({ length: n - 1 }, (_, k) => k))) {
    if (result.length >= count) break
    const swapped = [...puzzle.order]
    ;[swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]]
    const rank = Array.from({ length: n }, (_, p) => swapped.indexOf(p))
    if (seen.has(swapped.join(',')) || puzzle.facts.every((f) => satisfies(rank, f))) continue
    seen.add(swapped.join(','))
    result.push(swapped)
  }
  return result
}

/**
 * Sinh một câu Logic sắp xếp thứ tự hoàn chỉnh.
 * Hai kiểu câu hỏi: "Ai ở vị trí thứ k?" (mọi mức), hoặc "Thứ tự nào đúng?" (khó, khoảng 1/3 số câu).
 * @param id Mã câu hỏi.
 * @param difficulty Độ khó.
 */
export function generateOrderingQuestion(id: string, difficulty: Difficulty): Question {
  const ctx = pickOne(CONTEXTS)
  const puzzle = buildOrderingPuzzle(difficulty, ctx.immediately !== null)
  const { people, order, facts } = puzzle
  const n = people.length
  const names = (list: number[]) => list.map((p) => people[p])

  // Đề: câu giới thiệu + mỗi dữ kiện một dòng (thứ tự dữ kiện xáo trộn)
  const premises = shuffle(facts).map((f) => phrase(f, people, ctx))
  const askOrder = difficulty === 'hard' && Math.random() < 1 / 3
  // Không hỏi vị trí đã được nói thẳng trong dữ kiện (ví dụ có "An về đích đầu tiên" thì không hỏi ai về đầu tiên)
  const givenPositions = new Set(
    facts.flatMap((f) => (f.kind === 'first' ? [1] : f.kind === 'last' ? [n] : [])),
  )
  const k = pickOne(Array.from({ length: n }, (_, i) => i + 1).filter((pos) => !givenPositions.has(pos)))
  const question = askOrder ? ctx.askOrder : ctx.ask(k, n)
  const prompt = [ctx.intro(joinNames(shuffle(people))), ...premises.map((p) => `- ${p}`), '', question].join('\n')

  // Lựa chọn: tên người (vị trí thứ k) hoặc cả thứ tự (câu hỏi thứ tự)
  let answer: string
  let distractors: string[]
  if (askOrder) {
    answer = names(order).join(', ')
    distractors = wrongOrders(puzzle, 3).map((o) => names(o).join(', '))
  } else {
    answer = people[order[k - 1]]
    distractors = shuffle(people.filter((p) => p !== answer)).slice(0, 4)
  }
  const values = shuffle([answer, ...distractors])
  const options: Option[] = values.map((content, i) => ({ id: OPTION_IDS[i], content }))

  const explanationSteps = [
    `Viết các dữ kiện dưới dạng ký hiệu, "X → Y" nghĩa là X ${ctx.arrowMeaning} Y: ${facts.map((f) => symbol(f, people)).join('; ')}.`,
    `Ghép các dữ kiện lại, chỉ có một thứ tự thỏa mãn tất cả: ${names(order).join(' → ')}.`,
    askOrder ? `Thứ tự đúng: ${answer}.` : `Người ở vị trí thứ ${k} trong thứ tự trên: ${answer}.`,
  ]

  return {
    id,
    category: 'logical',
    difficulty,
    instruction: 'Đọc kỹ các dữ kiện và chọn đáp án đúng:',
    prompt,
    options,
    correctOptionId: OPTION_IDS[values.indexOf(answer)],
    explanationSteps,
  }
}
