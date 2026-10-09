// Lịch sử kết quả làm bài, lưu trong bộ nhớ trình duyệt (localStorage).
// Mỗi bài lưu đủ đề + đáp án + kết quả để sau này xem lại lời giải (bước 3.3) và thống kê (bước 3.4).

import type { TestResult } from '../types/question'
import { type KeyValueStorage, readJson, removeKey, writeJson } from './storage'

/** Khóa lưu lịch sử. */
const KEY = 'history'

/** Số bài tối đa được giữ (bài cũ hơn bị xóa). */
export const MAX_HISTORY = 200

/** Một mục trong lịch sử. */
export interface HistoryEntry {
  /** Mã mục, duy nhất (để mở lại đúng bài ở trang lịch sử). */
  id: string
  result: TestResult
}

/** Tạo mã mục duy nhất từ thời điểm hiện tại + chuỗi ngẫu nhiên. */
function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Kiểm tra một mục đọc từ bộ nhớ có đúng hình dạng không (dữ liệu có thể hỏng hoặc từ phiên bản cũ).
 * Chỉ kiểm tra các phần mà trang lịch sử / thống kê cần.
 */
export function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== 'object' || value === null) return false
  const { id, result } = value as Record<string, unknown>
  if (typeof id !== 'string' || typeof result !== 'object' || result === null) return false
  const r = result as Record<string, unknown>
  const config = r.config as Record<string, unknown> | undefined
  return (
    typeof config === 'object' &&
    config !== null &&
    typeof config.category === 'string' &&
    Array.isArray(r.questions) &&
    Array.isArray(r.answers) &&
    typeof r.correctCount === 'number' &&
    typeof r.durationSec === 'number' &&
    typeof r.finishedAt === 'string'
  )
}

/**
 * Đọc lịch sử, bài mới nhất đứng đầu. Bỏ qua các mục hỏng thay vì làm hỏng cả lịch sử.
 * @param storage Bộ nhớ (mặc định localStorage; truyền vào để test).
 */
export function loadHistory(storage?: KeyValueStorage | null): HistoryEntry[] {
  const value = readJson(KEY, storage)
  return Array.isArray(value) ? value.filter(isHistoryEntry) : []
}

/**
 * Ghi danh sách lịch sử. Nếu bộ nhớ đầy thì xóa bớt bài cũ nhất (cuối danh sách), mỗi lần bớt 1/4,
 * cho đến khi ghi được. Bài mới nhất luôn được giữ lại nếu còn có thể.
 * @returns Danh sách thực sự đã ghi được (có thể ngắn hơn danh sách đưa vào).
 */
function saveWithEviction(entries: HistoryEntry[], storage?: KeyValueStorage | null): HistoryEntry[] {
  let kept = entries
  while (kept.length > 0) {
    if (writeJson(KEY, kept, storage)) return kept
    // Ghi không được (thường là đầy bộ nhớ): bỏ 1/4 số bài cũ nhất, ít nhất 1 bài
    kept = kept.slice(0, kept.length - Math.max(1, Math.floor(kept.length / 4)))
  }
  return kept
}

/**
 * Thêm kết quả vừa nộp vào đầu lịch sử, giữ tối đa MAX_HISTORY bài.
 * @param result Kết quả bài vừa nộp.
 * @param storage Bộ nhớ (mặc định localStorage).
 * @returns Lịch sử sau khi thêm (đúng như đã lưu được).
 */
export function addToHistory(result: TestResult, storage?: KeyValueStorage | null): HistoryEntry[] {
  const entries = [{ id: createId(), result }, ...loadHistory(storage)].slice(0, MAX_HISTORY)
  return saveWithEviction(entries, storage)
}

/**
 * Đếm số lần mỗi câu hỏi đã xuất hiện trong lịch sử: { mã câu: số lần }.
 * Dùng để ra đề ưu tiên câu ít gặp (Logic, Ngôn ngữ có mã câu cố định như 'lg-012', 'vb-031').
 * @param entries Lịch sử.
 */
export function countSeenQuestions(entries: HistoryEntry[]): Map<string, number> {
  const seen = new Map<string, number>()
  for (const { result } of entries) {
    for (const q of result.questions) seen.set(q.id, (seen.get(q.id) ?? 0) + 1)
  }
  return seen
}

/** Xóa toàn bộ lịch sử. */
export function clearHistory(storage?: KeyValueStorage | null): void {
  removeKey(KEY, storage)
}
