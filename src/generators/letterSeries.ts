// Bộ sinh câu hỏi DÃY CHỮ CÁI (thuộc dạng Dãy số), ví dụ: A, C, F, J, O, ? → U.
// Cách làm: sinh dãy SỐ THỨ TỰ chữ cái (A = 1 … Z = 26) theo các quy luật giống dãy số, rồi đổi sang chữ.
// Dùng bảng chữ cái tiếng Anh 26 chữ, giống đề IQ tuyển dụng; không "vòng lại" từ Z về A để tránh tranh cãi.

import type { Difficulty, Option, Question } from '../types/question'
import { pickOne, randomInt, shuffle } from '../utils/random'
import type { SeriesData } from './numberSeries'

/** Bảng chữ cái 26 chữ; vị trí trong chuỗi + 1 = số thứ tự chữ cái. */
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const MAX_POSITION = ALPHABET.length

/** Đổi số thứ tự (1–26) sang chữ cái. */
export function toLetter(position: number): string {
  if (!Number.isInteger(position) || position < 1 || position > MAX_POSITION) {
    throw new Error(`toLetter: số thứ tự ${position} nằm ngoài A–Z`)
  }
  return ALPHABET[position - 1]
}

/** Đổi chữ cái sang số thứ tự (A → 1). */
export function toPosition(letter: string): number {
  return ALPHABET.indexOf(letter) + 1
}

/** "A = 1, C = 3, F = 6" — dùng trong lời giải. */
function describePositions(positions: number[]): string {
  return positions.map((p) => `${toLetter(p)} = ${p}`).join(', ')
}

/** Hiệu giữa các số liền kề. */
function differences(numbers: number[]): number[] {
  return numbers.slice(1).map((n, i) => n - numbers[i])
}

/** Mọi số thứ tự đều nằm trong A–Z. */
function inAlphabet(numbers: number[]): boolean {
  return numbers.every((n) => n >= 1 && n <= MAX_POSITION)
}

/** Viết hiệu có dấu: "+3" hoặc "−2". */
function signed(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`
}

/** Bước đầu tiên của mọi lời giải: đổi chữ sang số thứ tự. */
function firstStep(terms: number[]): string {
  return `Đổi chữ cái sang số thứ tự trong bảng chữ cái: ${describePositions(terms)}.`
}

/** Bước cuối của mọi lời giải: đổi số thứ tự tìm được sang chữ. */
function lastStep(answer: number): string {
  return `Số thứ tự ${answer} ứng với chữ ${toLetter(answer)}.`
}

// ─────────────────────────────── Các quy luật (trên số thứ tự) ───────────────────────────────

/**
 * CÁCH ĐỀU (dễ: bước 2–3; trung bình: bước 4–5; không dùng bước 1 vì A, B, C, D, E quá hiển nhiên): mỗi chữ cách chữ trước d vị trí (d có thể âm: đi lùi).
 * Ví dụ: B, E, H, K, N, ? → Q (d = 3).
 */
export function letterArithmetic(minStep: number, maxStep: number): SeriesData {
  const d = pickOne([-1, 1]) * randomInt(minStep, maxStep)
  const span = Math.abs(d) * 5
  // Chọn số đầu sao cho cả 6 chữ đều nằm trong A–Z
  const start = d > 0 ? randomInt(1, MAX_POSITION - span) : randomInt(span + 1, MAX_POSITION)
  const all = Array.from({ length: 6 }, (_, i) => start + i * d)
  const terms = all.slice(0, 5)
  const answer = all[5]
  return {
    terms,
    answer,
    steps: [
      firstStep(terms),
      d > 0
        ? `Mỗi chữ đứng sau chữ trước ${d} vị trí (hiệu luôn bằng ${d}).`
        : `Mỗi chữ đứng trước chữ liền trước ${Math.abs(d)} vị trí (dãy đi lùi, hiệu luôn bằng ${signed(d)}).`,
      `Chữ tiếp theo: ${terms[4]} ${signed(d).replace(/^([+−])/, '$1 ')} = ${answer}.`,
      lastStep(answer),
    ],
    // Sai thường gặp: đếm lệch 1 vị trí; nhảy thừa một bước
    // (không dùng chữ đã có trong đề làm đáp án nhiễu: quá dễ loại)
    mistakes: [answer + 1, answer - 1, answer + d],
  }
}

/**
 * HIỆU TĂNG DẦN (trung bình): khoảng cách giữa các chữ tăng thêm 1 mỗi lần.
 * Ví dụ: A, B, D, G, K, ? → P (hiệu 1, 2, 3, 4 → tiếp theo 5).
 */
export function letterIncreasingDifference(): SeriesData {
  for (;;) {
    const first = randomInt(1, 3) // hiệu đầu tiên
    const diffs = Array.from({ length: 5 }, (_, i) => first + i)
    const total = diffs.reduce((a, b) => a + b, 0)
    if (total >= MAX_POSITION) continue
    const start = randomInt(1, MAX_POSITION - total)
    const all = [start]
    for (const d of diffs) all.push(all[all.length - 1] + d)
    const terms = all.slice(0, 5)
    const answer = all[5]
    const nextDiff = diffs[4]
    return {
      terms,
      answer,
      steps: [
        firstStep(terms),
        `Tính khoảng cách giữa các chữ liền kề: ${differences(terms).join(', ')} — mỗi lần tăng thêm 1.`,
        `Khoảng cách tiếp theo là ${nextDiff}: ${terms[4]} + ${nextDiff} = ${answer}.`,
        lastStep(answer),
      ],
      // Sai thường gặp: giữ nguyên khoảng cách cũ; tăng thêm 2; đếm lệch 1
      mistakes: [terms[4] + nextDiff - 1, terms[4] + nextDiff + 1, answer + 1, answer - 1],
    }
  }
}

/**
 * XEN KẼ HAI DÃY (khó): chữ ở vị trí lẻ theo một quy luật, vị trí chẵn theo quy luật khác.
 * Ví dụ: A, Z, C, X, E, ? → V (vị trí lẻ +2: A, C, E; vị trí chẵn −2: Z, X, V).
 * Số cần tìm là chữ thứ 6, thuộc dãy vị trí chẵn.
 */
export function letterAlternating(): SeriesData {
  for (;;) {
    const d1 = pickOne([-1, 1]) * randomInt(1, 4)
    const d2 = pickOne([-1, 1]) * randomInt(1, 4)
    if (d1 === d2) continue // hai dãy phải khác quy luật, không thì thành dãy thường
    const s1 = randomInt(1, MAX_POSITION)
    const s2 = randomInt(1, MAX_POSITION)
    const odd = [s1, s1 + d1, s1 + 2 * d1]
    const even = [s2, s2 + d2, s2 + 2 * d2]
    const all = [odd[0], even[0], odd[1], even[1], odd[2], even[2]]
    // Trong A–Z, và không có 2 chữ liền nhau trùng nhau (khó nhìn ra hai dãy)
    if (!inAlphabet(all) || all.some((n, i) => i > 0 && n === all[i - 1])) continue
    const terms = all.slice(0, 5)
    const answer = all[5]
    return {
      terms,
      answer,
      steps: [
        firstStep(terms),
        `Các chữ ở vị trí lẻ (1, 3, 5): ${odd.join(', ')} — mỗi lần ${signed(d1)}.`,
        `Các chữ ở vị trí chẵn (2, 4): ${even[0]}, ${even[1]} — mỗi lần ${signed(d2)}.`,
        `Chữ thứ 6 thuộc dãy vị trí chẵn: ${even[1]} ${signed(d2).replace(/^([+−])/, '$1 ')} = ${answer}.`,
        lastStep(answer),
      ],
      // Sai thường gặp: tiếp tục dãy vị trí lẻ; coi cả dãy là một; đếm lệch 1
      mistakes: [odd[2] + d1, terms[4] + (terms[4] - terms[3]), answer + 1, answer - 1],
    }
  }
}

/**
 * CỘNG HAI CHỮ TRƯỚC (khó, kiểu Fibonacci): số thứ tự mỗi chữ = tổng số thứ tự của hai chữ đứng trước.
 * Ví dụ: A, B, C, E, H, ? → M (1, 2, 3, 5, 8 → 13).
 */
export function letterFibonacci(): SeriesData {
  for (;;) {
    const a = randomInt(1, 3)
    const b = randomInt(1, 4)
    const all = [a, b]
    while (all.length < 6) all.push(all[all.length - 1] + all[all.length - 2])
    if (!inAlphabet(all)) continue
    const terms = all.slice(0, 5)
    const answer = all[5]
    return {
      terms,
      answer,
      steps: [
        firstStep(terms),
        `Từ chữ thứ 3, mỗi số bằng tổng hai số đứng trước: ${terms[0]} + ${terms[1]} = ${terms[2]}, ${terms[1]} + ${terms[2]} = ${terms[3]}, ${terms[2]} + ${terms[3]} = ${terms[4]}.`,
        `Số tiếp theo: ${terms[3]} + ${terms[4]} = ${answer}.`,
        lastStep(answer),
      ],
      // Sai thường gặp: cộng theo hiệu cuối (cộng đều); nhân đôi số cuối; đếm lệch 1
      mistakes: [terms[4] + (terms[4] - terms[3]), answer + 1, answer - 1, terms[4] + terms[2]],
    }
  }
}

/** Các quy luật dãy chữ cái theo độ khó. */
export const LETTER_RULES_BY_DIFFICULTY: Record<Difficulty, (() => SeriesData)[]> = {
  easy: [() => letterArithmetic(2, 3)],
  medium: [() => letterArithmetic(4, 5), letterIncreasingDifference],
  hard: [letterAlternating, letterFibonacci],
}

// ─────────────────────────────── Ghép thành câu hỏi ───────────────────────────────

const OPTION_IDS = ['A', 'B', 'C', 'D', 'E']

/**
 * Tạo 4 đáp án nhiễu (số thứ tự): ưu tiên lỗi sai thường gặp, thiếu thì lấy chữ gần đáp án.
 * Mọi đáp án nhiễu đều nằm trong A–Z, không trùng nhau, không trùng đáp án.
 */
export function buildLetterDistractors(answer: number, mistakes: number[]): number[] {
  const result = new Set<number>()
  const isValid = (n: number) => Number.isInteger(n) && n >= 1 && n <= MAX_POSITION && n !== answer && !result.has(n)
  for (const m of shuffle(mistakes)) {
    if (result.size >= 4) break
    if (isValid(m)) result.add(m)
  }
  // Bổ sung chữ gần đáp án, nới rộng dần (bảng chữ cái có 26 chữ nên luôn đủ)
  for (let spread = 2; result.size < 4; spread++) {
    const candidate = answer + pickOne([-1, 1]) * randomInt(1, spread)
    if (isValid(candidate)) result.add(candidate)
  }
  return [...result]
}

/**
 * Sinh một câu dãy chữ cái hoàn chỉnh (thuộc dạng Dãy số).
 * @param id Mã câu hỏi.
 * @param difficulty Độ khó; quy luật chọn ngẫu nhiên trong nhóm độ khó này.
 */
export function generateLetterSeriesQuestion(id: string, difficulty: Difficulty): Question {
  const { terms, answer, steps, mistakes } = pickOne(LETTER_RULES_BY_DIFFICULTY[difficulty])()
  const values = shuffle([answer, ...buildLetterDistractors(answer, mistakes)])
  const options: Option[] = values.map((value, i) => ({ id: OPTION_IDS[i], content: toLetter(value) }))
  return {
    id,
    category: 'number-series',
    difficulty,
    instruction: 'Tìm chữ cái tiếp theo của dãy (bảng chữ cái A–Z, 26 chữ):',
    prompt: `${terms.map(toLetter).join(', ')}, ?`,
    options,
    correctOptionId: OPTION_IDS[values.indexOf(answer)],
    explanationSteps: steps,
  }
}
