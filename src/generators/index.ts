// Điểm vào chung của các bộ sinh đề: nhận cấu hình bài làm, gọi đúng bộ sinh theo dạng bài.
// Thêm dạng bài mới thì bổ sung một nhánh vào hàm generateQuestions.

import type { Question, TestConfig } from '../types/question'
import { generateNumberSeriesQuestions } from './numberSeries'
import { generateNumericalQuestions } from './numerical'

/**
 * Sinh bộ câu hỏi theo cấu hình.
 * @param config Cấu hình bài làm (dạng bài, số câu, độ khó).
 * @returns Danh sách câu hỏi.
 * @throws Lỗi nếu dạng bài chưa được hỗ trợ.
 */
export function generateQuestions(config: TestConfig): Question[] {
  // 'mixed' nghĩa là không cố định độ khó: bộ sinh tự chọn ngẫu nhiên cho từng câu
  const difficulty = config.difficulty === 'mixed' ? undefined : config.difficulty

  switch (config.category) {
    case 'number-series':
      return generateNumberSeriesQuestions(config.questionCount, difficulty)
    case 'numerical':
      return generateNumericalQuestions(config.questionCount, difficulty)
    default:
      throw new Error(`Dạng bài "${config.category}" chưa được hỗ trợ`)
  }
}
