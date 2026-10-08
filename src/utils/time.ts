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
