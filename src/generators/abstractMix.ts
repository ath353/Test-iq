// Dạng Suy luận hình: trộn hai kiểu câu hỏi trong một bài: ma trận 3 × 3 (abstract.ts) và chuỗi 5 hình
// (abstractSeries.ts). Tách file riêng để hai bộ sinh không phải import lẫn nhau.

import type { Difficulty, Question } from '../types/question'
import { pickOne } from '../utils/random'
import { generateAbstractQuestion } from './abstract'
import { generateSeriesQuestion } from './abstractSeries'

/** Tỉ lệ câu chuỗi hình trong một bài dạng Hình (phần còn lại là ma trận). */
export const SERIES_SHARE = 0.5

/**
 * Sinh một bộ câu hỏi Suy luận hình, mỗi câu ngẫu nhiên là ma trận hoặc chuỗi hình (tỉ lệ SERIES_SHARE),
 * không có hai câu trùng dữ kiện.
 * @param count Số câu.
 * @param difficulty Độ khó cố định; bỏ trống thì mỗi câu lấy độ khó ngẫu nhiên.
 * @returns Danh sách câu hỏi với mã 'ab-1', 'ab-2', …
 */
export function generateAbstractQuestions(count: number, difficulty?: Difficulty): Question[] {
  const questions: Question[] = []
  const used = new Set<string>()
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard']
  while (questions.length < count) {
    const id = `ab-${questions.length + 1}`
    const level = difficulty ?? pickOne(difficulties)
    const question = Math.random() < SERIES_SHARE ? generateSeriesQuestion(id, level) : generateAbstractQuestion(id, level)
    const key = JSON.stringify(question.stimulus)
    if (used.has(key)) continue
    used.add(key)
    questions.push(question)
  }
  return questions
}
