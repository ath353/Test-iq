// Màn hình kết quả: điểm số, thống kê đúng/sai/bỏ trống, thời gian, và xem lại từng câu kèm lời giải.
import ReviewItem from '../components/ReviewItem'
import type { TestResult } from '../types/question'
import { countByStatus } from '../utils/scoring'
import { formatTime } from '../utils/time'
import './ResultPage.css'

interface ResultPageProps {
  result: TestResult
  /** Gọi khi người dùng bấm "Làm bài mới". */
  onRestart: () => void
}

/**
 * ResultPage: hiển thị kết quả sau khi nộp bài.
 */
function ResultPage({ result, onRestart }: ResultPageProps) {
  const total = result.questions.length
  const counts = countByStatus(result)
  const percent = total === 0 ? 0 : Math.round((result.correctCount / total) * 100)
  // Tra câu trả lời theo mã câu hỏi để ghép với từng câu
  const answerById = new Map(result.answers.map((a) => [a.questionId, a]))

  return (
    <div className="result-page">
      {result.timedOut && (
        <p className="result-page__notice" role="status">
          <strong>Hết giờ!</strong> Bài đã được tự động nộp.
        </p>
      )}

      {/* Tổng quan: điểm lớn ở giữa, các chỉ số phụ bên dưới */}
      <section className="result-page__summary" aria-label="Tổng quan kết quả">
        <p className="result-page__score">
          {result.correctCount}
          <span className="result-page__score-total"> / {total}</span>
        </p>
        <p className="result-page__percent">Đúng {percent}%</p>

        <dl className="result-page__stats">
          <div>
            <dt>Đúng</dt>
            <dd className="result-page__stat--correct">{counts.correct}</dd>
          </div>
          <div>
            <dt>Sai</dt>
            <dd className="result-page__stat--wrong">{counts.wrong}</dd>
          </div>
          <div>
            <dt>Bỏ trống</dt>
            <dd>{counts.skipped}</dd>
          </div>
          <div>
            <dt>Thời gian</dt>
            <dd>
              {formatTime(result.durationSec)}
              <span className="result-page__stat-limit"> / {formatTime(result.config.timeLimitSec)}</span>
            </dd>
          </div>
        </dl>

        <button type="button" className="button button--primary" onClick={onRestart}>
          Làm bài mới
        </button>
      </section>

      {/* Xem lại từng câu: câu sai và bỏ trống được mở sẵn lời giải */}
      <section className="result-page__review" aria-label="Xem lại từng câu">
        <h2>Xem lại bài làm</h2>
        {result.questions.map((q, i) => (
          <ReviewItem key={q.id} index={i + 1} question={q} answer={answerById.get(q.id)} />
        ))}
      </section>
    </div>
  )
}

export default ResultPage
