// Trang chủ: người dùng chọn dạng bài, số câu, độ khó, tốc độ rồi bấm "Bắt đầu".
import { useState } from 'react'
import OptionGroup from '../components/OptionGroup'
import {
  CATEGORY_OPTIONS,
  DEFAULTS,
  DIFFICULTY_OPTIONS,
  findSpeedId,
  getQuestionCountChoices,
  getSpeedLabel,
  getTimeLimitSec,
  resolveQuestionCount,
  SPEED_OPTIONS,
} from '../config/testOptions'
import { countAvailableQuestions } from '../generators'
import type { DifficultySetting, QuestionCategory, TestCategory, TestConfig } from '../types/question'
import { formatTime } from '../utils/time'
import './HomePage.css'

interface HomePageProps {
  /** Cấu hình lần làm trước (nếu có), để giữ lại lựa chọn khi quay về trang chủ. */
  initialConfig: TestConfig | null
  /** Dạng bài chọn sẵn (ví dụ từ nút "Luyện dạng này" ở trang thống kê); ưu tiên hơn dạng của lần làm trước. */
  initialCategory?: QuestionCategory | null
  /** Gọi khi bấm "Bắt đầu", kèm cấu hình đã chọn. */
  onStart: (config: TestConfig) => void
}

/**
 * HomePage: các nhóm lựa chọn và nút bắt đầu.
 * Tổng thời gian được tính tự động = số câu × số giây mỗi câu (đã nhân hệ số của dạng bài),
 * nên đổi dạng bài thì nhãn tốc độ và tổng thời gian tự cập nhật.
 * Thi thử tổng hợp: số câu cố định, thời gian cộng theo hệ số dạng bài của từng câu (getTimeLimitSec).
 *
 * Với dạng dùng ngân hàng câu hỏi có hạn (Logic): lựa chọn số câu vượt quá số câu hiện có (theo độ khó)
 * bị khóa; nếu lựa chọn đang chọn bị khóa thì tự chuyển sang lựa chọn hợp lệ gần nhất.
 */
function HomePage({ initialConfig, initialCategory, onStart }: HomePageProps) {
  const [category, setCategory] = useState<TestCategory>(
    initialCategory ?? initialConfig?.category ?? DEFAULTS.category,
  )
  // Số câu người dùng đã bấm chọn (có thể tạm thời không hợp lệ khi đổi dạng bài / độ khó)
  const [preferredCount, setPreferredCount] = useState(initialConfig?.questionCount ?? DEFAULTS.questionCount)
  const [difficulty, setDifficulty] = useState<DifficultySetting>(
    initialConfig?.difficulty ?? DEFAULTS.difficulty,
  )
  const [speedId, setSpeedId] = useState(() => findSpeedId(initialConfig))

  // Lựa chọn số câu (kèm trạng thái khóa) và số câu thực sự dùng
  const available = countAvailableQuestions(category, difficulty)
  const countChoices = getQuestionCountChoices(category, available)
  const questionCount = resolveQuestionCount(preferredCount, countChoices)
  const hasLockedCount = countChoices.some((c) => c.disabled)

  // Tính tổng thời gian từ tốc độ, dạng bài và số câu (null = không giới hạn)
  const speed = SPEED_OPTIONS.find((s) => s.id === speedId) ?? SPEED_OPTIONS[0]
  const timeLimitSec = questionCount === null ? null : getTimeLimitSec(speed, category, questionCount)

  return (
    <div className="home-page">
      {/* Chọn dạng bài: dạng chưa làm thì hiện mờ, không bấm được */}
      <section>
        <h2 className="home-page__heading">Chọn dạng bài</h2>
        <div className="home-page__categories" role="radiogroup" aria-label="Dạng bài">
          {CATEGORY_OPTIONS.map((c) => {
            const isSelected = c.id === category
            const classes = ['category-card']
            if (isSelected) classes.push('category-card--selected')
            if (!c.available) classes.push('category-card--disabled')
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={!c.available}
                className={classes.join(' ')}
                onClick={() => setCategory(c.id)}
              >
                <span className="category-card__title">
                  {c.label}
                  {!c.available && <span className="category-card__badge">Sắp có</span>}
                </span>
                <span className="category-card__description">{c.description}</span>
              </button>
            )
          })}
        </div>
      </section>

      <OptionGroup
        label="Số câu"
        options={countChoices.map((c) => ({ value: c.count, label: `${c.count} câu`, disabled: c.disabled }))}
        value={questionCount ?? 0}
        onChange={setPreferredCount}
        hint={hasLockedCount ? `Độ khó này hiện có ${available} câu.` : undefined}
      />

      <OptionGroup
        label="Độ khó"
        options={DIFFICULTY_OPTIONS.map((d) => ({ value: d.id, label: d.label }))}
        value={difficulty}
        onChange={setDifficulty}
      />

      <OptionGroup
        label="Tốc độ"
        options={SPEED_OPTIONS.map((s) => ({ value: s.id, label: getSpeedLabel(s, category, questionCount ?? 0) }))}
        value={speedId}
        onChange={setSpeedId}
      />

      {/* Tóm tắt và nút bắt đầu */}
      <div className="home-page__start">
        <p className="home-page__summary">
          Tổng thời gian:{' '}
          <strong>{timeLimitSec === null ? 'Không giới hạn' : formatTime(timeLimitSec)}</strong>
        </p>
        <button
          type="button"
          className="button button--primary home-page__start-button"
          // Không có lựa chọn số câu nào hợp lệ (ngân hàng quá ít câu) thì không cho bắt đầu
          disabled={questionCount === null}
          onClick={() => questionCount !== null && onStart({ category, questionCount, difficulty, timeLimitSec })}
        >
          Bắt đầu làm bài
        </button>
      </div>
    </div>
  )
}

export default HomePage
