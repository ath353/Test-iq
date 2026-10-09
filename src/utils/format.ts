// Định dạng và làm tròn số theo kiểu Việt Nam: dấu chấm ngăn hàng nghìn, dấu phẩy ngăn phần thập phân.

/** Bộ định dạng theo số chữ số thập phân, tạo một lần rồi dùng lại cho nhanh. */
const formatters = new Map<number, Intl.NumberFormat>()

/**
 * Làm tròn số đến số chữ số thập phân cho trước, kiểu "làm tròn nửa ra xa số 0" như khi tính tay.
 * Ví dụ: roundTo(12.345, 1) → 12.3; roundTo(12.35, 1) → 12.4; roundTo(-2.25, 1) → -2.3.
 * @param value Số cần làm tròn.
 * @param decimals Số chữ số thập phân.
 * @returns Số đã làm tròn (không bao giờ là -0).
 */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  // Bước 1: nhân lên rồi cắt bớt sai số số thực (ví dụ 1.005 × 100 = 100.49999999999999 → 100.5)
  const scaled = Number((Math.abs(value) * factor).toPrecision(12))
  // Bước 2: làm tròn phần trị tuyệt đối rồi gắn lại dấu, để số âm làm tròn đối xứng với số dương
  // (Math.round của JavaScript làm tròn -2.5 thành -2, khác với cách tính tay)
  const rounded = (Math.sign(value) * Math.round(scaled)) / factor
  return rounded === 0 ? 0 : rounded
}

/**
 * Định dạng số kiểu Việt Nam, luôn đủ số chữ số thập phân.
 * Ví dụ: formatNumber(1234) → '1.234'; formatNumber(1234.5, 1) → '1.234,5'; formatNumber(12, 1) → '12,0'.
 * @param value Số cần định dạng.
 * @param decimals Số chữ số thập phân (mặc định 0).
 * @returns Chuỗi đã định dạng.
 */
export function formatNumber(value: number, decimals = 0): string {
  let formatter = formatters.get(decimals)
  if (!formatter) {
    formatter = new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    formatters.set(decimals, formatter)
  }
  return formatter.format(roundTo(value, decimals))
}

/**
 * Định dạng phần trăm kiểu Việt Nam. Ví dụ: formatPercent(12.345) → '12,3%'.
 * @param value Giá trị phần trăm (12.3 nghĩa là 12,3%).
 * @param decimals Số chữ số thập phân (mặc định 1).
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${formatNumber(value, decimals)}%`
}
