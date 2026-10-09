// Các hàm xử lý thời gian dùng cho đồng hồ làm bài.

/**
 * Định dạng số giây thành chuỗi "phút:giây", luôn đủ 2 chữ số giây.
 * Ví dụ: 75 → "1:15", 600 → "10:00", 5 → "0:05". Số âm được coi là 0.
 * @param totalSec Số giây.
 * @returns Chuỗi dạng "m:ss".
 */
export function formatTime(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec))
  const minutes = Math.floor(sec / 60)
  const seconds = sec % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Tính số giây còn lại đến thời điểm kết thúc, làm tròn lên và không âm.
 * Làm tròn lên để đồng hồ hiện "0:01" cho đến khi thật sự hết giờ, rồi mới về "0:00".
 * @param endAt Thời điểm kết thúc (mili giây, dạng Date.now()).
 * @param now Thời điểm hiện tại (mili giây).
 * @returns Số giây còn lại.
 */
export function getRemainingSec(endAt: number, now: number): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000))
}

/**
 * Định dạng thời điểm (chuỗi ISO) thành ngày giờ kiểu Việt Nam: "dd/mm/yyyy hh:mm" (giờ 24h).
 * Ví dụ: '2026-10-09T08:05:00Z' (giờ Việt Nam) → '09/10/2026 15:05'.
 * @param iso Thời điểm dạng chuỗi ISO (như TestResult.finishedAt).
 * @param timeZone Múi giờ; bỏ trống thì dùng múi giờ của máy (truyền vào để test cho cố định).
 * @returns Chuỗi ngày giờ, hoặc '' nếu chuỗi đầu vào không hợp lệ.
 */
export function formatDateTime(iso: string, timeZone?: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  // Lấy từng phần (ngày, tháng, năm, giờ, phút) rồi tự ghép, để thứ tự luôn là "ngày giờ"
  const parts = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`
}
