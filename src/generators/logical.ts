// Dạng Suy luận logic: ghép câu soạn sẵn (src/data/logical.json) với câu sinh bằng code.
//
// Một bài N câu gồm:
//   - khoảng 1/3 tam đoạn luận: chỉ có trong ngân hàng soạn tay (cần câu chữ tự nhiên), ưu tiên câu ít gặp;
//   - phần còn lại là sắp xếp thứ tự / xếp chỗ ngồi: dùng trước các câu soạn tay CHƯA LÀM (lời giải chi tiết hơn),
//     hết thì sinh bằng code (logicOrdering.ts, logicSeating.ts), không giới hạn số câu.

import logicalData from '../data/logical.json'
import type { Difficulty, Question } from '../types/question'
import { pickOne, shuffle } from '../utils/random'
import { bankItemToQuestion, countBank, loadBank, pickLeastSeen, type SeenCounts } from './bank'
import { generateOrderingQuestion } from './logicOrdering'
import { generateSeatingQuestion } from './logicSeating'

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
 * Số câu Logic SOẠN TAY hiện có theo độ khó (câu sinh bằng code thì không giới hạn).
 * @param difficulty Độ khó; bỏ trống (hỗn hợp) thì đếm tất cả.
 */
export function countLogicalQuestions(difficulty?: Difficulty): number {
  return countBank(BANK, difficulty)
}

/** Tỉ lệ tam đoạn luận trong một bài Logic. */
const SYLLOGISM_SHARE = 1 / 3

/**
 * Ra đề Logic (không giới hạn số câu).
 * Cách làm:
 *   1. Tam đoạn luận: lấy round(count × 1/3) câu từ ngân hàng (theo độ khó), ưu tiên câu ít gặp;
 *      ngân hàng không đủ thì lấy hết số có.
 *   2. Thứ tự / xếp chỗ: lấy các câu soạn tay CHƯA LÀM (theo độ khó), xáo ngẫu nhiên.
 *   3. Còn thiếu thì sinh bằng code, xen kẽ thứ tự và xếp chỗ (độ khó theo lựa chọn; hỗn hợp thì ngẫu nhiên).
 *   4. Xáo trộn cả bài.
 * @param count Số câu.
 * @param difficulty Độ khó cố định; bỏ trống là hỗn hợp.
 * @param seen Số lần mỗi câu soạn tay đã gặp (từ lịch sử); bỏ trống thì coi như chưa gặp.
 * @returns Danh sách câu hỏi; câu soạn tay giữ mã gốc ('lg-012'), câu sinh bằng code có mã 'lo-1', 'ls-2'…
 */
export function generateLogicalQuestions(count: number, difficulty?: Difficulty, seen: SeenCounts = new Map()): Question[] {
  const pool = difficulty ? BANK.filter((q) => q.difficulty === difficulty) : BANK
  const toQuestion = (item: (typeof BANK)[number]) => bankItemToQuestion(item, 'logical', INSTRUCTION)

  // 1. Tam đoạn luận từ ngân hàng
  const syllogisms = pool.filter((q) => q.topic === 'syllogism')
  const syllogismCount = Math.min(Math.round(count * SYLLOGISM_SHARE), syllogisms.length)
  const picked = pickLeastSeen(syllogisms, syllogismCount, seen).map(toQuestion)

  // 2. Thứ tự / xếp chỗ soạn tay chưa làm
  const unseenOthers = shuffle(pool.filter((q) => q.topic !== 'syllogism' && !seen.get(q.id)))
  picked.push(...unseenOthers.slice(0, count - picked.length).map(toQuestion))

  // 3. Sinh bằng code cho đủ, xen kẽ thứ tự / xếp chỗ (bắt đầu ngẫu nhiên), mã câu không trùng
  const levels: Difficulty[] = ['easy', 'medium', 'hard']
  let useOrdering = Math.random() < 0.5
  for (let i = 1; picked.length < count; i++) {
    const level = difficulty ?? pickOne(levels)
    picked.push(useOrdering ? generateOrderingQuestion(`lo-${i}`, level) : generateSeatingQuestion(`ls-${i}`, level))
    useOrdering = !useOrdering
  }

  return shuffle(picked)
}
