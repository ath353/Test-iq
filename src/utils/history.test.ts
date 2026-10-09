// Kiểm thử lịch sử kết quả, dùng bộ nhớ giả thay cho localStorage.
import { describe, expect, it } from 'vitest'
import { generateQuestions } from '../generators'
import type { TestConfig, TestResult } from '../types/question'
import { addToHistory, isHistoryEntry, loadHistory, MAX_HISTORY } from './history'
import { gradeTest } from './scoring'
import { type KeyValueStorage, STORAGE_PREFIX, writeJson } from './storage'

/**
 * Bộ nhớ giả. maxChars: giới hạn tổng số ký tự (giả lập localStorage đầy); vượt quá thì báo lỗi như trình duyệt.
 */
function fakeStorage(maxChars = Infinity): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      if (v.length > maxChars) throw new Error('QuotaExceededError')
      data.set(k, v)
    },
    removeItem: (k) => void data.delete(k),
  }
}

/** Tạo một kết quả bài làm thật (10 câu Dãy số), đánh dấu bằng thời gian làm để phân biệt các bài. */
function makeResult(durationSec: number, category: TestConfig['category'] = 'number-series'): TestResult {
  const config: TestConfig = { category, questionCount: 10, difficulty: 'mixed', timeLimitSec: 450 }
  const questions = generateQuestions(config)
  const answers = questions.map((q) => ({ questionId: q.id, selectedOptionId: q.correctOptionId }))
  return gradeTest(config, questions, answers, durationSec, false)
}

describe('history', () => {
  it('thêm bài mới vào đầu danh sách, đọc lại đúng, mã mục không trùng', () => {
    const storage = fakeStorage()
    addToHistory(makeResult(1), storage)
    addToHistory(makeResult(2), storage)
    const history = loadHistory(storage)
    expect(history.map((h) => h.result.durationSec)).toEqual([2, 1])
    expect(history[0].id).not.toBe(history[1].id)
    expect(history[0].result.correctCount).toBe(10)
  })

  it(`chỉ giữ tối đa ${MAX_HISTORY} bài, bỏ bài cũ nhất`, () => {
    const storage = fakeStorage()
    // Ghi sẵn 200 bài cũ (dùng chung một kết quả cho nhanh)
    const old = makeResult(0)
    writeJson('history', Array.from({ length: MAX_HISTORY }, (_, i) => ({ id: `old-${i}`, result: old })), storage)
    const history = addToHistory(makeResult(999), storage)
    expect(history).toHaveLength(MAX_HISTORY)
    expect(history[0].result.durationSec).toBe(999)
    expect(history.some((h) => h.id === `old-${MAX_HISTORY - 1}`)).toBe(false)
  })

  it('bộ nhớ đầy thì tự xóa bớt bài cũ nhất, vẫn giữ bài mới', () => {
    // Một bài khoảng vài KB; giới hạn bộ nhớ chỉ đủ cho khoảng 3 bài
    const sample = JSON.stringify([{ id: 'x', result: makeResult(0) }]).length
    const storage = fakeStorage(sample * 3.5)
    for (let i = 1; i <= 10; i++) addToHistory(makeResult(i), storage)
    const history = loadHistory(storage)
    expect(history.length).toBeGreaterThan(0)
    expect(history.length).toBeLessThanOrEqual(3)
    expect(history[0].result.durationSec).toBe(10)
  })

  it('bỏ qua mục hỏng, giữ các mục còn tốt', () => {
    const storage = fakeStorage()
    addToHistory(makeResult(5), storage)
    const raw = JSON.parse(storage.data.get(`${STORAGE_PREFIX}history`)!)
    storage.data.set(`${STORAGE_PREFIX}history`, JSON.stringify([...raw, { id: 1 }, null, 'rác']))
    expect(loadHistory(storage)).toHaveLength(1)
  })

  it('không có lịch sử hoặc dữ liệu không phải mảng thì trả về danh sách rỗng', () => {
    expect(loadHistory(fakeStorage())).toEqual([])
    const storage = fakeStorage()
    writeJson('history', { không: 'phải mảng' }, storage)
    expect(loadHistory(storage)).toEqual([])
  })

  it('isHistoryEntry nhận đúng mục hợp lệ của mọi dạng bài (kể cả có hình, đoạn văn)', () => {
    for (const category of ['number-series', 'numerical', 'logical', 'verbal', 'abstract'] as const) {
      expect(isHistoryEntry({ id: 'a', result: makeResult(1, category) })).toBe(true)
    }
    expect(isHistoryEntry({ id: 'a', result: {} })).toBe(false)
  })
})
