// Trang chủ: người dùng chọn dạng bài, số câu, độ khó, tốc độ rồi bấm "Bắt đầu".
import { useState } from 'react'
import OptionGroup from '../components/OptionGroup'
import {
  CATEGORY_OPTIONS,
  DEFAULTS,
  DIFFICULTY_OPTIONS,
  QUESTION_COUNT_OPTIONS,
  SPEED_OPTIONS,
} from '../config/testOptions'
import type { DifficultySetting, QuestionCategory, TestConfig } from '../types/question'
import { formatTime } from '../utils/time'
import './HomePage.css'

interface HomePageProps {
  /** Cấu hình lần làm trước (nếu có), để giữ lại lựa chọn khi quay về trang chủ. */
  initialConfig: TestConfig | null
  /** Gọi khi bấm "Bắt đầu", kèm cấu hình đã chọn. */
  onStart: (config: TestConfig) => void
}

/** Tìm mức tốc độ khớp với cấu hình cũ (tổng thời gian ÷ số câu), không khớp thì dùng mặc định. */
function findSpeedId(config: TestConfig | null): string {
  if (!config) return DEFAULTS.speedId
  const perQuestion = config.timeLimitSec === null ? null : config.timeLimitSec / config.questionCount
  return SPEED_OPTIONS.find((s) => s.secondsPerQuestion === perQuestion)?.id ?? DEFAULTS.speedId
}

/**
 * HomePage: các nhóm lựa chọn và nút bắt đầu.
 * Tổng thời gian được tính tự động = số câu × số giây mỗi câu.
 */
function HomePage({ initialConfig, onStart }: HomePageProps) {
  const [category, setCategory] = useState<QuestionCategory>(initialConfig?.category ?? DEFAULTS.category)
  const [questionCount, setQuestionCount] = useState(initialConfig?.questionCount ?? DEFAULTS.questionCount)
  const [difficulty, setDifficulty] = useState<DifficultySetting>(
    initialConfig?.difficulty ?? DEFAULTS.difficulty,
  )
  const [speedId, setSpeedId] = useState(() => findSpeedId(initialConfig))

  // Tính tổng thời gian từ tốc độ và số câu (null = không giới hạn)
  const speed = SPEED_OPTIONS.find((s) => s.id === speedId) ?? SPEED_OPTIONS[0]
  const timeLimitSec = speed.secondsPerQuestion === null ? null : speed.secondsPerQuestion * questionCount

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
        options={QUESTION_COUNT_OPTIONS.map((n) => ({ value: n, label: `${n} câu` }))}
        value={questionCount}
        onChange={setQuestionCount}
      />

      <OptionGroup
        label="Độ khó"
        options={DIFFICULTY_OPTIONS.map((d) => ({ value: d.id, label: d.label }))}
        value={difficulty}
        onChange={setDifficulty}
      />

      <OptionGroup
        label="Tốc độ"
        options={SPEED_OPTIONS.map((s) => ({ value: s.id, label: s.label }))}
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
          onClick={() => onStart({ category, questionCount, difficulty, timeLimitSec })}
        >
          Bắt đầu làm bài
        </button>
      </div>
    </div>
  )
}

export default HomePage
