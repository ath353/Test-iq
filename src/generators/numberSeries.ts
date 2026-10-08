// Bộ sinh câu hỏi dạng Dãy số (Number series).
// Mỗi quy luật là một hàm thuần: sinh dãy số, đáp án, lời giải từng bước và các "lỗi sai thường gặp"
// (dùng làm đáp án nhiễu). Hàm generateNumberSeriesQuestion ghép chúng thành một Question hoàn chỉnh.

import type { Difficulty, Option, Question } from '../types/question'
import { pickOne, randomInt, shuffle } from '../utils/random'

/** Dữ liệu thô do một quy luật sinh ra, trước khi ghép thành câu hỏi. */
export interface SeriesData {
  /** Các số hiển thị trong đề (không gồm số cần tìm). */
  terms: number[]
  /** Số cần tìm. */
  answer: number
  /** Lời giải từng bước. */
  steps: string[]
  /** Các đáp án sai mà người làm hay mắc phải, ưu tiên dùng làm đáp án nhiễu. */
  mistakes: number[]
}

/** Số lựa chọn mỗi câu (A–E), giống bài test SHL. */
const OPTION_COUNT = 5
const OPTION_IDS = ['A', 'B', 'C', 'D', 'E']

/** Nối các số thành chuỗi "a, b, c". */
function joinNumbers(numbers: number[]): string {
  return numbers.join(', ')
}

/** Viết phép cộng có dấu đúng chuẩn: "30 + 12" hoặc "30 − 12" khi số thứ hai âm. */
function formatAdd(a: number, b: number): string {
  return b >= 0 ? `${a} + ${b}` : `${a} − ${Math.abs(b)}`
}

/** Tính hiệu giữa các số liền kề: [2, 6, 12] → [4, 6]. */
function differences(numbers: number[]): number[] {
  return numbers.slice(1).map((n, i) => n - numbers[i])
}

// ─────────────────────────────── Các quy luật ───────────────────────────────

/**
 * Quy luật CỘNG ĐỀU (cấp số cộng): mỗi số bằng số trước cộng một hằng số d (d có thể âm).
 * Ví dụ: 5, 12, 19, 26, 33, ? → 40 (d = 7).
 */
export function arithmeticSeries(): SeriesData {
  const d = pickOne([-1, 1]) * randomInt(2, 12)
  // Dãy giảm thì chọn số đầu đủ lớn để mọi số vẫn dương
  const start = d > 0 ? randomInt(1, 40) : randomInt(Math.abs(d) * 6 + 1, Math.abs(d) * 6 + 40)
  const all = Array.from({ length: 6 }, (_, i) => start + i * d)
  const terms = all.slice(0, 5)
  const answer = all[5]
  const last = terms[4]
  return {
    terms,
    answer,
    steps: [
      `Tính hiệu các số liền kề: ${joinNumbers(differences(terms))}.`,
      // Dãy giảm thì diễn đạt "giảm đều" cho tự nhiên, thay vì "cộng -2"
      d > 0
        ? `Hiệu luôn bằng ${d}: mỗi số tăng ${d} so với số trước, đây là dãy cộng đều.`
        : `Hiệu luôn bằng ${d}: mỗi số giảm ${Math.abs(d)} so với số trước, đây là dãy giảm đều.`,
      `Số cần tìm: ${formatAdd(last, d)} = ${answer}.`,
    ],
    // Sai thường gặp: cộng nhầm dấu, cộng thừa/thiếu một bước
    mistakes: [last - d, answer + d, answer + 1, answer - 1],
  }
}

/**
 * Quy luật NHÂN ĐỀU (cấp số nhân): mỗi số bằng số trước nhân một hằng số r.
 * Ví dụ: 3, 6, 12, 24, 48, ? → 96 (r = 2).
 */
export function geometricSeries(): SeriesData {
  const r = randomInt(2, 3)
  const start = randomInt(1, 5)
  const all = Array.from({ length: 6 }, (_, i) => start * r ** i)
  const terms = all.slice(0, 5)
  const answer = all[5]
  const last = terms[4]
  return {
    terms,
    answer,
    steps: [
      `Lấy số sau chia số trước: ${terms.slice(1).map((n, i) => `${n} : ${terms[i]} = ${r}`).join('; ')}.`,
      `Mỗi số bằng số trước nhân ${r}, đây là dãy nhân đều.`,
      `Số cần tìm: ${last} × ${r} = ${answer}.`,
    ],
    // Sai thường gặp: tưởng là dãy cộng (cộng hiệu cuối), nhân nhầm hệ số
    mistakes: [last + (last - terms[3]), last * (r + 1), answer + r, answer - r],
  }
}

/**
 * Quy luật CỘNG TĂNG DẦN: hiệu giữa các số liền kề tăng đều một lượng k.
 * Ví dụ: 2, 6, 12, 20, 30, ? → 42 (hiệu 4, 6, 8, 10, 12; k = 2).
 */
export function increasingDifferenceSeries(): SeriesData {
  const start = randomInt(1, 20)
  const firstDiff = randomInt(1, 6)
  const k = randomInt(1, 4)
  const all = [start]
  for (let i = 0; i < 5; i++) all.push(all[i] + firstDiff + i * k)
  const terms = all.slice(0, 5)
  const answer = all[5]
  const last = terms[4]
  const diffs = differences(terms)
  const nextDiff = diffs[diffs.length - 1] + k
  return {
    terms,
    answer,
    steps: [
      `Tính hiệu các số liền kề: ${joinNumbers(diffs)}.`,
      `Hiệu tăng đều ${k} đơn vị, nên hiệu tiếp theo là ${diffs[diffs.length - 1]} + ${k} = ${nextDiff}.`,
      `Số cần tìm: ${last} + ${nextDiff} = ${answer}.`,
    ],
    // Sai thường gặp: quên tăng hiệu (cộng lại hiệu cũ), tăng hiệu hai lần
    mistakes: [last + diffs[diffs.length - 1], answer + k, answer - 1, answer + 1],
  }
}

/**
 * Quy luật BÌNH PHƯƠNG: các số có dạng n² + c với n tăng dần từng đơn vị.
 * Ví dụ (c = 0): 4, 9, 16, 25, 36, ? → 49. Ví dụ (c = 1): 5, 10, 17, 26, 37, ? → 50.
 */
export function squareSeries(): SeriesData {
  const firstN = randomInt(1, 6)
  const c = randomInt(-3, 5)
  // Khi c âm, bắt đầu từ n = 2 trở lên để không có số âm hoặc bằng 0
  const n0 = c < 0 ? Math.max(firstN, 2) : firstN
  const ns = Array.from({ length: 6 }, (_, i) => n0 + i)
  const all = ns.map((n) => n * n + c)
  const terms = all.slice(0, 5)
  const answer = all[5]
  const nextN = ns[5]
  // Mô tả từng số theo dạng n² + c, ví dụ "2² + 1 = 5"
  const describe = (n: number) =>
    c === 0 ? `${n}² = ${n * n}` : `${n}² ${c > 0 ? '+' : '−'} ${Math.abs(c)} = ${n * n + c}`
  return {
    terms,
    answer,
    steps: [
      c === 0
        ? `Các số lần lượt là bình phương của ${joinNumbers(ns.slice(0, 5))}.`
        : `Các số có dạng n² ${c > 0 ? '+' : '−'} ${Math.abs(c)}: ${ns.slice(0, 5).map(describe).join('; ')}.`,
      `Số tiếp theo ứng với n = ${nextN}.`,
      `Số cần tìm: ${describe(nextN)}.`,
    ],
    // Sai thường gặp: tưởng hiệu tăng đều 1 (thay vì 2), quên cộng c, nhảy sang n kế tiếp
    mistakes: [terms[4] + (terms[4] - terms[3]) + 1, nextN * nextN, (nextN + 1) ** 2 + c, answer + 2],
  }
}

/**
 * Quy luật XEN KẼ: hai dãy cộng đều đan xen nhau (vị trí lẻ là một dãy, vị trí chẵn là dãy khác).
 * Ví dụ: 3, 20, 5, 17, 7, 14, 9, ? → 11 (vị trí lẻ 3, 5, 7, 9 cộng 2; vị trí chẵn 20, 17, 14 trừ 3).
 */
export function alternatingSeries(): SeriesData {
  const d1 = randomInt(2, 9)
  const d2 = pickOne([-1, 1]) * randomInt(2, 9)
  const a0 = randomInt(1, 30)
  // Dãy chẵn giảm thì chọn số đầu đủ lớn để mọi số vẫn dương
  const b0 = d2 > 0 ? randomInt(1, 30) : randomInt(Math.abs(d2) * 4 + 1, Math.abs(d2) * 4 + 30)
  const odd = Array.from({ length: 4 }, (_, i) => a0 + i * d1) // vị trí 1, 3, 5, 7
  const even = Array.from({ length: 4 }, (_, i) => b0 + i * d2) // vị trí 2, 4, 6, 8
  // Đan xen: a0, b0, a1, b1, a2, b2, a3 | đáp án là b3 (vị trí thứ 8)
  const terms = [odd[0], even[0], odd[1], even[1], odd[2], even[2], odd[3]]
  const answer = even[3]
  return {
    terms,
    answer,
    steps: [
      `Tách thành 2 dãy xen kẽ. Vị trí lẻ: ${joinNumbers(odd)}. Vị trí chẵn: ${joinNumbers(even.slice(0, 3))}.`,
      `Dãy vị trí lẻ: mỗi số cộng ${d1}. Dãy vị trí chẵn: mỗi số ${d2 > 0 ? `cộng ${d2}` : `trừ ${Math.abs(d2)}`}.`,
      `Số cần tìm ở vị trí thứ 8 (thuộc dãy chẵn): ${formatAdd(even[2], d2)} = ${answer}.`,
    ],
    // Sai thường gặp: tiếp tục dãy lẻ, coi cả dãy là một, cộng nhầm dấu
    mistakes: [odd[3] + d1, terms[6] + (terms[6] - terms[5]), even[2] - d2, answer + 1],
  }
}

// ─────────────────────────────── Ghép thành câu hỏi ───────────────────────────────

/** Các quy luật theo độ khó. Thêm quy luật mới thì đăng ký vào đây. */
export const RULES_BY_DIFFICULTY: Record<Difficulty, (() => SeriesData)[]> = {
  easy: [arithmeticSeries, geometricSeries],
  medium: [increasingDifferenceSeries, squareSeries],
  hard: [alternatingSeries],
}

/**
 * Tạo 4 đáp án nhiễu: ưu tiên các lỗi sai thường gặp, thiếu thì lấy số gần đáp án.
 * Đảm bảo: không trùng nhau, không trùng đáp án đúng, là số nguyên dương.
 * @param answer Đáp án đúng.
 * @param mistakes Các lỗi sai thường gặp do quy luật cung cấp.
 * @returns Mảng 4 số sai khác nhau.
 */
export function buildDistractors(answer: number, mistakes: number[]): number[] {
  const count = OPTION_COUNT - 1
  const result = new Set<number>()
  const isValid = (n: number) => Number.isInteger(n) && n > 0 && n !== answer && !result.has(n)

  // 1. Lấy các lỗi sai thường gặp (xáo trộn để không phải lúc nào cũng cùng thứ tự)
  for (const m of shuffle(mistakes)) {
    if (result.size >= count) break
    if (isValid(m)) result.add(m)
  }

  // 2. Bổ sung số gần đáp án; khoảng lệch nới rộng dần để chắc chắn luôn đủ số
  let spread = Math.max(3, Math.round(answer * 0.1))
  while (result.size < count) {
    const candidate = answer + pickOne([-1, 1]) * randomInt(1, spread)
    if (isValid(candidate)) result.add(candidate)
    spread++
  }

  return [...result]
}

/**
 * Sinh một câu hỏi dãy số hoàn chỉnh.
 * @param id Mã câu hỏi (duy nhất trong bài làm).
 * @param difficulty Độ khó; quy luật được chọn ngẫu nhiên trong nhóm độ khó này.
 * @returns Câu hỏi với 5 lựa chọn đã xáo trộn và lời giải từng bước.
 */
export function generateNumberSeriesQuestion(id: string, difficulty: Difficulty): Question {
  const rule = pickOne(RULES_BY_DIFFICULTY[difficulty])
  const { terms, answer, steps, mistakes } = rule()

  // Trộn đáp án đúng với 4 đáp án nhiễu, rồi gán nhãn A–E theo thứ tự sau khi trộn
  const values = shuffle([answer, ...buildDistractors(answer, mistakes)])
  const options: Option[] = values.map((value, i) => ({ id: OPTION_IDS[i], content: String(value) }))
  const correctOptionId = OPTION_IDS[values.indexOf(answer)]

  return {
    id,
    category: 'number-series',
    difficulty,
    prompt: `${joinNumbers(terms)}, ?`,
    options,
    correctOptionId,
    explanationSteps: steps,
  }
}

/**
 * Sinh một bộ câu hỏi dãy số, không có hai câu trùng đề.
 * @param count Số câu hỏi.
 * @param difficulty Độ khó cố định; bỏ trống thì mỗi câu lấy độ khó ngẫu nhiên.
 * @returns Danh sách câu hỏi với mã 'ns-1', 'ns-2', …
 */
export function generateNumberSeriesQuestions(count: number, difficulty?: Difficulty): Question[] {
  const questions: Question[] = []
  const usedPrompts = new Set<string>()
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard']

  while (questions.length < count) {
    const level = difficulty ?? pickOne(difficulties)
    const question = generateNumberSeriesQuestion(`ns-${questions.length + 1}`, level)
    // Trùng đề thì bỏ, sinh lại (xác suất trùng rất nhỏ vì tham số ngẫu nhiên nhiều)
    if (usedPrompts.has(question.prompt)) continue
    usedPrompts.add(question.prompt)
    questions.push(question)
  }

  return questions
}
