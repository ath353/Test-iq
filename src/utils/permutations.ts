// Liệt kê mọi hoán vị, dùng cho các bộ sinh câu Logic (vét cạn để kiểm chứng đáp án duy nhất).

/** Bộ nhớ đệm theo n, để không tính lại mỗi lần vét cạn. */
const cache = new Map<number, number[][]>()

/**
 * Mọi hoán vị của [0, 1, …, n−1]. n nhỏ (≤ 7) nên số hoán vị vẫn ít (7! = 5040).
 * Kết quả được lưu đệm; KHÔNG sửa các mảng trả về.
 * @param n Số phần tử.
 */
export function allPermutations(n: number): readonly number[][] {
  const cached = cache.get(n)
  if (cached) return cached
  // Chèn phần tử mới (n−1) vào mọi vị trí của từng hoán vị n−1 phần tử
  const result =
    n === 0
      ? [[]]
      : allPermutations(n - 1).flatMap((p) =>
          Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]),
        )
  cache.set(n, result)
  return result
}
