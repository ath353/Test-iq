// Hiển thị đồng hồ đếm ngược; đổi màu cảnh báo khi sắp hết giờ.
import { formatTime } from '../utils/time'
import './Timer.css'

/** Còn ít hơn hoặc bằng số giây này thì đồng hồ chuyển màu cảnh báo. */
const WARNING_SEC = 60

interface TimerProps {
  /** Số giây còn lại. */
  remainingSec: number
}

/**
 * Timer: hiện thời gian còn lại dạng "m:ss". Còn ≤ 60 giây thì chữ chuyển màu đỏ.
 */
function Timer({ remainingSec }: TimerProps) {
  const isWarning = remainingSec <= WARNING_SEC
  return (
    // role="timer" để trình đọc màn hình hiểu đây là đồng hồ (không đọc lại mỗi giây)
    <span
      className={`timer${isWarning ? ' timer--warning' : ''}`}
      role="timer"
      aria-label={`Thời gian còn lại ${formatTime(remainingSec)}`}
    >
      ⏱ {formatTime(remainingSec)}
    </span>
  )
}

export default Timer
