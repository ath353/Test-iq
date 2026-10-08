// Chấm điểm bài làm: so đáp án người dùng với đáp án đúng, tổng hợp thành TestResult.

import type { Question, TestConfig, TestResult, UserAnswer } from '../types/question'

/** Trạng thái của một câu sau khi chấm. */
export type AnswerStatus = 'correct' | 'wrong' | 'skipped'

/**
 * Xác định trạng thái một câu: đúng, sai, hay bỏ trống.
 * @param question Câu hỏi.
 * @param answer Câu trả lời của người dùng cho câu đó (undefined nếu không có).
 * @returns 'correct' | 'wrong' | 'skipped'.
 */
export function getAnswerStatus(question: Question, answer: UserAnswer | undefined): AnswerStatus {
  if (!answer || answer.selectedOptionId === null) return 'skipped'
  return answer.selectedOptionId === question.correctOptionId ? 'correct' : 'wrong'
}

/**
 * Chấm cả bài và tạo kết quả.
 * Câu trả lời được ghép với câu hỏi theo questionId (không phụ thuộc thứ tự mảng).
 * @param config Cấu hình bài làm.
 * @param questions Danh sách câu hỏi.
 * @param answers Câu trả lời của người dùng.
 * @param durationSec Thời gian đã dùng (giây).
 * @param timedOut true nếu nộp do hết giờ.
 * @returns Kết quả bài làm, kèm thời điểm nộp.
 */
export function gradeTest(
  config: TestConfig,
  questions: Question[],
  answers: UserAnswer[],
  durationSec: number,
  timedOut: boolean,
): TestResult {
  // Tra câu trả lời theo mã câu hỏi cho nhanh
  const answerById = new Map(answers.map((a) => [a.questionId, a]))
  const correctCount = questions.filter(
    (q) => getAnswerStatus(q, answerById.get(q.id)) === 'correct',
  ).length

  return {
    config,
    questions,
    answers,
    correctCount,
    durationSec,
    timedOut,
    finishedAt: new Date().toISOString(),
  }
}

/**
 * Đếm số câu theo từng trạng thái.
 * @param result Kết quả bài làm.
 * @returns Số câu đúng, sai, bỏ trống.
 */
export function countByStatus(result: TestResult): Record<AnswerStatus, number> {
  const answerById = new Map(result.answers.map((a) => [a.questionId, a]))
  const counts: Record<AnswerStatus, number> = { correct: 0, wrong: 0, skipped: 0 }
  for (const q of result.questions) counts[getAnswerStatus(q, answerById.get(q.id))]++
  return counts
}
