// Kiểu dữ liệu của một câu hỏi trong ngân hàng câu hỏi soạn sẵn (file JSON trong src/data).
// Dùng cho các dạng không sinh được bằng code: Logic (logical.json), Ngôn ngữ (verbal.json, bước 2.3).

import type { Difficulty } from './question'

/**
 * Một câu hỏi soạn sẵn, đúng như khi viết trong file JSON.
 * Khác với Question: chưa có nhãn A–E và chưa xáo trộn; đáp án ghi bằng VỊ TRÍ trong mảng options.
 *
 * Ví dụ trong JSON:
 * {
 *   "id": "lg-001",
 *   "difficulty": "easy",
 *   "topic": "ordering",
 *   "prompt": "An cao hơn Bình. Bình cao hơn Chi.\nAi thấp nhất?",
 *   "options": ["An", "Bình", "Chi"],
 *   "answerIndex": 2,
 *   "explanationSteps": ["Sắp xếp từ cao đến thấp: An > Bình > Chi.", "Thấp nhất: Chi."]
 * }
 */
export interface BankQuestion {
  /** Mã câu, duy nhất trong file, dạng '<tiền tố>-<3 chữ số>', ví dụ 'lg-001'. */
  id: string
  difficulty: Difficulty
  /** Chủ đề nhỏ trong dạng bài, ví dụ 'ordering' (sắp xếp thứ tự). Dùng để thống kê sau này. */
  topic: string
  /** Đề bài; xuống dòng bằng \n (mỗi dữ kiện một dòng cho dễ đọc). */
  prompt: string
  /** Các lựa chọn (3 đến 5), viết đầy đủ, không kèm nhãn A/B/C. */
  options: string[]
  /** Vị trí đáp án đúng trong mảng options, bắt đầu từ 0. */
  answerIndex: number
  /** Lời giải từng bước (ít nhất 1 bước, không bước nào rỗng). */
  explanationSteps: string[]
  /**
   * true: giữ nguyên thứ tự lựa chọn, không xáo trộn khi ra đề.
   * Dùng khi thứ tự có ý nghĩa, ví dụ lựa chọn cuối là "Không xác định được".
   */
  fixedOrder?: boolean
}

// ─────────────────────────────── Dạng Ngôn ngữ (verbal.json) ───────────────────────────────

/** Đáp án của một nhận định: Đúng / Sai / Không đủ thông tin (theo chuẩn bài SHL). */
export type VerbalAnswer = 'true' | 'false' | 'cannot-say'

/** Một đoạn văn. Mỗi đoạn văn đi kèm nhiều nhận định. */
export interface VerbalPassage {
  /** Mã đoạn văn, dạng 'vb-p01'. */
  id: string
  /** Tên ngắn của đoạn văn, ví dụ 'Làm việc từ xa'. */
  title: string
  /** Nội dung đoạn văn. */
  text: string
}

/**
 * Một nhận định cần đánh giá dựa trên đoạn văn.
 * Khi ra đề, mỗi nhận định thành một câu hỏi có 3 lựa chọn cố định: Đúng / Sai / Không đủ thông tin.
 */
export interface VerbalStatement {
  /** Mã nhận định, dạng 'vb-001'. */
  id: string
  /** Mã đoạn văn mà nhận định này dựa vào. */
  passageId: string
  difficulty: Difficulty
  /** Nội dung nhận định. */
  statement: string
  answer: VerbalAnswer
  /** Lời giải từng bước: trích ý trong đoạn văn, suy luận, kết luận. */
  explanationSteps: string[]
}

/** Toàn bộ file verbal.json. Đoạn văn tách riêng để không phải chép lại cho từng nhận định. */
export interface VerbalBank {
  passages: VerbalPassage[]
  statements: VerbalStatement[]
}
