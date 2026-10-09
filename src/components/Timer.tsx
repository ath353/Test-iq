// Hiển thị đồng hồ làm bài: đếm ngược (có giới hạn) hoặc đếm xuôi (không giới hạn).
import { formatTime } from '../utils/time'
import './Timer.css'

/** Còn ít hơn hoặc bằng số giây này thì đồng hồ chuyển màu cảnh báo. */
const WARNING_SEC = 60

interface TimerProps {
  /** Số giây còn lại; null nghĩa là không giới hạn thời gian. */
  remainingSec: number | null
  /** Số giây đã làm, hiển thị khi không giới hạn thời gian. */
  elapsedSec: number
}

/**
 * Timer:
 * - Có giới hạn: hiện thời gian còn lại "⏱ m:ss", còn ≤ 60 giây thì chữ chuyển màu đỏ.
 * - Không giới hạn: hiện thời gian đã làm "⏱ Đã làm m:ss".
 */
function Timer({ remainingSec, elapsedSec }: TimerProps) {
  if (remainingSec === null) {
    return (
      <span className="timer" role="timer" aria-label={`Đã làm ${formatTime(elapsedSec)}`}>
        ⏱ Đã làm {formatTime(elapsedSec)}
      </span>
    )
  }

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
