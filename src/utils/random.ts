// Các hàm ngẫu nhiên dùng cho bộ sinh đề.

/**
 * Lấy số nguyên ngẫu nhiên trong khoảng [min, max] (tính cả hai đầu).
 * @param min Giá trị nhỏ nhất.
 * @param max Giá trị lớn nhất.
 * @returns Số nguyên ngẫu nhiên.
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Chọn ngẫu nhiên một phần tử trong mảng.
 * @param items Mảng nguồn (không được rỗng).
 * @returns Một phần tử bất kỳ của mảng.
 */
export function pickOne<T>(items: readonly T[]): T {
  if (items.length === 0) throw new Error('pickOne: mảng rỗng')
  return items[randomInt(0, items.length - 1)]
}

/**
 * Xáo trộn mảng theo thuật toán Fisher–Yates, mọi thứ tự có xác suất như nhau.
 * Không sửa mảng gốc mà trả về mảng mới.
 * @param items Mảng nguồn.
 * @returns Bản sao đã xáo trộn.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  // Đi từ cuối về đầu, đổi chỗ phần tử i với một phần tử ngẫu nhiên từ 0 đến i
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
