// Kiểm thử trang thống kê: kết xuất ra HTML rồi kiểm tra nội dung chính.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { generateQuestions } from '../generators'
import type { QuestionCategory, TestConfig } from '../types/question'
import type { HistoryEntry } from '../utils/history'
import { gradeTest } from '../utils/scoring'
import StatsPage from './StatsPage'

/** Tạo một mục lịch sử 10 câu, trả lời đúng `correct` câu đầu. */
function makeEntry(id: string, category: QuestionCategory, correct: number, finishedAt: string): HistoryEntry {
  const config: TestConfig = { category, questionCount: 10, difficulty: 'mixed', timeLimitSec: 600 }
  const questions = generateQuestions(config)
  const answers = questions.map((q, i) => ({ questionId: q.id, selectedOptionId: i < correct ? q.correctOptionId : null }))
  return { id, result: { ...gradeTest(config, questions, answers, 300, false), finishedAt } }
}

const render = (entries: HistoryEntry[]) =>
  renderToStaticMarkup(<StatsPage entries={entries} onPractice={() => {}} onHome={() => {}} />)

describe('StatsPage', () => {
  it('chưa có dữ liệu thì hiện lời nhắc', () => {
    expect(render([])).toContain('Chưa có dữ liệu')
  })

  it('hiện ô tổng quan, dạng cần luyện thêm, thanh %, bảng độ khó, biểu đồ tiến bộ', () => {
    const html = render([
      makeEntry('a', 'number-series', 9, '2026-01-01T00:00:00Z'),
      makeEntry('b', 'verbal', 3, '2026-01-02T00:00:00Z'),
      makeEntry('c', 'number-series', 7, '2026-01-03T00:00:00Z'),
    ])
    // Tổng quan: 3 bài, 30 câu, đúng 19/30 ≈ 63%
    expect(html).toContain('Số bài đã làm')
    expect(html).toContain('>3<')
    expect(html).toContain('>30<')
    expect(html).toContain('63%')
    // Dạng yếu nhất là Ngôn ngữ (30%), có nút luyện
    expect(html).toContain('⚠ Suy luận ngôn ngữ')
    expect(html).toContain('Luyện dạng này')
    // Thanh %: Dãy số 16/20 = 80%; dạng chưa làm hiện "Chưa làm"
    expect(html).toContain('16/20 câu')
    expect(html).toContain('Chưa làm')
    // Bảng độ khó và biểu đồ tiến bộ (3 bài → có biểu đồ, có bảng thay thế)
    expect(html).toContain('Tỉ lệ đúng theo độ khó')
    expect(html).toContain('Xem dạng bảng')
    expect(html.match(/class="progress-chart__dot"/g)).toHaveLength(3)
  })

  it('chỉ có 1 bài thì biểu đồ tiến bộ nhắc cần ít nhất 2 bài', () => {
    expect(render([makeEntry('a', 'abstract', 5, '2026-01-01T00:00:00Z')])).toContain('Cần ít nhất 2 bài')
  })
})
