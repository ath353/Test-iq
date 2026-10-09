// Dạng Suy luận ngôn ngữ (Verbal reasoning): soát dữ liệu ngân hàng câu hỏi src/data/verbal.json.
// Phần ra đề (ghép đoạn văn + nhận định thành câu hỏi 3 lựa chọn) sẽ được thêm ở bước 2.3b.

import type { VerbalAnswer } from '../types/bank'
import type { Difficulty } from '../types/question'
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
