// Kiểm thử bảng số liệu: kết xuất component ra HTML (react-dom/server) rồi kiểm tra nội dung.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { Question, TableStimulus } from '../types/question'
import QuestionCard from './QuestionCard'
import TableView from './TableView'

/** Bảng mẫu: cột "Ghi chú" là chữ, các cột còn lại là số. */
const table: TableStimulus = {
  type: 'table',
  title: 'Doanh thu công ty A',
  headers: ['Quý', 'Doanh thu (tỷ đồng)', 'Tăng trưởng', 'Ghi chú'],
  rows: [
    ['Q1', '1.200', '5,5%', 'Ổn định'],
    ['Q2', '1.350', '-2%', 'Giảm nhẹ'],
  ],
  note: 'Nguồn: số liệu giả định.',
}

describe('TableView', () => {
  const html = renderToStaticMarkup(<TableView table={table} />)

  it('hiển thị tên bảng, tiêu đề cột, dữ liệu và ghi chú', () => {
    for (const text of ['Doanh thu công ty A', 'Doanh thu (tỷ đồng)', '1.350', 'Giảm nhẹ', 'Nguồn: số liệu giả định.']) {
      expect(html).toContain(text)
    }
  })

  it('cột số được căn phải, cột chữ thì không', () => {
    // Đếm số ô có class căn phải: 2 cột số × (1 tiêu đề + 2 dòng) = 6
    expect(html.match(/table-view__cell--numeric/g)).toHaveLength(6)
    expect(html).toContain('<td>Ổn định</td>')
  })

  it('có khung cuộn ngang để không vỡ trang trên điện thoại', () => {
    expect(html).toContain('table-view__scroll')
  })
})

describe('QuestionCard với dữ kiện bảng', () => {
  it('hiển thị theo thứ tự: lời dẫn → bảng → đề bài', () => {
    const question: Question = {
      id: 'q1',
      category: 'numerical',
      difficulty: 'easy',
      instruction: 'Dựa vào bảng, trả lời câu hỏi:',
      stimulus: table,
      prompt: 'Doanh thu Q2 tăng bao nhiêu so với Q1?',
      options: [
        { id: 'A', content: '150' },
        { id: 'B', content: '120' },
      ],
      correctOptionId: 'A',
      explanationSteps: ['1.350 − 1.200 = 150.'],
    }
    const html = renderToStaticMarkup(<QuestionCard question={question} selectedOptionId={null} onSelect={() => {}} />)
    const instructionAt = html.indexOf('Dựa vào bảng')
    const tableAt = html.indexOf('<table')
    const promptAt = html.indexOf('Doanh thu Q2 tăng')
    expect(instructionAt).toBeGreaterThan(-1)
    expect(instructionAt).toBeLessThan(tableAt)
    expect(tableAt).toBeLessThan(promptAt)
  })
})
