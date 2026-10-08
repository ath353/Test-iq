// Kiểm thử các hàm ngẫu nhiên. Mỗi hàm chạy nhiều lần để bắt lỗi biên.
import { describe, expect, it } from 'vitest'
import { pickOne, randomInt, shuffle } from './random'

describe('randomInt', () => {
  it('luôn nằm trong khoảng [min, max] và trả về số nguyên', () => {
    for (let i = 0; i < 1000; i++) {
      const n = randomInt(3, 7)
      expect(Number.isInteger(n)).toBe(true)
      expect(n).toBeGreaterThanOrEqual(3)
      expect(n).toBeLessThanOrEqual(7)
    }
  })

  it('ra được cả hai giá trị biên min và max', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 1000; i++) seen.add(randomInt(1, 3))
    expect([...seen].sort()).toEqual([1, 2, 3])
  })
})

describe('pickOne', () => {
  it('trả về một phần tử có trong mảng', () => {
    const items = ['A', 'B', 'C']
    for (let i = 0; i < 100; i++) expect(items).toContain(pickOne(items))
  })

  it('báo lỗi khi mảng rỗng', () => {
    expect(() => pickOne([])).toThrow()
  })
})

describe('shuffle', () => {
  it('giữ nguyên các phần tử và không sửa mảng gốc', () => {
    const items = [1, 2, 3, 4, 5]
    const result = shuffle(items)
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5])
    expect(items).toEqual([1, 2, 3, 4, 5])
  })
})
