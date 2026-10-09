// Kiểm thử trang lịch sử: kết xuất ra HTML rồi kiểm tra nội dung.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { generateQuestions } from '../generators'
import type { TestConfig } from '../types/question'
import type { HistoryEntry } from '../utils/history'
import { gradeTest } from '../utils/scoring'
import HistoryPage from './HistoryPage'

/** Tạo một mục lịch sử: 10 câu Số liệu, trả lời đúng `correct` câu đầu. */
function makeEntry(id: string, correct: number, timedOut = false): HistoryEntry {
  const config: TestConfig = { category: 'numerical', questionCount: 10, difficulty: 'hard', timeLimitSec: 900 }
  const questions = generateQuestions(config)
  const answers = questions.map((q, i) => ({ questionId: q.id, selectedOptionId: i < correct ? q.correctOptionId : null }))
  return { id, result: gradeTest(config, questions, answers, 125, timedOut) }
}

const render = (entries: HistoryEntry[]) =>
  renderToStaticMarkup(<HistoryPage entries={entries} onOpen={() => {}} onClear={() => {}} onHome={() => {}} />)

describe('HistoryPage', () => {
  it('chưa có bài nào thì hiện lời nhắc, không có nút xóa', () => {
    const html = render([])
    expect(html).toContain('Bạn chưa làm bài nào')
    expect(html).not.toContain('Xóa lịch sử')
  })

  it('mỗi bài một dòng: dạng bài, độ khó, thời gian, điểm, % đúng, ghi chú hết giờ', () => {
    const html = render([makeEntry('a', 7), makeEntry('b', 3, true)])
    expect(html).toContain('Lịch sử làm bài (2)')
    expect(html.match(/class="history-item"/g)).toHaveLength(2)
    expect(html).toContain('Suy luận số liệu')
    expect(html).toContain('Khó')
    expect(html).toContain('2:05')
    expect(html).toContain('7/10')
    expect(html).toContain('70%')
    expect(html).toContain('3/10')
    expect(html).toContain('Hết giờ')
    expect(html).toContain('Xóa lịch sử')
  })
})
