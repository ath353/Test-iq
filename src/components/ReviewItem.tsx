// Một dòng xem lại câu hỏi ở màn hình kết quả: đề, đáp án của người dùng, đáp án đúng, lời giải từng bước.
import type { Question, UserAnswer } from '../types/question'
import { getAnswerStatus, type AnswerStatus } from '../utils/scoring'
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
  // Tìm nội dung (con số) của đáp án đúng và đáp án người dùng chọn
  const contentOf = (optionId: string | null | undefined) =>
    question.options.find((o) => o.id === optionId)?.content
  const correctContent = contentOf(question.correctOptionId)
  const selectedContent = contentOf(answer?.selectedOptionId)

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

        <p>
          Bạn chọn:{' '}
          {selectedContent === undefined ? (
            <em>không chọn</em>
          ) : (
            <strong>
              {answer?.selectedOptionId}. {selectedContent}
            </strong>
          )}
          {' · '}Đáp án đúng:{' '}
          <strong>
            {question.correctOptionId}. {correctContent}
          </strong>
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
