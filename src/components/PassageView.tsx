// Hiển thị dữ kiện dạng đoạn văn (dạng Ngôn ngữ): tên đoạn văn và nội dung.
import type { PassageStimulus } from '../types/question'
import './PassageView.css'

interface PassageViewProps {
  passage: PassageStimulus
}

/**
 * PassageView: khung đoạn văn có viền trái nổi bật, chữ dễ đọc (dòng thưa, giữ chỗ xuống dòng).
 * Dùng thẻ <article> vì đoạn văn là một khối nội dung độc lập.
 */
function PassageView({ passage }: PassageViewProps) {
  return (
    <article className="passage-view" aria-label={`Đoạn văn: ${passage.title}`}>
      <p className="passage-view__title">{passage.title}</p>
      <p className="passage-view__text">{passage.text}</p>
    </article>
  )
}

export default PassageView
