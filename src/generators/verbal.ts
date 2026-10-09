// Dạng Suy luận ngôn ngữ (Verbal reasoning): soát dữ liệu ngân hàng câu hỏi src/data/verbal.json
// và ra đề (ghép đoạn văn + nhận định thành câu hỏi 3 lựa chọn Đúng / Sai / Không đủ thông tin).

import verbalData from '../data/verbal.json'
import type { VerbalAnswer, VerbalBank, VerbalPassage, VerbalStatement } from '../types/bank'
import type { Difficulty, Question } from '../types/question'
import { shuffle } from '../utils/random'
import { DIFFICULTIES, isNonEmptyString, isNonEmptyStringArray } from './bank'

/** Các đáp án hợp lệ của một nhận định. */
export const VERBAL_ANSWERS: VerbalAnswer[] = ['true', 'false', 'cannot-say']

/** Chữ hiển thị của từng đáp án, theo đúng thứ tự lựa chọn A, B, C khi ra đề. */
export const VERBAL_ANSWER_LABELS: Record<VerbalAnswer, string> = {
  true: 'Đúng',
  false: 'Sai',
  'cannot-say': 'Không đủ thông tin',
}

/**
 * Soát toàn bộ file verbal.json, trả về danh sách lỗi (rỗng nghĩa là hợp lệ).
 * Kiểm tra:
 * - Đoạn văn: mã dạng 'vb-p01' không trùng, có tên và nội dung.
 * - Nhận định: mã dạng 'vb-001' không trùng, trỏ tới đoạn văn có thật, độ khó / đáp án hợp lệ,
 *   có nội dung và lời giải (ít nhất 1 bước, không bước nào rỗng).
 * - Mỗi đoạn văn có ít nhất 1 nhận định (tránh đoạn văn "mồ côi").
 * @param data Nội dung file JSON (chưa biết đúng kiểu hay chưa).
 */
export function validateVerbalBank(data: unknown): string[] {
  if (typeof data !== 'object' || data === null) return ['file phải là một object { passages, statements }']
  const { passages, statements } = data as Record<string, unknown>
  if (!Array.isArray(passages)) return ['passages phải là một mảng']
  if (!Array.isArray(statements)) return ['statements phải là một mảng']
  const errors: string[] = []

  // ── Đoạn văn ──
  const passageIds = new Set<string>()
  passages.forEach((item, index) => {
    const p = (item ?? {}) as Record<string, unknown>
    const label = typeof p.id === 'string' ? p.id : `đoạn văn thứ ${index + 1}`
    if (typeof p.id !== 'string' || !/^vb-p\d{2}$/.test(p.id)) errors.push(`${label}: id phải có dạng "vb-p01"`)
    else if (passageIds.has(p.id)) errors.push(`${label}: id bị trùng`)
    else passageIds.add(p.id)
    if (!isNonEmptyString(p.title)) errors.push(`${label}: title (tên đoạn văn) bị trống`)
    if (!isNonEmptyString(p.text)) errors.push(`${label}: text (nội dung đoạn văn) bị trống`)
  })

  // ── Nhận định ──
  const statementIds = new Set<string>()
  const usedPassages = new Set<string>()
  statements.forEach((item, index) => {
    const s = (item ?? {}) as Record<string, unknown>
    const label = typeof s.id === 'string' ? s.id : `nhận định thứ ${index + 1}`
    if (typeof s.id !== 'string' || !/^vb-\d{3}$/.test(s.id)) errors.push(`${label}: id phải có dạng "vb-001"`)
    else if (statementIds.has(s.id)) errors.push(`${label}: id bị trùng`)
    else statementIds.add(s.id)

    if (typeof s.passageId !== 'string' || !passageIds.has(s.passageId)) {
      errors.push(`${label}: passageId không trỏ tới đoạn văn nào`)
    } else {
      usedPassages.add(s.passageId)
    }
    if (!DIFFICULTIES.includes(s.difficulty as Difficulty)) {
      errors.push(`${label}: difficulty phải là một trong: ${DIFFICULTIES.join(', ')}`)
    }
    if (!isNonEmptyString(s.statement)) errors.push(`${label}: statement (nhận định) bị trống`)
    if (!VERBAL_ANSWERS.includes(s.answer as VerbalAnswer)) {
      errors.push(`${label}: answer phải là một trong: ${VERBAL_ANSWERS.join(', ')}`)
    }
    if (!isNonEmptyStringArray(s.explanationSteps) || s.explanationSteps.length === 0) {
      errors.push(`${label}: explanationSteps (lời giải) phải có ít nhất 1 bước và không bước nào rỗng`)
    }
  })

  for (const id of passageIds) {
    if (!usedPassages.has(id)) errors.push(`${id}: đoạn văn chưa có nhận định nào`)
  }
  return errors
}

// ─────────────────────────────── Ra đề ───────────────────────────────

/** Lời dẫn của mọi câu Ngôn ngữ. */
const INSTRUCTION = 'Đọc đoạn văn, rồi cho biết nhận định bên dưới là Đúng, Sai hay Không đủ thông tin:'

/** Nhãn lựa chọn theo đúng thứ tự cố định: A = Đúng, B = Sai, C = Không đủ thông tin. */
const OPTION_IDS: Record<VerbalAnswer, string> = { true: 'A', false: 'B', 'cannot-say': 'C' }

/**
 * Nạp ngân hàng đã soát lỗi. Dữ liệu sai thì dừng ngay và liệt kê lỗi, không ra đề.
 * @param data Nội dung file JSON.
 */
export function loadVerbalBank(data: unknown): VerbalBank {
  const errors = validateVerbalBank(data)
  if (errors.length > 0) throw new Error(`Ngân hàng câu hỏi Ngôn ngữ có lỗi:\n${errors.join('\n')}`)
  return data as VerbalBank
}

/** Ngân hàng nạp một lần khi mở web. */
const BANK = loadVerbalBank(verbalData)

/**
 * Chuyển một nhận định thành câu hỏi: đoạn văn làm dữ kiện, nhận định làm đề,
 * 3 lựa chọn cố định Đúng / Sai / Không đủ thông tin (không xáo trộn, giống bài SHL).
 * @param statement Nhận định.
 * @param passage Đoạn văn của nhận định.
 */
export function statementToQuestion(statement: VerbalStatement, passage: VerbalPassage): Question {
  return {
    id: statement.id,
    category: 'verbal',
    difficulty: statement.difficulty,
    instruction: INSTRUCTION,
    stimulus: { type: 'passage', title: passage.title, text: passage.text },
    prompt: statement.statement,
    options: VERBAL_ANSWERS.map((answer) => ({ id: OPTION_IDS[answer], content: VERBAL_ANSWER_LABELS[answer] })),
    correctOptionId: OPTION_IDS[statement.answer],
    explanationSteps: statement.explanationSteps,
  }
}

/**
 * Số nhận định hiện có theo độ khó (để trang chủ khóa các lựa chọn số câu không đủ).
 * @param difficulty Độ khó; bỏ trống (hỗn hợp) thì đếm tất cả.
 */
export function countVerbalStatements(difficulty?: Difficulty, bank: VerbalBank = BANK): number {
  return difficulty ? bank.statements.filter((s) => s.difficulty === difficulty).length : bank.statements.length
}

/**
 * Ra đề Ngôn ngữ, GOM THEO ĐOẠN VĂN giống bài SHL: các nhận định cùng đoạn văn đứng liền nhau,
 * người làm đọc đoạn văn một lần rồi trả lời liên tiếp.
 * Cách làm:
 *   1. Lọc nhận định theo độ khó (nếu có).
 *   2. Xáo thứ tự các đoạn văn; trong mỗi đoạn văn, xáo thứ tự nhận định.
 *   3. Nối lần lượt từng đoạn văn, lấy đủ `count` câu (đoạn văn cuối có thể chỉ lấy một phần).
 * @param count Số câu.
 * @param difficulty Độ khó cố định; bỏ trống thì lấy trong toàn bộ ngân hàng.
 * @param bank Ngân hàng (mặc định là verbal.json; truyền vào để test).
 * @throws Lỗi nếu không đủ nhận định (trang chủ đã khóa lựa chọn này).
 */
export function generateVerbalQuestions(count: number, difficulty?: Difficulty, bank: VerbalBank = BANK): Question[] {
  const pool = bank.statements.filter((s) => !difficulty || s.difficulty === difficulty)
  if (pool.length < count) throw new Error(`Ngân hàng chỉ có ${pool.length} nhận định, không đủ ${count} câu`)

  const ordered = shuffle(bank.passages).flatMap((passage) =>
    shuffle(pool.filter((s) => s.passageId === passage.id)).map((s) => statementToQuestion(s, passage)),
  )
  return ordered.slice(0, count)
}
