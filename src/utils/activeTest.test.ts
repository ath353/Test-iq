// Kiểm thử lưu / khôi phục bài đang làm, dùng bộ nhớ giả thay cho localStorage.
import { describe, expect, it } from 'vitest'
import { generateQuestions } from '../generators'
import type { TestConfig } from '../types/question'
import { type ActiveTest, clearActiveTest, isActiveTest, loadActiveTest, saveActiveTest } from './activeTest'
import { type KeyValueStorage, readJson, STORAGE_PREFIX, writeJson } from './storage'

/** Bộ nhớ giả: hoạt động như localStorage nhưng lưu trong một Map. */
function fakeStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

/** Bộ nhớ luôn báo lỗi (giống khi trình duyệt chặn hoặc đầy bộ nhớ). */
const brokenStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('quota')
  },
  removeItem: () => {
    throw new Error('blocked')
  },
}

const config: TestConfig = { category: 'abstract', questionCount: 3, difficulty: 'mixed', timeLimitSec: 180 }

/** Một bài đang làm mẫu: dùng câu hỏi Suy luận hình (có hình, dữ liệu phức tạp nhất). */
function sampleTest(): ActiveTest {
  const questions = generateQuestions(config)
  return { config, questions, startAt: 1_700_000_000_000, selected: { [questions[0].id]: 'B' }, currentIndex: 1 }
}

describe('storage', () => {
  it('ghi rồi đọc lại đúng giá trị, khóa có tiền tố phiên bản', () => {
    const storage = fakeStorage()
    expect(writeJson('x', { a: 1 }, storage)).toBe(true)
    expect(storage.data.has(`${STORAGE_PREFIX}x`)).toBe(true)
    expect(readJson('x', storage)).toEqual({ a: 1 })
  })

  it('dữ liệu hỏng hoặc bộ nhớ lỗi thì không làm web sập', () => {
    const storage = fakeStorage()
    storage.data.set(`${STORAGE_PREFIX}x`, '{hỏng')
    expect(readJson('x', storage)).toBeNull()
    expect(readJson('x', brokenStorage)).toBeNull()
    expect(writeJson('x', 1, brokenStorage)).toBe(false)
    expect(writeJson('x', 1, null)).toBe(false)
  })
})

describe('activeTest', () => {
  it('lưu rồi khôi phục nguyên vẹn bài đang làm (kể cả câu hỏi có hình)', () => {
    const storage = fakeStorage()
    const test = sampleTest()
    saveActiveTest(test, storage)
    expect(loadActiveTest(storage)).toEqual(test)
  })

  it('xóa bài đang làm', () => {
    const storage = fakeStorage()
    saveActiveTest(sampleTest(), storage)
    clearActiveTest(storage)
    expect(loadActiveTest(storage)).toBeNull()
  })

  it('dữ liệu sai hình dạng thì bỏ qua và xóa luôn', () => {
    const storage = fakeStorage()
    writeJson('active-test', { config: {}, questions: [] }, storage)
    expect(loadActiveTest(storage)).toBeNull()
    expect(storage.data.size).toBe(0)
  })

  it('isActiveTest từ chối vị trí câu vượt quá số câu', () => {
    expect(isActiveTest({ ...sampleTest(), currentIndex: 99 })).toBe(false)
    expect(isActiveTest(sampleTest())).toBe(true)
  })

  it('bộ nhớ lỗi thì không làm web sập', () => {
    expect(() => saveActiveTest(sampleTest(), brokenStorage)).not.toThrow()
    expect(loadActiveTest(brokenStorage)).toBeNull()
    expect(() => clearActiveTest(brokenStorage)).not.toThrow()
  })
})
