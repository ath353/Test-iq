// Kiểm thử bộ trộn dạng Suy luận hình: một bài có cả ma trận lẫn chuỗi hình.
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import QuestionCard from '../components/QuestionCard'
import { generateAbstractQuestions } from './abstractMix'

describe('generateAbstractQuestions', () => {
  it('sinh đúng số câu, mã không trùng, dữ kiện không trùng, giữ đúng độ khó', () => {
    const questions = generateAbstractQuestions(30, 'hard')
    expect(questions).toHaveLength(30)
    expect(new Set(questions.map((q) => q.id)).size).toBe(30)
    expect(new Set(questions.map((q) => JSON.stringify(q.stimulus))).size).toBe(30)
    expect(questions.every((q) => q.difficulty === 'hard' && q.category === 'abstract')).toBe(true)
  })

  it('trộn cả ma trận lẫn chuỗi hình, tỉ lệ khoảng 50/50', () => {
    const questions = generateAbstractQuestions(400)
    const series = questions.filter((q) => q.stimulus?.type === 'sequence').length
    const matrix = questions.filter((q) => q.stimulus?.type === 'matrix').length
    expect(series + matrix).toBe(400)
    // 400 câu, mỗi câu 50%: số câu chuỗi gần như chắc chắn nằm trong 150–250
    expect(series).toBeGreaterThan(150)
    expect(series).toBeLessThan(250)
  })

  it('câu chuỗi hình hiển thị 5 hình + ô "?" và 5 lựa chọn dạng hình', () => {
    const q = generateAbstractQuestions(50).find((x) => x.stimulus?.type === 'sequence')!
    const html = renderToStaticMarkup(<QuestionCard question={q} selectedOptionId={null} onSelect={() => {}} />)
    expect(html).toContain('sequence-view__cell--missing')
    // 5 ô chuỗi + 5 lựa chọn = 10 hình SVG
    expect(html.match(/<svg/g)).toHaveLength(10)
    expect(html).toContain('question-card--split')
  })
})
