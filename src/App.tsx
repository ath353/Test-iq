// Component gốc của ứng dụng.
// TẠM THỜI (bước 1.2–1.3): vào thẳng màn hình làm bài 10 câu dãy số, nộp bài thì hiện thông tin tóm tắt.
// Trang chủ (bước 1.5) và màn hình kết quả có chấm điểm (bước 1.4) sẽ thay thế phần tạm này.
import { useState } from 'react'
import { generateNumberSeriesQuestions } from './generators/numberSeries'
import TestPage from './pages/TestPage'
import type { Question, UserAnswer } from './types/question'
import { formatTime } from './utils/time'

/** Số câu của bài làm tạm thời. */
const QUESTION_COUNT = 10
/** Thời gian cho mỗi câu (giây). Bài SHL dạng số thường khoảng 45–60 giây một câu. */
const SECONDS_PER_QUESTION = 45

/** Thông tin bài đã nộp (tạm thời, bước 1.4 sẽ dùng TestResult). */
interface Submission {
  answers: UserAnswer[]
  durationSec: number
  timedOut: boolean
}

/**
 * App: khung ngoài cùng của trang web, quyết định đang hiển thị màn hình nào.
 */
function App() {
  // Sinh đề một lần khi mở trang (truyền hàm vào useState để không sinh lại mỗi lần vẽ lại giao diện)
  const [questions, setQuestions] = useState<Question[]>(() => generateNumberSeriesQuestions(QUESTION_COUNT))
  // Bài đã nộp; null nghĩa là đang làm bài
  const [submission, setSubmission] = useState<Submission | null>(null)
  // Số thứ tự lượt làm bài, tăng mỗi lần làm lại
  const [attempt, setAttempt] = useState(1)

  /** Làm bài mới: sinh đề mới, xóa bài đã nộp, tăng lượt làm bài. */
  function handleRestart() {
    setQuestions(generateNumberSeriesQuestions(QUESTION_COUNT))
    setSubmission(null)
    setAttempt((n) => n + 1)
  }

  return (
    <main className="app">
      <h1>Luyện Test IQ</h1>
      <p className="app__subtitle">Dạng bài: Dãy số</p>

      {submission === null ? (
        // key đổi theo lượt làm bài, để TestPage được tạo mới hoàn toàn (về câu 1, xóa đáp án cũ, đồng hồ chạy lại)
        <TestPage
          key={attempt}
          questions={questions}
          timeLimitSec={QUESTION_COUNT * SECONDS_PER_QUESTION}
          onSubmit={(answers, durationSec, timedOut) => setSubmission({ answers, durationSec, timedOut })}
        />
      ) : (
        // Màn hình tạm sau khi nộp bài, sẽ được thay bằng màn hình kết quả ở bước 1.4
        <section>
          {submission.timedOut && <p><strong>Hết giờ!</strong> Bài đã được tự động nộp.</p>}
          <p>
            Bạn trả lời {submission.answers.filter((a) => a.selectedOptionId !== null).length} /{' '}
            {submission.answers.length} câu trong {formatTime(submission.durationSec)}.
          </p>
          <p className="app__subtitle">(Chấm điểm và lời giải sẽ có ở bước 1.4)</p>
          <button type="button" className="button button--primary" onClick={handleRestart}>
            Làm bài mới
          </button>
        </section>
      )}
    </main>
  )
}

export default App
