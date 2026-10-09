// Ngân hàng câu hỏi soạn tay (file JSON): soát dữ liệu và ra đề.
// - Soát dữ liệu: file JSON do người viết nên có thể sai sót; các hàm ở đây soát từng câu và báo lỗi rõ ràng
//   bằng tiếng Việt, để test phát hiện ngay khi có câu thiếu đáp án, thiếu lời giải, trùng mã…
// - Ra đề: chọn ngẫu nhiên câu theo độ khó, xáo lựa chọn, gán nhãn A–E (dùng chung cho Logic, Ngôn ngữ).

import type { BankQuestion } from '../types/bank'
import type { Difficulty, Option, Question, QuestionCategory } from '../types/question'
import { shuffle } from '../utils/random'

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
const MIN_OPTIONS = 3
const MAX_OPTIONS = 5

/** Kiểm tra giá trị có phải chuỗi không rỗng (sau khi bỏ khoảng trắng hai đầu). */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

/** Kiểm tra giá trị có phải mảng các chuỗi không rỗng. */
export function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString)
}

/**
 * Soát một câu hỏi, trả về danh sách lỗi (rỗng nghĩa là hợp lệ).
 * @param item Một phần tử đọc từ file JSON (chưa biết đúng kiểu hay chưa).
 * @param options.idPrefix Tiền tố bắt buộc của mã câu, ví dụ 'lg' cho Logic.
 * @param options.topics Danh sách chủ đề hợp lệ của dạng bài.
 * @returns Các thông báo lỗi.
 */
export function validateBankQuestion(
  item: unknown,
  { idPrefix, topics }: { idPrefix: string; topics: readonly string[] },
): string[] {
  if (typeof item !== 'object' || item === null) return ['không phải một object']
  const q = item as Record<string, unknown>
  const errors: string[] = []

  // Mã câu: đúng dạng '<tiền tố>-<3 chữ số>'
  if (typeof q.id !== 'string' || !new RegExp(`^${idPrefix}-\\d{3}$`).test(q.id)) {
    errors.push(`id phải có dạng "${idPrefix}-001"`)
  }
  if (!DIFFICULTIES.includes(q.difficulty as Difficulty)) {
    errors.push(`difficulty phải là một trong: ${DIFFICULTIES.join(', ')}`)
  }
  if (typeof q.topic !== 'string' || !topics.includes(q.topic)) {
    errors.push(`topic phải là một trong: ${topics.join(', ')}`)
  }
  if (!isNonEmptyString(q.prompt)) errors.push('prompt (đề bài) bị trống')

  // Lựa chọn: 3–5 lựa chọn, không rỗng, không trùng nhau
  if (!isNonEmptyStringArray(q.options)) {
    errors.push('options phải là mảng các lựa chọn không rỗng')
  } else {
    if (q.options.length < MIN_OPTIONS || q.options.length > MAX_OPTIONS) {
      errors.push(`options phải có từ ${MIN_OPTIONS} đến ${MAX_OPTIONS} lựa chọn (đang có ${q.options.length})`)
    }
    const normalized = q.options.map((o) => o.trim().toLowerCase())
    if (new Set(normalized).size !== normalized.length) errors.push('options có lựa chọn bị trùng')
    // Đáp án: vị trí hợp lệ trong mảng lựa chọn
    if (!Number.isInteger(q.answerIndex) || (q.answerIndex as number) < 0 || (q.answerIndex as number) >= q.options.length) {
      errors.push(`answerIndex phải là số nguyên từ 0 đến ${q.options.length - 1}`)
    }
  }

  // Lời giải: ít nhất 1 bước, không bước nào rỗng
  if (!isNonEmptyStringArray(q.explanationSteps) || q.explanationSteps.length === 0) {
    errors.push('explanationSteps (lời giải) phải có ít nhất 1 bước và không bước nào rỗng')
  }
  if (q.fixedOrder !== undefined && typeof q.fixedOrder !== 'boolean') {
    errors.push('fixedOrder chỉ được là true hoặc false')
  }
  return errors
}

/**
 * Soát cả ngân hàng câu hỏi: từng câu + mã không trùng nhau.
 * @param data Nội dung file JSON.
 * @param rules Tiền tố mã câu và các chủ đề hợp lệ.
 * @returns Danh sách lỗi dạng 'lg-003: answerIndex …' (rỗng nghĩa là toàn bộ hợp lệ).
 */
export function validateBank(
  data: unknown,
  rules: { idPrefix: string; topics: readonly string[] },
): string[] {
  if (!Array.isArray(data)) return ['file phải là một mảng các câu hỏi']
  const errors: string[] = []
  const seenIds = new Set<string>()

  data.forEach((item, index) => {
    // Gọi tên câu theo mã nếu có, không có thì theo vị trí trong file
    const id = (item as { id?: unknown })?.id
    const label = typeof id === 'string' ? id : `câu thứ ${index + 1}`
    for (const error of validateBankQuestion(item, rules)) errors.push(`${label}: ${error}`)
    if (typeof id === 'string') {
      if (seenIds.has(id)) errors.push(`${label}: id bị trùng`)
      seenIds.add(id)
    }
  })
  return errors
}

/**
 * Ép kiểu dữ liệu JSON thành BankQuestion[] SAU KHI đã soát hợp lệ.
 * Có lỗi thì dừng ngay và báo đủ danh sách lỗi (không ra đề từ dữ liệu sai).
 */
export function loadBank(data: unknown, rules: { idPrefix: string; topics: readonly string[] }): BankQuestion[] {
  const errors = validateBank(data, rules)
  if (errors.length > 0) throw new Error(`Ngân hàng câu hỏi có lỗi:\n${errors.join('\n')}`)
  return data as BankQuestion[]
}

// ─────────────────────────────── Ra đề ───────────────────────────────

const OPTION_IDS = ['A', 'B', 'C', 'D', 'E']

/**
 * Đếm số câu có trong ngân hàng theo độ khó.
 * @param bank Ngân hàng câu hỏi.
 * @param difficulty Độ khó; bỏ trống (hỗn hợp) thì đếm tất cả.
 */
export function countBank(bank: BankQuestion[], difficulty?: Difficulty): number {
  return difficulty ? bank.filter((q) => q.difficulty === difficulty).length : bank.length
}

/**
 * Chuyển một câu soạn sẵn thành câu hỏi để hiển thị:
 * xáo trộn lựa chọn (trừ khi fixedOrder), gán nhãn A–E theo thứ tự sau khi xáo, tìm lại nhãn của đáp án đúng.
 * Mã câu giữ nguyên mã trong ngân hàng (ví dụ 'lg-012') để sau này thống kê theo từng câu.
 * @param item Câu soạn sẵn.
 * @param category Dạng bài.
 * @param instruction Lời dẫn hiển thị phía trên đề.
 */
export function bankItemToQuestion(item: BankQuestion, category: QuestionCategory, instruction: string): Question {
  // Đánh dấu vị trí gốc để sau khi xáo vẫn biết lựa chọn nào là đáp án đúng
  const indexed = item.options.map((content, originalIndex) => ({ content, originalIndex }))
  const ordered = item.fixedOrder ? indexed : shuffle(indexed)
  const options: Option[] = ordered.map((o, i) => ({ id: OPTION_IDS[i], content: o.content }))
  const correctPosition = ordered.findIndex((o) => o.originalIndex === item.answerIndex)

  return {
    id: item.id,
    category,
    difficulty: item.difficulty,
    instruction,
    prompt: item.prompt,
    options,
    correctOptionId: OPTION_IDS[correctPosition],
    explanationSteps: item.explanationSteps,
  }
}

/**
 * Ra đề từ ngân hàng: chọn ngẫu nhiên `count` câu khác nhau (theo độ khó nếu có), rồi chuyển thành câu hỏi.
 * @param bank Ngân hàng câu hỏi.
 * @param count Số câu cần.
 * @param difficulty Độ khó; bỏ trống (hỗn hợp) thì chọn trong toàn bộ ngân hàng.
 * @param category Dạng bài.
 * @param instruction Lời dẫn của dạng bài.
 * @throws Lỗi nếu ngân hàng không đủ câu (trang chủ đã khóa lựa chọn này, lỗi chỉ xảy ra khi gọi sai).
 */
export function pickFromBank(
  bank: BankQuestion[],
  count: number,
  difficulty: Difficulty | undefined,
  category: QuestionCategory,
  instruction: string,
): Question[] {
  const pool = difficulty ? bank.filter((q) => q.difficulty === difficulty) : bank
  if (pool.length < count) {
    throw new Error(`Ngân hàng chỉ có ${pool.length} câu, không đủ ${count} câu`)
  }
  return shuffle(pool)
    .slice(0, count)
    .map((item) => bankItemToQuestion(item, category, instruction))
}
