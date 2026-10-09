// Trang thống kê: tổng quan, dạng cần luyện thêm, % đúng theo dạng, theo độ khó, tiến bộ qua các lần làm.
import { useState } from 'react'
import AccuracyBars from '../components/AccuracyBars'
import OptionGroup from '../components/OptionGroup'
import ProgressChart from '../components/ProgressChart'
import { getCategoryLabel } from '../config/testOptions'
import type { QuestionCategory } from '../types/question'
import type { HistoryEntry } from '../utils/history'
import { computeStats, MIN_QUESTIONS_FOR_WEAKEST, progressSeries, STATS_CATEGORIES } from '../utils/stats'
import './StatsPage.css'

interface StatsPageProps {
  entries: HistoryEntry[]
  /** Gọi khi bấm "Luyện dạng này": về trang chủ với dạng bài được chọn sẵn. */
  onPractice: (category: QuestionCategory) => void
  /** Gọi khi bấm "Về trang chủ". */
  onHome: () => void
}

/** Tên ngắn của dạng bài cho bộ lọc (nút nhỏ, cần gọn). */
const SHORT_LABELS: Record<QuestionCategory, string> = {
  'number-series': 'Dãy số',
  numerical: 'Số liệu',
  logical: 'Logic',
  verbal: 'Ngôn ngữ',
  abstract: 'Hình',
}

/** Hiển thị một ô % theo độ khó: "80% (8/10)", hoặc "–" nếu chưa có câu nào. */
function cell(t: { questions: number; correct: number; accuracy: number | null }): string {
  return t.accuracy === null ? '–' : `${t.accuracy}% (${t.correct}/${t.questions})`
}

/**
 * StatsPage: mọi số liệu tính từ lịch sử (computeStats, progressSeries).
 * Chưa có bài nào thì hiện lời nhắc.
 */
function StatsPage({ entries, onPractice, onHome }: StatsPageProps) {
  // Bộ lọc của biểu đồ tiến bộ: 'all' hoặc một dạng bài
  const [progressFilter, setProgressFilter] = useState<QuestionCategory | 'all'>('all')
  const stats = computeStats(entries)
  const weakestStats = stats.categories.find((c) => c.category === stats.weakest)
  const practiced = stats.categories.filter((c) => c.questions > 0)

  return (
    <div className="stats-page">
      <div>
        <button type="button" className="button" onClick={onHome}>
          ← Về trang chủ
        </button>
      </div>
      <h2 className="stats-page__title">Thống kê</h2>

      {entries.length === 0 ? (
        <p className="stats-page__muted">Chưa có dữ liệu. Hãy làm vài bài để xem thống kê!</p>
      ) : (
        <>
          {/* Hàng ô số liệu tổng quan */}
          <section className="stats-page__tiles" aria-label="Tổng quan">
            <div className="stat-tile">
              <span className="stat-tile__label">Số bài đã làm</span>
              <span className="stat-tile__value">{stats.attempts}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__label">Số câu đã làm</span>
              <span className="stat-tile__value">{stats.questions}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__label">Tỉ lệ đúng chung</span>
              <span className="stat-tile__value">{stats.accuracy}%</span>
            </div>
          </section>

          {/* Dạng cần luyện thêm */}
          <section className="stats-page__card stats-page__weakest" aria-label="Dạng cần luyện thêm">
            {weakestStats ? (
              <>
                <p>
                  <span className="stats-page__muted">Dạng cần luyện thêm</span>
                  <br />
                  <strong className="stats-page__weakest-name">⚠ {getCategoryLabel(weakestStats.category)}</strong>{' '}
                  · {weakestStats.accuracy}% đúng
                </p>
                <button type="button" className="button button--primary" onClick={() => onPractice(weakestStats.category)}>
                  Luyện dạng này
                </button>
              </>
            ) : (
              <p className="stats-page__muted">
                Hãy làm ít nhất 2 dạng bài, mỗi dạng {MIN_QUESTIONS_FOR_WEAKEST} câu trở lên, để biết dạng nào cần
                luyện thêm.
              </p>
            )}
          </section>

          {/* % đúng theo dạng bài */}
          <section className="stats-page__card">
            <h3 className="stats-page__heading">Tỉ lệ đúng theo dạng bài</h3>
            <AccuracyBars categories={stats.categories} weakest={stats.weakest} />
          </section>

          {/* % đúng theo độ khó (bảng) */}
          {practiced.length > 0 && (
            <section className="stats-page__card">
              <h3 className="stats-page__heading">Tỉ lệ đúng theo độ khó</h3>
              <div className="stats-page__table-scroll">
                <table className="stats-page__table">
                  <thead>
                    <tr>
                      <th scope="col">Dạng bài</th>
                      <th scope="col">Dễ</th>
                      <th scope="col">Trung bình</th>
                      <th scope="col">Khó</th>
                      <th scope="col">Giây/câu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {practiced.map((c) => (
                      <tr key={c.category}>
                        <th scope="row">{getCategoryLabel(c.category)}</th>
                        <td>{cell(c.byDifficulty.easy)}</td>
                        <td>{cell(c.byDifficulty.medium)}</td>
                        <td>{cell(c.byDifficulty.hard)}</td>
                        <td>{c.avgSecondsPerQuestion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Tiến bộ qua các lần làm: bộ lọc ở trên, biểu đồ ở dưới */}
          <section className="stats-page__card">
            <h3 className="stats-page__heading">Tiến bộ qua 20 bài gần nhất</h3>
            <OptionGroup
              label="Dạng bài"
              options={[
                { value: 'all', label: 'Tất cả' },
                ...STATS_CATEGORIES.map((c) => ({ value: c, label: SHORT_LABELS[c] })),
              ]}
              value={progressFilter}
              onChange={setProgressFilter}
            />
            <div className="stats-page__chart">
              <ProgressChart points={progressSeries(entries, progressFilter)} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default StatsPage
