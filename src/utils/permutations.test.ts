// Kiểm thử liệt kê hoán vị.
import { describe, expect, it } from 'vitest'
import { allPermutations } from './permutations'

describe('allPermutations', () => {
  it('đủ n! hoán vị, không trùng, mỗi hoán vị chứa đủ 0…n−1', () => {
    const factorial = [1, 1, 2, 6, 24, 120, 720]
    for (let n = 0; n <= 6; n++) {
      const perms = allPermutations(n)
      expect(perms).toHaveLength(factorial[n])
      expect(new Set(perms.map((p) => p.join(','))).size).toBe(factorial[n])
      for (const p of perms) expect([...p].sort()).toEqual(Array.from({ length: n }, (_, i) => i))
    }
  })
})
