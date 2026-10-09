// Màn hình làm bài: hiển thị từng câu, chọn đáp án, chuyển câu, theo dõi thời gian, nộp bài hoặc thoát bài.
import { useEffect, useRef, useState } from 'react'
import QuestionCard from '../components/QuestionCard'
import QuestionNavigator from '../components/QuestionNavigator'
import Timer from '../components/Timer'
import { useTestTimer } from '../hooks/useTestTimer'
import type { Question, UserAnswer } from '../types/question'
import './TestPage.css'

interface TestPageProps {
  questions: Question[]
  /** Tổng thời gian làm bài (giây), hết giờ thì tự nộp bài; null nghĩa là không giới hạn. */
  timeLimitSec: number | null
  /** Thời điểm bắt đầu làm bài (mili giây). Bài khôi phục sau khi tải lại trang thì là thời điểm cũ. */
  startAt: number
  /** Đáp án đã chọn lúc bắt đầu (bài khôi phục thì có sẵn; bài mới thì rỗng). */
  initialSelected: Record<string, string>
  /** Câu đang xem lúc bắt đầu (bài khôi phục thì là câu đang xem dở). */
  initialIndex: number
  /** Gọi mỗi khi chọn đáp án hoặc chuyển câu, để nơi gọi lưu lại tiến độ. */
  onProgress: (selected: Record<string, string>, currentIndex: number) => void
  /**
   * Gọi khi nộp bài (người dùng bấm nộp hoặc hết giờ).
   * @param answers Câu trả lời cho mọi câu (câu bỏ trống có selectedOptionId = null).
   * @param durationSec Thời gian thực tế đã dùng (giây).
   * @param timedOut true nếu nộp do hết giờ.
   */
  onSubmit: (answers: UserAnswer[], durationSec: number, timedOut: boolean) => void
  /** Gọi khi người dùng xác nhận thoát bài (bỏ bài, không chấm điểm). */
  onQuit: () => void
}

/**
 * TestPage: quản lý trạng thái bài làm (câu đang xem, đáp án đã chọn, thời gian còn lại).
 */
function TestPage({
  questions,
  timeLimitSec,
  startAt,
  initialSelected,
  initialIndex,
  onProgress,
  onSubmit,
  onQuit,
}: TestPageProps) {
  // Vị trí câu đang xem, bắt đầu từ 0
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  // Đáp án đã chọn, dạng { mã câu hỏi: mã lựa chọn }. Câu chưa chọn thì không có trong object.
  const [selected, setSelected] = useState<Record<string, string>>(initialSelected)

  // Báo tiến độ mỗi khi đáp án / câu đang xem thay đổi, để lưu lại phòng khi tải lại trang.
  // Dùng ref để luôn gọi phiên bản onProgress mới nhất mà không phải chạy lại effect khi hàm đổi.
  const onProgressRef = useRef(onProgress)
  useEffect(() => {
    onProgressRef.current = onProgress
  })
  useEffect(() => {
    onProgressRef.current(selected, currentIndex)
  }, [selected, currentIndex])

  const question = questions[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === questions.length - 1
  const answeredCount = Object.keys(selected).length

  /** Ghi nhận lựa chọn cho câu đang xem. */
  function handleSelect(optionId: string) {
    setSelected((prev) => ({ ...prev, [question.id]: optionId }))
  }

  // Đồng hồ: hết giờ thì nộp bài ngay, không hỏi xác nhận
  const { remainingSec, elapsedSec, getElapsedSec } = useTestTimer(timeLimitSec, startAt, () => submit(true))

  /**
   * Gửi bài làm: chuyển đáp án sang dạng UserAnswer[] kèm thời gian đã dùng.
   * @param timedOut true nếu nộp do hết giờ.
   */
  function submit(timedOut: boolean) {
    const answers = questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: selected[q.id] ?? null,
    }))
    // getElapsedSec đã tự giới hạn không vượt quá tổng thời gian
    onSubmit(answers, getElapsedSec(), timedOut)
  }

  /** Người dùng bấm nộp: hỏi xác nhận nếu còn câu bỏ trống. */
  function handleSubmit() {
    const unanswered = questions.length - answeredCount
    if (unanswered > 0 && !window.confirm(`Bạn còn ${unanswered} câu chưa trả lời. Vẫn nộp bài?`)) return
    submit(false)
  }

  /** Thoát bài: hỏi xác nhận vì bài sẽ bị bỏ, không được chấm điểm. */
  function handleQuit() {
    if (window.confirm('Thoát bài? Bài đang làm sẽ bị bỏ và không được chấm điểm.')) onQuit()
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
        <Timer remainingSec={remainingSec} elapsedSec={elapsedSec} />
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

      {/* Nút phụ: nộp sớm (ở câu cuối đã có nút "Nộp bài" phía trên) và thoát bài */}
      <div className="test-page__secondary">
        {!isLast && (
          <button type="button" className="button" onClick={handleSubmit}>
            Nộp bài sớm
          </button>
        )}
        <button type="button" className="button test-page__quit" onClick={handleQuit}>
          Thoát bài
        </button>
      </div>
    </div>
  )
}

export default TestPage
