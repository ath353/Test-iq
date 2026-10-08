// Component gốc của ứng dụng.
// TẠM THỜI (bước 1.2): vào thẳng màn hình làm bài 10 câu dãy số, nộp bài thì hiện số câu đã trả lời.
// Trang chủ (bước 1.5) và màn hình kết quả có chấm điểm (bước 1.4) sẽ thay thế phần tạm này.
import { useState } from 'react'
import { generateNumberSeriesQuestions } from './generators/numberSeries'
import TestPage from './pages/TestPage'
import type { Question, UserAnswer } from './types/question'

/** Số câu của bài làm tạm thời. */
const QUESTION_COUNT = 10

/**
 * App: khung ngoài cùng của trang web, quyết định đang hiển thị màn hình nào.
 */
function App() {
  // Sinh đề một lần khi mở trang (truyền hàm vào useState để không sinh lại mỗi lần vẽ lại giao diện)
  const [questions, setQuestions] = useState<Question[]>(() => generateNumberSeriesQuestions(QUESTION_COUNT))
  // Câu trả lời sau khi nộp; null nghĩa là đang làm bài
  const [answers, setAnswers] = useState<UserAnswer[] | null>(null)
  // Số thứ tự lượt làm bài, tăng mỗi lần làm lại
  const [attempt, setAttempt] = useState(1)

  /** Làm bài mới: sinh đề mới, xóa câu trả lời cũ, tăng lượt làm bài. */
  function handleRestart() {
    setQuestions(generateNumberSeriesQuestions(QUESTION_COUNT))
    setAnswers(null)
    setAttempt((n) => n + 1)
  }

  return (
    <main className="app">
      <h1>Luyện Test IQ</h1>
      <p className="app__subtitle">Dạng bài: Dãy số</p>

      {answers === null ? (
        // key đổi theo lượt làm bài, để TestPage được tạo mới hoàn toàn (về câu 1, xóa đáp án cũ)
        <TestPage key={attempt} questions={questions} onSubmit={setAnswers} />
      ) : (
        // Màn hình tạm sau khi nộp bài, sẽ được thay bằng màn hình kết quả ở bước 1.4
        <section>
          <p>
            Đã nộp bài. Bạn trả lời {answers.filter((a) => a.selectedOptionId !== null).length} /{' '}
            {answers.length} câu.
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
