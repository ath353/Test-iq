// Dạng Suy luận logic: ra đề từ ngân hàng câu hỏi soạn sẵn (src/data/logical.json).

import logicalData from '../data/logical.json'
import type { Difficulty, Question } from '../types/question'
import { countBank, loadBank, pickFromBank } from './bank'

/** Quy tắc soát dữ liệu cho ngân hàng câu hỏi Logic. */
export const LOGICAL_BANK_RULES = {
  /** Mã câu dạng 'lg-001'. */
  idPrefix: 'lg',
  /**
   * Các chủ đề:
   * - ordering: sắp xếp thứ tự (cao/thấp, trước/sau, nhiều/ít…)
   * - syllogism: tam đoạn luận ("tất cả", "một số", "không có"… → kết luận nào chắc chắn đúng)
   * - seating: xếp chỗ ngồi / vị trí theo điều kiện
   */
  topics: ['ordering', 'syllogism', 'seating'],
} as const

/** Lời dẫn của mọi câu Logic. */
const INSTRUCTION = 'Đọc kỹ các dữ kiện và chọn đáp án đúng:'

/** Ngân hàng đã soát lỗi, nạp một lần khi mở web. Dữ liệu sai thì báo lỗi ngay, không ra đề. */
const BANK = loadBank(logicalData, LOGICAL_BANK_RULES)

/**
 * Số câu Logic hiện có theo độ khó (để trang chủ khóa các lựa chọn số câu không đủ).
 * @param difficulty Độ khó; bỏ trống (hỗn hợp) thì đếm tất cả.
 */
export function countLogicalQuestions(difficulty?: Difficulty): number {
  return countBank(BANK, difficulty)
}

/**
 * Ra đề Logic: chọn ngẫu nhiên các câu khác nhau trong ngân hàng.
 * @param count Số câu.
 * @param difficulty Độ khó cố định; bỏ trống thì chọn trong toàn bộ ngân hàng.
 * @returns Danh sách câu hỏi, mã câu giữ nguyên mã trong ngân hàng (ví dụ 'lg-012').
 */
export function generateLogicalQuestions(count: number, difficulty?: Difficulty): Question[] {
  return pickFromBank(BANK, count, difficulty, 'logical', INSTRUCTION)
}
