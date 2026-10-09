// Biểu đồ thanh ngang: % đúng của từng dạng bài (một màu, thứ tự dạng bài cố định).
import { getCategoryLabel } from '../config/testOptions'
import type { QuestionCategory } from '../types/question'
import type { CategoryStats } from '../utils/stats'
import './AccuracyBars.css'

interface AccuracyBarsProps {
  categories: CategoryStats[]
  /** Dạng yếu nhất (nếu có) được gắn nhãn "Cần luyện thêm" (chữ + biểu tượng, không chỉ dựa vào màu). */
  weakest: QuestionCategory | null
}

/**
 * AccuracyBars: mỗi dạng một hàng: tên dạng | thanh % đúng (0–100%) | số % và số câu.
 * Mọi giá trị đều ghi trực tiếp cạnh thanh, nên không cần di chuột mới xem được.
 * Dạng chưa làm hiện "Chưa làm" thay cho thanh.
 */
function AccuracyBars({ categories, weakest }: AccuracyBarsProps) {
  return (
    <ul className="accuracy-bars" aria-label="Phần trăm đúng theo dạng bài">
      {categories.map((c) => (
        <li key={c.category} className="accuracy-bars__row">
          <span className="accuracy-bars__label">
            {getCategoryLabel(c.category)}
            {c.category === weakest && <span className="accuracy-bars__flag">⚠ Cần luyện thêm</span>}
          </span>

          {c.accuracy === null ? (
            <span className="accuracy-bars__empty">Chưa làm</span>
          ) : (
            <span className="accuracy-bars__value-row">
              {/* Rãnh 0–100%; thanh dài theo % đúng. role="meter" để trình đọc màn hình đọc được giá trị. */}
              <span
                className="accuracy-bars__track"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={c.accuracy}
                aria-label={`${getCategoryLabel(c.category)}: ${c.accuracy}% đúng`}
              >
                <span className="accuracy-bars__bar" style={{ width: `${c.accuracy}%` }} />
              </span>
              <span className="accuracy-bars__value">
                <strong>{c.accuracy}%</strong>
                <span className="accuracy-bars__detail">
                  {c.correct}/{c.questions} câu
                </span>
              </span>
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

export default AccuracyBars
