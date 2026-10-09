// Dạng Suy luận logic: quy tắc của ngân hàng câu hỏi (src/data/logical.json).
// Phần ra đề từ ngân hàng (chọn câu, xáo lựa chọn) sẽ được thêm ở bước 2.2c.

/** Quy tắc soát dữ liệu cho ngân hàng câu hỏi Logic. */
export const LOGICAL_BANK_RULES = {
  /** Mã câu dạng 'lg-001'. */
  idPrefix: 'lg',
  /**
   * Các chủ đề:
   * - ordering: sắp xếp thứ tự (cao/thấp, trước/sau, nhiều/ít…)
   * - syllogism: tam đoạn luận ("tất cả", "một số", "không có"… → kết luận nào chắc chắn đúng)
   * - seating: xếp chỗ ngồi / vị trí theo điều kiện
   */
  topics: ['ordering', 'syllogism', 'seating'],
} as const
