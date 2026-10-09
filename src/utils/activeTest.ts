// Lưu / khôi phục BÀI ĐANG LÀM, để tải lại trang (F5) hoặc lỡ đóng tab vẫn làm tiếp được.

import type { Question, TestConfig } from '../types/question'
import { type KeyValueStorage, readJson, removeKey, writeJson } from './storage'

/** Khóa lưu bài đang làm. */
const KEY = 'active-test'

/** Toàn bộ trạng thái cần để tiếp tục một bài đang làm. */
export interface ActiveTest {
  config: TestConfig
  questions: Question[]
  /** Thời điểm bắt đầu làm bài (mili giây, dạng Date.now()). Đồng hồ tính từ đây, kể cả lúc tab bị đóng. */
  startAt: number
  /** Đáp án đã chọn: { mã câu hỏi: mã lựa chọn }. */
  selected: Record<string, string>
  /** Vị trí câu đang xem (bắt đầu từ 0). */
  currentIndex: number
}

/**
 * Kiểm tra dữ liệu đọc được có đúng hình dạng ActiveTest không (dữ liệu có thể hỏng hoặc từ phiên bản cũ).
 * Chỉ kiểm tra các phần mà web cần để chạy, không soát sâu từng câu hỏi.
 */
export function isActiveTest(value: unknown): value is ActiveTest {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  const config = v.config as Record<string, unknown> | undefined
  return (
    typeof config === 'object' &&
    config !== null &&
    typeof config.category === 'string' &&
    typeof config.questionCount === 'number' &&
    (config.timeLimitSec === null || typeof config.timeLimitSec === 'number') &&
    Array.isArray(v.questions) &&
    v.questions.length > 0 &&
    typeof v.startAt === 'number' &&
    typeof v.selected === 'object' &&
    v.selected !== null &&
    typeof v.currentIndex === 'number' &&
    v.currentIndex >= 0 &&
    v.currentIndex < v.questions.length
  )
}

/** Lưu bài đang làm (ghi đè bản cũ). */
export function saveActiveTest(test: ActiveTest, storage?: KeyValueStorage | null): void {
  writeJson(KEY, test, storage)
}

/**
 * Đọc bài đang làm.
 * @returns Bài đang làm, hoặc null nếu không có. Dữ liệu hỏng thì xóa luôn để lần sau không đọc lại.
 */
export function loadActiveTest(storage?: KeyValueStorage | null): ActiveTest | null {
  const value = readJson(KEY, storage)
  if (value === null) return null
  if (isActiveTest(value)) return value
  removeKey(KEY, storage)
  return null
}

/** Xóa bài đang làm (khi nộp bài hoặc thoát bài). */
export function clearActiveTest(storage?: KeyValueStorage | null): void {
  removeKey(KEY, storage)
}
