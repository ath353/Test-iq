// Hàm tiện ích cho bảng số liệu.

/** Mẫu ô chứa số: có thể có dấu âm, dấu chấm/phẩy, khoảng trắng, phần trăm ở cuối. */
const NUMERIC_CELL = /^[-+−]?[\d.,\s]+%?$/

/**
 * Kiểm tra một ô bảng có phải là số không (để căn phải cho dễ so sánh).
 * Ví dụ là số: '120', '1.200', '5,5%', '-2%'. Không phải số: 'Q1', '12 tỷ', ''.
 * @param cell Nội dung ô.
 * @returns true nếu ô là số.
 */
export function isNumericCell(cell: string): boolean {
  return NUMERIC_CELL.test(cell.trim())
}
