// Bảng số thứ tự câu hỏi: cho biết câu nào đã trả lời và cho phép nhảy nhanh tới câu bất kỳ.
import './QuestionNavigator.css'

interface QuestionNavigatorProps {
  /** Tổng số câu. */
  total: number
  /** Vị trí câu đang xem (bắt đầu từ 0). */
  currentIndex: number
  /** Hàm kiểm tra câu thứ i đã được trả lời chưa. */
  isAnswered: (index: number) => boolean
  /** Gọi khi người dùng bấm vào một số thứ tự. */
  onJump: (index: number) => void
}

/**
 * QuestionNavigator: dãy nút 1, 2, 3… Câu đã trả lời tô màu, câu đang xem có viền đậm.
 */
function QuestionNavigator({ total, currentIndex, isAnswered, onJump }: QuestionNavigatorProps) {
  return (
    <nav className="navigator" aria-label="Danh sách câu hỏi">
      {Array.from({ length: total }, (_, i) => {
        const classes = ['navigator__item']
        if (isAnswered(i)) classes.push('navigator__item--answered')
        if (i === currentIndex) classes.push('navigator__item--current')
        return (
          <button
            key={i}
            type="button"
            className={classes.join(' ')}
            aria-current={i === currentIndex ? 'step' : undefined}
            aria-label={`Câu ${i + 1}${isAnswered(i) ? ', đã trả lời' : ''}`}
            onClick={() => onJump(i)}
          >
            {i + 1}
          </button>
        )
      })}
    </nav>
  )
}

export default QuestionNavigator
