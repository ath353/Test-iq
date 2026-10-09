// Thẻ hiển thị một câu hỏi: lời dẫn, dữ kiện, đề bài và danh sách lựa chọn để người dùng bấm chọn.
import type { Question } from '../types/question'
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
function QuestionCard({ question, selectedOptionId, onSelect }: QuestionCardProps) {
  // Có lựa chọn dài (cả câu, ví dụ đáp án Logic) thì xếp thành danh sách dọc, mỗi lựa chọn một dòng;
  // lựa chọn ngắn (con số, tên người) thì xếp dạng lưới nhiều cột cho gọn
  const hasLongOption = question.options.some((o) => o.content.length > LONG_OPTION_LENGTH)

  return (
    <section className={`question-card question-card--${question.category}`}>
      <p className="question-card__instruction">{question.instruction}</p>
      {question.stimulus && <StimulusView stimulus={question.stimulus} />}
      <p className="question-card__prompt">{question.prompt}</p>

      {/* Nhóm lựa chọn dạng radio để trình đọc màn hình hiểu "chỉ chọn một" */}
      <div
        className={`question-card__options${hasLongOption ? ' question-card__options--list' : ''}`}
        role="radiogroup"
        aria-label="Các lựa chọn"
      >
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
            >
              <span className="option__label">{option.id}</span>
              <span className="option__content">{option.content}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default QuestionCard
