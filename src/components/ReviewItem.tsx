// Một dòng xem lại câu hỏi ở màn hình kết quả: đề, đáp án của người dùng, đáp án đúng, lời giải từng bước.
import type { Option, Question, UserAnswer } from '../types/question'
import { getAnswerStatus, type AnswerStatus } from '../utils/scoring'
import FigureView from './FigureView'
import StimulusView from './StimulusView'
import './ReviewItem.css'

/** Chữ hiển thị cho từng trạng thái. */
const STATUS_LABEL: Record<AnswerStatus, string> = {
  correct: '✓ Đúng',
  wrong: '✗ Sai',
  skipped: '– Bỏ trống',
}

interface ReviewItemProps {
  /** Số thứ tự câu (bắt đầu từ 1). */
  index: number
  question: Question
  /** Câu trả lời của người dùng; undefined nếu không có. */
  answer: UserAnswer | undefined
}

/**
 * ReviewItem: thẻ có thể mở/đóng (dùng thẻ <details> có sẵn của HTML).
 * Câu sai hoặc bỏ trống thì mở sẵn để người dùng xem lời giải ngay.
 */
function ReviewItem({ index, question, answer }: ReviewItemProps) {
  const status = getAnswerStatus(question, answer)
  // Tìm lựa chọn đúng và lựa chọn người dùng đã chọn
  const optionOf = (optionId: string | null | undefined) => question.options.find((o) => o.id === optionId)
  const correctOption = optionOf(question.correctOptionId)
  const selectedOption = optionOf(answer?.selectedOptionId)

  /** Hiển thị một lựa chọn: "B." + hình thu nhỏ (nếu là lựa chọn dạng hình) + nội dung / mô tả. */
  const renderOption = (option: Option) => (
    <strong className="review-item__option">
      {option.id}.
      {option.figure && <FigureView figure={option.figure} size={40} />}
      {option.content}
    </strong>
  )

  return (
    <details className={`review-item review-item--${status}`} open={status !== 'correct'}>
      <summary className="review-item__summary">
        <span className="review-item__index">Câu {index}</span>
        <span className="review-item__prompt">{question.prompt}</span>
        <span className="review-item__status">{STATUS_LABEL[status]}</span>
      </summary>

      <div className="review-item__body">
        {/* Hiện lại dữ kiện (bảng…) và đề đầy đủ khi đề không vừa dòng tiêu đề:
            câu có dữ kiện, hoặc đề nhiều dòng (các tiền đề của câu Logic). Lời giải sẽ tham chiếu tới chúng. */}
        {question.stimulus && <StimulusView stimulus={question.stimulus} />}
        {(question.stimulus || question.prompt.includes('\n')) && (
          <p className="review-item__full-prompt">{question.prompt}</p>
        )}

        <p className="review-item__answers">
          <span>Bạn chọn: {selectedOption ? renderOption(selectedOption) : <em>không chọn</em>}</span>
          <span>Đáp án đúng: {correctOption && renderOption(correctOption)}</span>
        </p>

        {/* Lời giải từng bước, đánh số tự động bằng thẻ <ol> */}
        <p className="review-item__steps-title">Lời giải:</p>
        <ol className="review-item__steps">
          {question.explanationSteps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </details>
  )
}

export default ReviewItem
