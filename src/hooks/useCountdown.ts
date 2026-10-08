// Hook đồng hồ đếm ngược cho bài làm.
import { useEffect, useRef, useState } from 'react'
import { getRemainingSec } from '../utils/time'

/** Chu kỳ cập nhật đồng hồ (mili giây). Nhỏ hơn 1 giây để số giây đổi đúng lúc. */
const TICK_MS = 250

/**
 * useCountdown: đếm ngược từ totalSec về 0, hết giờ thì gọi onExpire đúng một lần.
 *
 * Cách hoạt động: ghi lại THỜI ĐIỂM KẾT THÚC ngay khi bắt đầu, mỗi lần cập nhật thì lấy
 * thời điểm kết thúc trừ thời gian hiện tại. Nhờ vậy đồng hồ không bị chạy chậm khi người dùng
 * chuyển sang tab khác (trình duyệt làm chậm setInterval ở tab ẩn).
 *
 * @param totalSec Tổng thời gian (giây).
 * @param onExpire Hàm gọi khi hết giờ.
 * @returns remainingSec: số giây còn lại; getElapsedSec: hàm lấy số giây đã dùng tính đến lúc gọi.
 */
export function useCountdown(totalSec: number, onExpire: () => void) {
  // Thời điểm kết thúc, chỉ tính một lần khi component được tạo
  const [endAt] = useState(() => Date.now() + totalSec * 1000)
  const [remainingSec, setRemainingSec] = useState(totalSec)

  // Luôn giữ phiên bản onExpire mới nhất, để khi hết giờ dùng đúng dữ liệu hiện tại (đáp án đã chọn…)
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  })

  useEffect(() => {
    // Cờ đảm bảo onExpire chỉ được gọi một lần
    let expired = false
    const timer = setInterval(() => {
      const remaining = getRemainingSec(endAt, Date.now())
      setRemainingSec(remaining)
      if (remaining === 0 && !expired) {
        expired = true
        clearInterval(timer)
        onExpireRef.current()
      }
    }, TICK_MS)
    // Dọn đồng hồ khi rời màn hình làm bài (nộp bài sớm…)
    return () => clearInterval(timer)
  }, [endAt])

  /** Số giây đã dùng, tính theo thời gian thực (không vượt quá tổng thời gian). */
  function getElapsedSec(): number {
    return totalSec - getRemainingSec(endAt, Date.now())
  }

  return { remainingSec, getElapsedSec }
}
