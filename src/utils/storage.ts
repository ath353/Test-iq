// Đọc / ghi dữ liệu JSON vào bộ nhớ trình duyệt (localStorage) một cách an toàn.
// localStorage có thể không dùng được (chế độ ẩn danh, bị chặn, đầy bộ nhớ…) hoặc chứa dữ liệu hỏng,
// nên mọi thao tác đều bọc try/catch: lỗi thì bỏ qua, web vẫn chạy bình thường (chỉ là không lưu được).

/** Tiền tố cho mọi khóa của web, kèm số phiên bản cấu trúc dữ liệu (đổi cấu trúc thì tăng số này). */
export const STORAGE_PREFIX = 'test-iq:v1:'

/** Phần tối thiểu của localStorage mà web dùng; tách ra để test truyền vào bộ nhớ giả. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** Lấy localStorage của trình duyệt; không có (môi trường test, bị chặn) thì trả về null. */
function defaultStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/**
 * Đọc một giá trị JSON.
 * @param key Khóa (không gồm tiền tố).
 * @param storage Bộ nhớ (mặc định localStorage).
 * @returns Giá trị đã đọc, hoặc null nếu không có / hỏng / không đọc được.
 */
export function readJson(key: string, storage: KeyValueStorage | null = defaultStorage()): unknown {
  try {
    const raw = storage?.getItem(STORAGE_PREFIX + key)
    return raw ? (JSON.parse(raw) as unknown) : null
  } catch {
    return null
  }
}

/**
 * Ghi một giá trị dưới dạng JSON.
 * @returns true nếu ghi được.
 */
export function writeJson(key: string, value: unknown, storage: KeyValueStorage | null = defaultStorage()): boolean {
  try {
    if (!storage) return false
    storage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** Xóa một khóa. */
export function removeKey(key: string, storage: KeyValueStorage | null = defaultStorage()): void {
  try {
    storage?.removeItem(STORAGE_PREFIX + key)
  } catch {
    // Không xóa được thì bỏ qua
  }
}
