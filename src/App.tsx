// Component gốc của ứng dụng: chuyển giữa màn hình Làm bài và màn hình Kết quả.
// TẠM THỜI (đến bước 1.5): vào thẳng bài 10 câu dãy số với cấu hình cố định.
// Trang chủ ở bước 1.5 sẽ cho người dùng tự chọn cấu hình.
import { useState } from 'react'
import { generateNumberSeriesQuestions } from './generators/numberSeries'
import ResultPage from './pages/ResultPage'
import TestPage from './pages/TestPage'
import type { Question, TestConfig, TestResult } from './types/question'
import { gradeTest } from './utils/scoring'

/** Số câu của bài làm tạm thời. */
const QUESTION_COUNT = 10
/** Thời gian cho mỗi câu (giây). Bài SHL dạng số thường khoảng 45–60 giây một câu. */
const SECONDS_PER_QUESTION = 45

/** Cấu hình bài làm tạm thời, bước 1.5 sẽ thay bằng lựa chọn của người dùng. */
const CONFIG: TestConfig = {
  category: 'number-series',
  questionCount: QUESTION_COUNT,
  timeLimitSec: QUESTION_COUNT * SECONDS_PER_QUESTION,
}

/**
 * App: khung ngoài cùng của trang web, quyết định đang hiển thị màn hình nào.
 */
function App() {
  // Sinh đề một lần khi mở trang (truyền hàm vào useState để không sinh lại mỗi lần vẽ lại giao diện)
  const [questions, setQuestions] = useState<Question[]>(() =>
    generateNumberSeriesQuestions(CONFIG.questionCount),
  )
  // Kết quả sau khi nộp; null nghĩa là đang làm bài
  const [result, setResult] = useState<TestResult | null>(null)
  // Số thứ tự lượt làm bài, tăng mỗi lần làm lại
  const [attempt, setAttempt] = useState(1)

  /** Làm bài mới: sinh đề mới, xóa kết quả cũ, tăng lượt làm bài. */
  function handleRestart() {
    setQuestions(generateNumberSeriesQuestions(CONFIG.questionCount))
    setResult(null)
    setAttempt((n) => n + 1)
    window.scrollTo(0, 0)
  }

  return (
    <main className="app">
      <h1>Luyện Test IQ</h1>
      <p className="app__subtitle">Dạng bài: Dãy số</p>

      {result === null ? (
        // key đổi theo lượt làm bài, để TestPage được tạo mới hoàn toàn (về câu 1, xóa đáp án cũ, đồng hồ chạy lại)
        <TestPage
          key={attempt}
          questions={questions}
          timeLimitSec={CONFIG.timeLimitSec}
          onSubmit={(answers, durationSec, timedOut) => {
            // Chấm điểm ngay khi nộp, rồi chuyển sang màn hình kết quả
            setResult(gradeTest(CONFIG, questions, answers, durationSec, timedOut))
            window.scrollTo(0, 0)
          }}
        />
      ) : (
        <ResultPage result={result} onRestart={handleRestart} />
      )}
    </main>
  )
}

export default App
