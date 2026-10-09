// Hook đồng hồ cho bài làm: đếm ngược khi có giới hạn thời gian, đếm xuôi khi không giới hạn.
import { useEffect, useRef, useState } from 'react'
import { getRemainingSec } from '../utils/time'

/** Chu kỳ cập nhật đồng hồ (mili giây). Nhỏ hơn 1 giây để số giây đổi đúng lúc. */
const TICK_MS = 250

/**
 * useTestTimer: theo dõi thời gian làm bài.
 *
 * Cách hoạt động: mọi phép tính đều so THỜI ĐIỂM BẮT ĐẦU với giờ hiện tại.
 * Nhờ vậy đồng hồ không bị chạy chậm khi người dùng chuyển sang tab khác
 * (trình duyệt làm chậm setInterval ở tab ẩn), và khi khôi phục bài đang làm (tải lại trang),
 * thời gian vẫn tính đúng từ lúc bắt đầu, kể cả khoảng thời gian tab bị đóng.
 * Nếu đã quá giờ ngay lúc khôi phục thì lần cập nhật đầu tiên sẽ gọi onExpire (tự nộp bài).
 *
 * @param totalSec Tổng thời gian (giây); null nghĩa là không giới hạn (không bao giờ hết giờ).
 * @param startAt Thời điểm bắt đầu làm bài (mili giây, dạng Date.now()).
 * @param onExpire Hàm gọi đúng một lần khi hết giờ (không dùng khi totalSec = null).
 * @returns
 *   - remainingSec: số giây còn lại; null nếu không giới hạn.
 *   - elapsedSec: số giây đã làm (dùng để hiển thị khi không giới hạn).
 *   - getElapsedSec: hàm lấy số giây đã dùng chính xác tại thời điểm gọi (dùng khi nộp bài).
 */
export function useTestTimer(totalSec: number | null, startAt: number, onExpire: () => void) {
  // Giờ hiện tại, cập nhật mỗi TICK_MS để giao diện vẽ lại
  const [now, setNow] = useState(() => Date.now())

  // Luôn giữ phiên bản onExpire mới nhất, để khi hết giờ dùng đúng dữ liệu hiện tại (đáp án đã chọn…)
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  })

  useEffect(() => {
    // Cờ đảm bảo onExpire chỉ được gọi một lần
    let expired = false
    const endAt = totalSec === null ? null : startAt + totalSec * 1000

    const timer = setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (endAt !== null && !expired && getRemainingSec(endAt, current) === 0) {
        expired = true
        clearInterval(timer)
        onExpireRef.current()
      }
    }, TICK_MS)
    // Dọn đồng hồ khi rời màn hình làm bài (nộp bài sớm…)
    return () => clearInterval(timer)
  }, [startAt, totalSec])

  /** Số giây đã dùng tính đến lúc gọi; không vượt quá tổng thời gian nếu có giới hạn. */
  function getElapsedSec(): number {
    const elapsed = Math.floor((Date.now() - startAt) / 1000)
    return totalSec === null ? elapsed : Math.min(elapsed, totalSec)
  }

  const elapsedSec = Math.floor((now - startAt) / 1000)
  const remainingSec = totalSec === null ? null : getRemainingSec(startAt + totalSec * 1000, now)

  return { remainingSec, elapsedSec, getElapsedSec }
}
