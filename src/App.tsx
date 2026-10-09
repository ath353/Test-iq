// Component gốc của ứng dụng: điều hướng giữa 3 màn hình Trang chủ → Làm bài → Kết quả.
import { useState } from 'react'
import { getCategoryLabel } from './config/testOptions'
import { generateQuestions } from './generators'
import HomePage from './pages/HomePage'
import ResultPage from './pages/ResultPage'
import TestPage from './pages/TestPage'
import type { Question, TestConfig, TestResult } from './types/question'
import { gradeTest } from './utils/scoring'

/**
 * Màn hình đang hiển thị. Mỗi màn hình mang theo dữ liệu nó cần,
 * nên không thể rơi vào trạng thái sai (ví dụ ở màn Kết quả mà không có kết quả).
 */
type Screen =
  | { name: 'home' }
  | { name: 'test'; config: TestConfig; questions: Question[]; attempt: number }
  | { name: 'result'; result: TestResult }

/**
 * App: giữ màn hình hiện tại và cấu hình lần làm gần nhất.
 */
function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  // Cấu hình lần làm gần nhất: dùng để "Làm bài mới" cùng cấu hình và giữ lựa chọn ở trang chủ
  const [lastConfig, setLastConfig] = useState<TestConfig | null>(null)
  // Đếm số lượt làm bài, dùng làm key để màn Làm bài luôn được tạo mới hoàn toàn
  const [attemptCount, setAttemptCount] = useState(0)

  /** Bắt đầu bài mới với cấu hình cho trước: sinh đề rồi chuyển sang màn Làm bài. */
  function startTest(config: TestConfig) {
    const attempt = attemptCount + 1
    setAttemptCount(attempt)
    setLastConfig(config)
    setScreen({ name: 'test', config, questions: generateQuestions(config), attempt })
    window.scrollTo(0, 0)
  }

  /** Về trang chủ. */
  function goHome() {
    setScreen({ name: 'home' })
    window.scrollTo(0, 0)
  }

  return (
    <main className="app">
      <h1>Luyện Test IQ</h1>

      {screen.name === 'home' && (
        <>
          <p className="app__subtitle">Luyện các dạng bài test năng lực khi tuyển dụng.</p>
          <HomePage initialConfig={lastConfig} onStart={startTest} />
        </>
      )}

      {screen.name === 'test' && (
        <>
          <p className="app__subtitle">Dạng bài: {getCategoryLabel(screen.config.category)}</p>
          <TestPage
            key={screen.attempt}
            questions={screen.questions}
            timeLimitSec={screen.config.timeLimitSec}
            onSubmit={(answers, durationSec, timedOut) => {
              // Chấm điểm ngay khi nộp, rồi chuyển sang màn hình kết quả
              setScreen({
                name: 'result',
                result: gradeTest(screen.config, screen.questions, answers, durationSec, timedOut),
              })
              window.scrollTo(0, 0)
            }}
          />
        </>
      )}

      {screen.name === 'result' && (
        <>
          <p className="app__subtitle">Dạng bài: {getCategoryLabel(screen.result.config.category)}</p>
          <ResultPage
            result={screen.result}
            onRestart={() => startTest(screen.result.config)}
            onHome={goHome}
          />
        </>
      )}
    </main>
  )
}

export default App
