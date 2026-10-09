// Bộ sinh câu Logic dạng XẾP CHỖ NGỒI trên một hàng ghế (không giới hạn số câu).
//
// Cách sinh giống dạng sắp xếp thứ tự (logicOrdering.ts):
//   1. Xếp ngẫu nhiên 4–6 người vào hàng ghế đánh số 1, 2, 3… từ trái sang phải (cách xếp ẩn).
//   2. Liệt kê mọi dữ kiện ĐÚNG với cách xếp đó (A ngồi ghế 3, A ngay bên trái B, A không cạnh B…).
//   3. Thêm dần dữ kiện cho đến khi vét cạn chỉ còn ĐÚNG MỘT cách xếp thỏa mãn.
//   4. Bỏ dữ kiện thừa → đề có ít dữ kiện nhất có thể.

import type { Difficulty, Option, Question } from '../types/question'
import { allPermutations } from '../utils/permutations'
import { pickOne, shuffle } from '../utils/random'

// ─────────────────────────────── Dữ kiện & vét cạn ───────────────────────────────

/** Một dữ kiện về chỗ ngồi (người ghi bằng chỉ số trong danh sách người; ghế đánh số từ 0 bên trái). */
export type SeatFact =
  | { kind: 'seat'; a: number; seat: number } // a ngồi ghế số seat
  | { kind: 'end'; a: number } // a ngồi ở một đầu hàng
  | { kind: 'notEnd'; a: number } // a không ngồi ở hai đầu hàng
  | { kind: 'adjacent'; a: number; b: number } // a ngồi cạnh b
  | { kind: 'notAdjacent'; a: number; b: number } // a không ngồi cạnh b
  | { kind: 'leftOf'; a: number; b: number } // a ngồi bên trái b (không nhất thiết liền nhau)
  | { kind: 'immediatelyLeft'; a: number; b: number } // a ngồi ngay bên trái b

/**
 * Kiểm tra một cách xếp có thỏa mãn một dữ kiện không.
 * @param seatOf seatOf[người] = số ghế (0 = ghế ngoài cùng bên trái).
 */
export function satisfiesSeat(seatOf: number[], fact: SeatFact): boolean {
  const last = seatOf.length - 1
  switch (fact.kind) {
    case 'seat':
      return seatOf[fact.a] === fact.seat
    case 'end':
      return seatOf[fact.a] === 0 || seatOf[fact.a] === last
    case 'notEnd':
      return seatOf[fact.a] !== 0 && seatOf[fact.a] !== last
    case 'adjacent':
      return Math.abs(seatOf[fact.a] - seatOf[fact.b]) === 1
    case 'notAdjacent':
      return Math.abs(seatOf[fact.a] - seatOf[fact.b]) !== 1
    case 'leftOf':
      return seatOf[fact.a] < seatOf[fact.b]
    case 'immediatelyLeft':
      return seatOf[fact.b] === seatOf[fact.a] + 1
  }
}

/** Vét cạn: mọi cách xếp (seatOf) thỏa mãn tất cả dữ kiện. */
export function solveSeating(n: number, facts: SeatFact[]): readonly number[][] {
  return allPermutations(n).filter((seatOf) => facts.every((f) => satisfiesSeat(seatOf, f)))
}

// ─────────────────────────────── Sinh câu đố ───────────────────────────────

const PEOPLE = ['An', 'Bình', 'Chi', 'Dũng', 'Giang', 'Hà', 'Khoa', 'Lan', 'Minh', 'Nam', 'Oanh', 'Phúc', 'Quân', 'Thảo']

/** Số người (= số ghế) theo độ khó. */
const PEOPLE_COUNT: Record<Difficulty, number> = { easy: 4, medium: 5, hard: 6 }

/** Loại dữ kiện được dùng ở mỗi mức: mức cao hơn có dữ kiện "gián tiếp" hơn, phải suy luận nhiều bước. */
const KINDS: Record<Difficulty, SeatFact['kind'][]> = {
  easy: ['seat', 'immediatelyLeft', 'end'],
  medium: ['seat', 'immediatelyLeft', 'end', 'adjacent', 'leftOf', 'notEnd'],
  hard: ['seat', 'immediatelyLeft', 'adjacent', 'leftOf', 'notEnd', 'notAdjacent', 'end'],
}

/** Mức khó: tối đa ngần này dữ kiện "ngồi ghế số mấy" (cho biết thẳng vị trí thì quá dễ). */
const MAX_SEAT_FACTS_HARD = 1

/** Câu đố đã sinh. */
export interface SeatingPuzzle {
  people: string[]
  /** Cách xếp đúng: seatOf[người] = số ghế (0 = trái nhất). */
  seatOf: number[]
  facts: SeatFact[]
}

/** Liệt kê mọi dữ kiện ĐÚNG với cách xếp ẩn, chỉ gồm các loại được phép ở mức này. */
function candidateFacts(seatOf: number[], difficulty: Difficulty): SeatFact[] {
  const n = seatOf.length
  const allowed = new Set(KINDS[difficulty])
  const facts: SeatFact[] = []
  for (let a = 0; a < n; a++) {
    facts.push({ kind: 'seat', a, seat: seatOf[a] })
    facts.push(seatOf[a] === 0 || seatOf[a] === n - 1 ? { kind: 'end', a } : { kind: 'notEnd', a })
    for (let b = 0; b < n; b++) {
      if (a === b) continue
      const gap = seatOf[b] - seatOf[a]
      if (gap === 1) facts.push({ kind: 'immediatelyLeft', a, b })
      if (gap > 0) facts.push({ kind: 'leftOf', a, b })
      // Cạnh nhau / không cạnh nhau là quan hệ hai chiều: chỉ ghi một lần (a < b)
      if (a < b) facts.push(Math.abs(gap) === 1 ? { kind: 'adjacent', a, b } : { kind: 'notAdjacent', a, b })
    }
  }
  return facts.filter((f) => allowed.has(f.kind))
}

/**
 * Sinh một câu đố xếp chỗ có đúng một cách xếp thỏa mãn, với ít dữ kiện nhất có thể.
 * Mức khó giới hạn số dữ kiện "ngồi ghế số mấy" để người làm phải suy ra vị trí.
 */
export function buildSeatingPuzzle(difficulty: Difficulty): SeatingPuzzle {
  const n = PEOPLE_COUNT[difficulty]
  const people = shuffle(PEOPLE).slice(0, n)
  const seatOf = shuffle(Array.from({ length: n }, (_, i) => i))
  const maxSeatFacts = difficulty === 'hard' ? MAX_SEAT_FACTS_HARD : Infinity

  // Thêm dần dữ kiện; chỉ giữ dữ kiện làm giảm số cách xếp còn khả năng
  let facts: SeatFact[] = []
  let remaining = solveSeating(n, facts).length
  for (const candidate of shuffle(candidateFacts(seatOf, difficulty))) {
    if (remaining === 1) break
    if (candidate.kind === 'seat' && facts.filter((f) => f.kind === 'seat').length >= maxSeatFacts) continue
    const next = solveSeating(n, [...facts, candidate]).length
    if (next < remaining) {
      facts = [...facts, candidate]
      remaining = next
    }
  }

  // Bỏ dữ kiện thừa
  for (const fact of shuffle(facts)) {
    const without = facts.filter((f) => f !== fact)
    if (solveSeating(n, without).length === 1) facts = without
  }
  return { people, seatOf, facts }
}

// ─────────────────────────────── Thành câu hỏi ───────────────────────────────

const OPTION_IDS = ['A', 'B', 'C', 'D', 'E']

/** Số đếm viết bằng chữ cho câu giới thiệu ("Bốn người…"). */
const COUNT_WORDS: Record<number, string> = { 4: 'Bốn', 5: 'Năm', 6: 'Sáu' }

/** Nối tên: "An, Bình và Chi". */
function joinNames(names: string[]): string {
  return `${names.slice(0, -1).join(', ')} và ${names[names.length - 1]}`
}

/** Viết dữ kiện thành câu (ghế hiển thị bắt đầu từ 1). */
function phrase(fact: SeatFact, people: string[]): string {
  switch (fact.kind) {
    case 'seat':
      return `${people[fact.a]} ngồi ghế số ${fact.seat + 1}.`
    case 'end':
      return `${people[fact.a]} ngồi ở một đầu hàng.`
    case 'notEnd':
      return `${people[fact.a]} không ngồi ở hai đầu hàng.`
    case 'adjacent':
      return `${people[fact.a]} ngồi cạnh ${people[fact.b]}.`
    case 'notAdjacent':
      return `${people[fact.a]} không ngồi cạnh ${people[fact.b]}.`
    case 'leftOf':
      return `${people[fact.a]} ngồi ở bên trái ${people[fact.b]} (không nhất thiết liền nhau).`
    case 'immediatelyLeft':
      return `${people[fact.a]} ngồi ngay bên trái ${people[fact.b]}.`
  }
}

/** Viết dữ kiện thành ký hiệu ngắn cho lời giải. */
function symbol(fact: SeatFact, people: string[]): string {
  const [a, b] = [people[fact.a], 'b' in fact ? people[fact.b] : '']
  switch (fact.kind) {
    case 'seat':
      return `${a} = ghế ${fact.seat + 1}`
    case 'end':
      return `${a} ở đầu hàng`
    case 'notEnd':
      return `${a} không ở đầu hàng`
    case 'adjacent':
      return `${a} cạnh ${b}`
    case 'notAdjacent':
      return `${a} không cạnh ${b}`
    case 'leftOf':
      return `${a} … ${b}`
    case 'immediatelyLeft':
      return `${a}–${b}`
  }
}

/**
 * Sinh một câu Logic xếp chỗ ngồi hoàn chỉnh. Hai kiểu câu hỏi:
 *   - "Ai ngồi ở ghế số k?" (ghế k không được nói thẳng trong dữ kiện);
 *   - "X ngồi ghế số mấy?" (X không được nói thẳng số ghế trong dữ kiện).
 * @param id Mã câu hỏi.
 * @param difficulty Độ khó.
 */
export function generateSeatingQuestion(id: string, difficulty: Difficulty): Question {
  const puzzle = buildSeatingPuzzle(difficulty)
  const { people, seatOf, facts } = puzzle
  const n = people.length
  const atSeat = (seat: number) => people[seatOf.indexOf(seat)]
  // Những người / ghế đã được nói thẳng trong dữ kiện: không hỏi lại (tránh lộ đáp án)
  const statedPeople = new Set(facts.filter((f) => f.kind === 'seat').map((f) => f.a))
  const unstated = Array.from({ length: n }, (_, p) => p).filter((p) => !statedPeople.has(p))

  const askPerson = Math.random() < 0.5
  const target = pickOne(unstated)
  let question: string
  let answer: string
  let distractors: string[]
  if (askPerson) {
    // Hỏi người ngồi ở ghế của `target`
    question = `Ai ngồi ở ghế số ${seatOf[target] + 1}?`
    answer = people[target]
    distractors = shuffle(people.filter((p) => p !== answer)).slice(0, 4)
  } else {
    // Hỏi số ghế của `target`; lựa chọn là các số ghế (tối đa 5, giữ thứ tự tăng dần cho dễ nhìn)
    question = `${people[target]} ngồi ghế số mấy?`
    answer = `Ghế ${seatOf[target] + 1}`
    distractors = shuffle(Array.from({ length: n }, (_, s) => `Ghế ${s + 1}`).filter((s) => s !== answer)).slice(0, 4)
  }

  const prompt = [
    `${COUNT_WORDS[n]} người ${joinNames(shuffle(people))} ngồi thành một hàng ngang gồm ${n} ghế, đánh số 1 đến ${n} từ trái sang phải.`,
    ...shuffle(facts).map((f) => `- ${phrase(f, people)}`),
    '',
    question,
  ].join('\n')

  // Lựa chọn số ghế xếp tăng dần; lựa chọn tên người xáo trộn
  const values = askPerson
    ? shuffle([answer, ...distractors])
    : [answer, ...distractors].sort((x, y) => Number(x.slice(4)) - Number(y.slice(4)))
  const options: Option[] = values.map((content, i) => ({ id: OPTION_IDS[i], content }))
  const arrangement = Array.from({ length: n }, (_, s) => `ghế ${s + 1}: ${atSeat(s)}`).join('; ')

  return {
    id,
    category: 'logical',
    difficulty,
    instruction: 'Đọc kỹ các dữ kiện và chọn đáp án đúng:',
    prompt,
    options,
    correctOptionId: OPTION_IDS[values.indexOf(answer)],
    explanationSteps: [
      `Tóm tắt dữ kiện ("X … Y": X ở bên trái Y; "X–Y": X ngay bên trái Y): ${facts.map((f) => symbol(f, people)).join('; ')}.`,
      `Thử xếp theo các dữ kiện, chỉ có một cách xếp thỏa mãn tất cả: ${arrangement}.`,
      askPerson ? `Người ngồi ở ghế số ${seatOf[target] + 1}: ${answer}.` : `${people[target]} ngồi ${answer.toLowerCase()}.`,
    ],
  }
}
