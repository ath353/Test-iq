// Thẻ hiển thị một câu hỏi: lời dẫn, dữ kiện, đề bài và danh sách lựa chọn để người dùng bấm chọn.
import { getCategoryLabel } from '../config/testOptions'
import type { Question } from '../types/question'
import FigureView from './FigureView'
import StimulusView from './StimulusView'
import './QuestionCard.css'

/** Lựa chọn dài hơn số ký tự này thì cả nhóm lựa chọn xếp thành danh sách dọc. */
const LONG_OPTION_LENGTH = 20

interface QuestionCardProps {
  question: Question
  /** Mã lựa chọn đang được chọn; null nếu chưa chọn. */
  selectedOptionId: string | null
  /** Gọi khi người dùng bấm vào một lựa chọn. */
  onSelect: (optionId: string) => void
  /** true: hiện nhãn dạng bài ở đầu thẻ (bài thi thử tổng hợp, các dạng đổi liên tục). */
  showCategory?: boolean
}

/**
 * QuestionCard: hiển thị lời dẫn, đề bài và các lựa chọn dạng nút bấm.
 * Số lựa chọn tùy câu (Dãy số có 5, Ngôn ngữ có 3), lưới lựa chọn tự co giãn theo.
 * Bấm lại lựa chọn đang chọn thì vẫn giữ nguyên (không bỏ chọn), giống bài thi thật.
 *
 * Class theo dạng bài (ví dụ question-card--number-series) để mỗi dạng có kiểu chữ đề phù hợp:
 * dãy số chữ to đậm, các dạng có đề dài (logic, số liệu) chữ thường.
 *
 * Thứ tự hiển thị: lời dẫn → dữ kiện (bảng, đoạn văn; nếu có) → đề bài → các lựa chọn.
 */
function QuestionCard({ question, selectedOptionId, onSelect, showCategory = false }: QuestionCardProps) {
  // Cách xếp lựa chọn:
  // - lựa chọn dạng hình (Suy luận hình): lưới ô hình;
  // - có lựa chọn dài (cả câu, ví dụ đáp án Logic): danh sách dọc, mỗi lựa chọn một dòng;
  // - lựa chọn ngắn (con số, tên người): lưới nhiều cột cho gọn.
  const hasFigureOption = question.options.some((o) => o.figure)
  const hasLongOption = !hasFigureOption && question.options.some((o) => o.content.length > LONG_OPTION_LENGTH)
  const layoutClass = hasFigureOption
    ? ' question-card__options--figures'
    : hasLongOption
      ? ' question-card__options--list'
      : ''

  return (
    <section className={`question-card question-card--${question.category}`}>
      {showCategory && <span className="question-card__category">{getCategoryLabel(question.category)}</span>}
      <p className="question-card__instruction">{question.instruction}</p>
      {question.stimulus && <StimulusView stimulus={question.stimulus} />}
      <p className="question-card__prompt">{question.prompt}</p>

      {/* Nhóm lựa chọn dạng radio để trình đọc màn hình hiểu "chỉ chọn một" */}
      <div className={`question-card__options${layoutClass}`} role="radiogroup" aria-label="Các lựa chọn">
        {question.options.map((option) => {
          const isSelected = option.id === selectedOptionId
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`option${isSelected ? ' option--selected' : ''}`}
              onClick={() => onSelect(option.id)}
              // Lựa chọn dạng hình: đọc to bằng mô tả, ví dụ "Lựa chọn B: 2 tam giác tô đặc"
              aria-label={option.figure ? `Lựa chọn ${option.id}: ${option.content}` : undefined}
            >
              <span className="option__label">{option.id}</span>
              {option.figure ? (
                <span className="option__figure">
                  <FigureView figure={option.figure} />
                </span>
              ) : (
                <span className="option__content">{option.content}</span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default QuestionCard
