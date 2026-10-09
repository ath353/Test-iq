// Trang lịch sử: danh sách các bài đã nộp (mới nhất ở trên), bấm vào để xem lại chi tiết + lời giải.
import { getCategoryLabel, getDifficultyLabel } from '../config/testOptions'
import type { HistoryEntry } from '../utils/history'
import { formatDateTime, formatTime } from '../utils/time'
import './HistoryPage.css'

interface HistoryPageProps {
  /** Các bài đã làm, mới nhất đứng đầu. */
  entries: HistoryEntry[]
  /** Gọi khi bấm vào một bài để xem lại. */
  onOpen: (entry: HistoryEntry) => void
  /** Gọi khi người dùng xác nhận xóa toàn bộ lịch sử. */
  onClear: () => void
  /** Gọi khi bấm "Về trang chủ". */
  onHome: () => void
}

/** Tính % đúng của một bài (làm tròn số nguyên). */
function percentOf(entry: HistoryEntry): number {
  const total = entry.result.questions.length
  return total === 0 ? 0 : Math.round((entry.result.correctCount / total) * 100)
}

/**
 * HistoryPage: mỗi bài là một dòng có thể bấm vào, gồm ngày giờ, dạng bài, độ khó, điểm, % đúng, thời gian.
 * Không có bài nào thì hiện lời nhắc làm bài đầu tiên.
 */
function HistoryPage({ entries, onOpen, onClear, onHome }: HistoryPageProps) {
  /** Xóa lịch sử: hỏi xác nhận vì không khôi phục được. */
  function handleClear() {
    if (window.confirm(`Xóa toàn bộ ${entries.length} bài trong lịch sử? Không thể khôi phục.`)) onClear()
  }

  return (
    <div className="history-page">
      <div className="history-page__toolbar">
        <button type="button" className="button" onClick={onHome}>
          ← Về trang chủ
        </button>
        {entries.length > 0 && (
          <button type="button" className="button history-page__clear" onClick={handleClear}>
            Xóa lịch sử
          </button>
        )}
      </div>

      <h2 className="history-page__title">Lịch sử làm bài ({entries.length})</h2>

      {entries.length === 0 ? (
        <p className="history-page__empty">Bạn chưa làm bài nào. Hãy làm bài đầu tiên ở trang chủ!</p>
      ) : (
        <ul className="history-page__list">
          {entries.map((entry) => {
            const { result } = entry
            const percent = percentOf(entry)
            return (
              <li key={entry.id}>
                <button type="button" className="history-item" onClick={() => onOpen(entry)}>
                  {/* Cột trái: dạng bài, thông tin phụ */}
                  <span className="history-item__main">
                    <span className="history-item__category">{getCategoryLabel(result.config.category)}</span>
                    <span className="history-item__meta">
                      {formatDateTime(result.finishedAt)} · {getDifficultyLabel(result.config.difficulty)} ·{' '}
                      {formatTime(result.durationSec)}
                      {result.timedOut && ' · Hết giờ'}
                    </span>
                  </span>
                  {/* Cột phải: điểm và % đúng */}
                  <span className="history-item__score">
                    <strong>
                      {result.correctCount}/{result.questions.length}
                    </strong>
                    <span className="history-item__percent">{percent}%</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default HistoryPage
