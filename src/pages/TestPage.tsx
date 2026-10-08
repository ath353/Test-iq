// Màn hình làm bài: hiển thị từng câu, chọn đáp án, chuyển câu, đếm ngược thời gian và nộp bài.
// Chấm điểm (bước 1.4) sẽ được thêm sau.
import { useState } from 'react'
import QuestionCard from '../components/QuestionCard'
import QuestionNavigator from '../components/QuestionNavigator'
import Timer from '../components/Timer'
import { useCountdown } from '../hooks/useCountdown'
import type { Question, UserAnswer } from '../types/question'
import './TestPage.css'

interface TestPageProps {
  questions: Question[]
  /** Tổng thời gian làm bài (giây). Hết giờ thì tự nộp bài. */
  timeLimitSec: number
  /**
   * Gọi khi nộp bài (người dùng bấm nộp hoặc hết giờ).
   * @param answers Câu trả lời cho mọi câu (câu bỏ trống có selectedOptionId = null).
   * @param durationSec Thời gian thực tế đã dùng (giây).
   * @param timedOut true nếu nộp do hết giờ.
   */
  onSubmit: (answers: UserAnswer[], durationSec: number, timedOut: boolean) => void
}

/**
 * TestPage: quản lý trạng thái bài làm (câu đang xem, đáp án đã chọn, thời gian còn lại).
 */
function TestPage({ questions, timeLimitSec, onSubmit }: TestPageProps) {
  // Vị trí câu đang xem, bắt đầu từ 0
  const [currentIndex, setCurrentIndex] = useState(0)
  // Đáp án đã chọn, dạng { mã câu hỏi: mã lựa chọn }. Câu chưa chọn thì không có trong object.
  const [selected, setSelected] = useState<Record<string, string>>({})

  const question = questions[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === questions.length - 1
  const answeredCount = Object.keys(selected).length

  /** Ghi nhận lựa chọn cho câu đang xem. */
  function handleSelect(optionId: string) {
    setSelected((prev) => ({ ...prev, [question.id]: optionId }))
  }

  // Đồng hồ: hết giờ thì nộp bài ngay, không hỏi xác nhận
  const { remainingSec, getElapsedSec } = useCountdown(timeLimitSec, () => submit(true))

  /**
   * Gửi bài làm: chuyển đáp án sang dạng UserAnswer[] kèm thời gian đã dùng.
   * @param timedOut true nếu nộp do hết giờ.
   */
  function submit(timedOut: boolean) {
    const answers = questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: selected[q.id] ?? null,
    }))
    onSubmit(answers, timedOut ? timeLimitSec : getElapsedSec(), timedOut)
  }

  /** Người dùng bấm nộp: hỏi xác nhận nếu còn câu bỏ trống. */
  function handleSubmit() {
    const unanswered = questions.length - answeredCount
    if (unanswered > 0 && !window.confirm(`Bạn còn ${unanswered} câu chưa trả lời. Vẫn nộp bài?`)) return
    submit(false)
  }

  return (
    <div className="test-page">
      {/* Dòng trạng thái: câu đang xem, số câu đã trả lời, thời gian còn lại */}
      <header className="test-page__header">
        <span>
          Câu <strong>{currentIndex + 1}</strong> / {questions.length}
        </span>
        <span className="test-page__answered">
          Đã trả lời: {answeredCount} / {questions.length}
        </span>
        <Timer remainingSec={remainingSec} />
      </header>

      {/* Thanh tiến độ: tỉ lệ số câu đã trả lời */}
      <div
        className="test-page__progress"
        role="progressbar"
        aria-label="Tiến độ trả lời"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={answeredCount}
      >
        <div
          className="test-page__progress-bar"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      <QuestionCard
        question={question}
        selectedOptionId={selected[question.id] ?? null}
        onSelect={handleSelect}
      />

      {/* Nút điều hướng: câu trước / câu sau; ở câu cuối, nút "Câu sau" đổi thành "Nộp bài" */}
      <div className="test-page__actions">
        <button
          type="button"
          className="button"
          disabled={isFirst}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          ← Câu trước
        </button>
        {isLast ? (
          <button type="button" className="button button--primary" onClick={handleSubmit}>
            Nộp bài
          </button>
        ) : (
          <button
            type="button"
            className="button button--primary"
            onClick={() => setCurrentIndex((i) => i + 1)}
          >
            Câu sau →
          </button>
        )}
      </div>

      <QuestionNavigator
        total={questions.length}
        currentIndex={currentIndex}
        isAnswered={(i) => questions[i].id in selected}
        onJump={setCurrentIndex}
      />

      {/* Cho phép nộp sớm khi đang ở câu bất kỳ (ở câu cuối đã có nút "Nộp bài" phía trên) */}
      {!isLast && (
        <button type="button" className="button test-page__submit-early" onClick={handleSubmit}>
          Nộp bài sớm
        </button>
      )}
    </div>
  )
}

export default TestPage
