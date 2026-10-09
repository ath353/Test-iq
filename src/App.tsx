// Component gốc của ứng dụng: điều hướng giữa các màn hình Trang chủ → Làm bài → Kết quả, Lịch sử, Thống kê;
// lưu / khôi phục bài đang làm để tải lại trang (F5) không mất bài, và lưu kết quả vào lịch sử.
import { useState } from 'react'
import { getCategoryLabel } from './config/testOptions'
import { generateQuestions } from './generators'
import HistoryPage from './pages/HistoryPage'
import HomePage from './pages/HomePage'
import StatsPage from './pages/StatsPage'
import ResultPage from './pages/ResultPage'
import TestPage from './pages/TestPage'
import type { QuestionCategory, TestConfig, TestResult } from './types/question'
import { type ActiveTest, clearActiveTest, loadActiveTest, saveActiveTest } from './utils/activeTest'
import { addToHistory, clearHistory, type HistoryEntry, loadHistory } from './utils/history'
import { gradeTest } from './utils/scoring'

/**
 * Màn hình đang hiển thị. Mỗi màn hình mang theo dữ liệu nó cần,
 * nên không thể rơi vào trạng thái sai (ví dụ ở màn Kết quả mà không có kết quả).
 * Màn Làm bài mang theo toàn bộ bài đang làm (ActiveTest) để lưu lại được bất cứ lúc nào.
 */
type Screen =
  | { name: 'home' }
  | { name: 'test'; test: ActiveTest; attempt: number }
  // fromHistory: mở từ trang lịch sử (hiện nút quay lại lịch sử)
  | { name: 'result'; result: TestResult; fromHistory?: boolean }
  | { name: 'history'; entries: HistoryEntry[] }
  | { name: 'stats'; entries: HistoryEntry[] }

/**
 * Màn hình lúc mở web: nếu còn bài đang làm dở (đã lưu trước khi tải lại trang) thì vào thẳng bài đó.
 */
function initialScreen(): Screen {
  const saved = loadActiveTest()
  return saved ? { name: 'test', test: saved, attempt: 0 } : { name: 'home' }
}

/**
 * App: giữ màn hình hiện tại và cấu hình lần làm gần nhất.
 */
function App() {
  const [screen, setScreen] = useState<Screen>(initialScreen)
  // Cấu hình lần làm gần nhất: dùng để "Làm bài mới" cùng cấu hình và giữ lựa chọn ở trang chủ
  const [lastConfig, setLastConfig] = useState<TestConfig | null>(() =>
    screen.name === 'test' ? screen.test.config : null,
  )
  // Đếm số lượt làm bài, dùng làm key để màn Làm bài luôn được tạo mới hoàn toàn
  const [attemptCount, setAttemptCount] = useState(0)
  // Số bài đã hoàn thành (đọc từ lịch sử đã lưu), hiển thị ở trang chủ
  const [historyCount, setHistoryCount] = useState(() => loadHistory().length)
  // Dạng bài chọn sẵn ở trang chủ (từ nút "Luyện dạng này" ở trang thống kê); null là không chọn sẵn
  const [preferredCategory, setPreferredCategory] = useState<QuestionCategory | null>(null)

  /** Bắt đầu bài mới với cấu hình cho trước: sinh đề, lưu lại, rồi chuyển sang màn Làm bài. */
  function startTest(config: TestConfig) {
    const attempt = attemptCount + 1
    const test: ActiveTest = {
      config,
      questions: generateQuestions(config),
      startAt: Date.now(),
      selected: {},
      currentIndex: 0,
    }
    saveActiveTest(test)
    setPreferredCategory(null)
    setAttemptCount(attempt)
    setLastConfig(config)
    setScreen({ name: 'test', test, attempt })
    window.scrollTo(0, 0)
  }

  /** Về trang chủ. */
  function goHome() {
    setScreen({ name: 'home' })
    window.scrollTo(0, 0)
  }

  /** Mở trang thống kê (đọc lại lịch sử từ bộ nhớ để luôn mới nhất). */
  function openStats() {
    setScreen({ name: 'stats', entries: loadHistory() })
    window.scrollTo(0, 0)
  }

  /** Mở trang lịch sử (đọc lại từ bộ nhớ để luôn mới nhất). */
  function openHistory() {
    setScreen({ name: 'history', entries: loadHistory() })
    window.scrollTo(0, 0)
  }

  return (
    <main className="app">
      <h1>Luyện Test IQ</h1>

      {screen.name === 'home' && (
        <>
          <div className="app__intro">
            <p className="app__subtitle">
              Luyện các dạng bài test năng lực khi tuyển dụng.
              {historyCount > 0 && ` Bạn đã hoàn thành ${historyCount} bài.`}
            </p>
            {historyCount > 0 && (
              <div className="app__intro-actions">
                <button type="button" className="button" onClick={openHistory}>
                  Xem lịch sử
                </button>
                <button type="button" className="button" onClick={openStats}>
                  Thống kê
                </button>
              </div>
            )}
          </div>
          <HomePage initialConfig={lastConfig} initialCategory={preferredCategory} onStart={startTest} />
        </>
      )}

      {screen.name === 'test' && (
        <>
          <p className="app__subtitle">Dạng bài: {getCategoryLabel(screen.test.config.category)}</p>
          <TestPage
            key={screen.attempt}
            questions={screen.test.questions}
            timeLimitSec={screen.test.config.timeLimitSec}
            startAt={screen.test.startAt}
            initialSelected={screen.test.selected}
            initialIndex={screen.test.currentIndex}
            // Lưu tiến độ thẳng vào bộ nhớ trình duyệt (không cập nhật state để tránh vẽ lại cả trang)
            onProgress={(selected, currentIndex) => saveActiveTest({ ...screen.test, selected, currentIndex })}
            onSubmit={(answers, durationSec, timedOut) => {
              // Chấm điểm ngay khi nộp, lưu vào lịch sử, xóa bài đang làm, rồi chuyển sang màn hình kết quả
              const result = gradeTest(screen.test.config, screen.test.questions, answers, durationSec, timedOut)
              setHistoryCount(addToHistory(result).length)
              clearActiveTest()
              setScreen({ name: 'result', result })
              window.scrollTo(0, 0)
            }}
            onQuit={() => {
              clearActiveTest()
              goHome()
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
            onBack={screen.fromHistory ? openHistory : undefined}
          />
        </>
      )}

      {screen.name === 'history' && (
        <HistoryPage
          entries={screen.entries}
          onOpen={(entry) => {
            setScreen({ name: 'result', result: entry.result, fromHistory: true })
            window.scrollTo(0, 0)
          }}
          onClear={() => {
            clearHistory()
            setHistoryCount(0)
            setScreen({ name: 'history', entries: [] })
          }}
          onHome={goHome}
        />
      )}

      {screen.name === 'stats' && (
        <StatsPage
          entries={screen.entries}
          onPractice={(category) => {
            setPreferredCategory(category)
            goHome()
          }}
          onHome={goHome}
        />
      )}
    </main>
  )
}

export default App
