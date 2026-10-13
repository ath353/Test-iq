// Trang "Bí kíp": lộ trình cho người mới (mở sẵn ở đầu trang), bí kíp từng dạng và bí kíp chung (bấm để mở / đóng).
import { getCategoryLabel } from '../config/testOptions'
import type { QuestionCategory } from '../types/question'
import type { TipSection } from '../types/tips'
import { TIPS } from '../utils/tips'
import './TipsPage.css'

/**
 * Thứ tự các dạng trên trang: theo thứ tự học gợi ý trong lộ trình người mới
 * (dạng dễ làm quen trước, dạng cần đọc nhiều sau).
 */
const CATEGORY_ORDER: QuestionCategory[] = ['number-series', 'word-problem', 'abstract', 'logical', 'numerical', 'verbal']

interface TipsPageProps {
  /** Gọi khi bấm "Về trang chủ". */
  onHome: () => void
}

/** Một nhóm mẹo: tiêu đề nhỏ + danh sách ý. */
function SectionBlock({ section }: { section: TipSection }) {
  return (
    <section className="tips-section">
      <h4 className="tips-section__title">{section.title}</h4>
      <ul className="tips-section__items">
        {section.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

/**
 * TipsPage: hiển thị toàn bộ nội dung trong src/data/tips.json.
 * Mỗi phần là một khối <details> của trình duyệt (bấm tiêu đề để mở / đóng, dùng được bằng bàn phím
 * và trình đọc màn hình). Lộ trình người mới mở sẵn; các dạng đóng sẵn để trang gọn.
 */
function TipsPage({ onHome }: TipsPageProps) {
  const { beginnerPlan, general, categories } = TIPS

  return (
    <div className="tips-page">
      <div className="tips-page__toolbar">
        <button type="button" className="button" onClick={onHome}>
          ← Về trang chủ
        </button>
      </div>

      <h2 className="tips-page__title">Bí kíp ôn thi</h2>

      {/* Lộ trình cho người mới: mở sẵn, đặt đầu trang */}
      <details className="tips-block" open>
        <summary className="tips-block__summary">Lộ trình cho người mới bắt đầu</summary>
        <div className="tips-block__body">
          <p className="tips-block__intro">{beginnerPlan.intro}</p>
          <ol className="tips-plan">
            {beginnerPlan.phases.map((phase) => (
              <li key={phase.id} className="tips-plan__phase">
                <h4 className="tips-plan__heading">
                  <span className="tips-plan__days">{phase.days}</span> {phase.title}
                </h4>
                <p className="tips-plan__goal">Mục tiêu: {phase.goal}</p>
                <ul className="tips-section__items">
                  {phase.tasks.map((task, i) => (
                    <li key={i}>{task}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <SectionBlock section={beginnerPlan.readiness} />
          <SectionBlock section={beginnerPlan.shortPlan} />
        </div>
      </details>

      {/* Bí kíp từng dạng */}
      <h3 className="tips-page__group">Bí kíp từng dạng</h3>
      {CATEGORY_ORDER.map((category) => (
        <details key={category} className="tips-block" id={`tips-${category}`}>
          <summary className="tips-block__summary">{getCategoryLabel(category)}</summary>
          <div className="tips-block__body">
            <p className="tips-block__intro">{categories[category].summary}</p>
            {categories[category].sections.map((section) => (
              <SectionBlock key={section.id} section={section} />
            ))}
          </div>
        </details>
      ))}

      {/* Bí kíp chung */}
      <h3 className="tips-page__group">Dùng cho mọi dạng</h3>
      <details className="tips-block">
        <summary className="tips-block__summary">Bí kíp chung</summary>
        <div className="tips-block__body">
          {general.map((section) => (
            <SectionBlock key={section.id} section={section} />
          ))}
        </div>
      </details>
    </div>
  )
}

export default TipsPage
