// Điểm vào chung của các bộ sinh đề: nhận cấu hình bài làm, gọi đúng bộ sinh theo dạng bài.
// Thêm dạng bài mới thì bổ sung một nhánh vào generateQuestions (và countAvailableQuestions nếu dạng đó
// dùng ngân hàng câu hỏi có hạn).

import { MIXED_CATEGORIES, MIXED_QUESTIONS_PER_CATEGORY } from '../config/testOptions'
import type { DifficultySetting, Question, TestCategory, TestConfig } from '../types/question'
import { shuffle } from '../utils/random'
import { generateAbstractQuestions } from './abstract'
import type { SeenCounts } from './bank'
import { generateLogicalQuestions } from './logical'
import { generateNumberSeriesQuestions } from './numberSeries'
import { generateNumericalQuestions } from './numerical'
import { countVerbalStatements, generateVerbalQuestions } from './verbal'

/** Đổi 'mixed' (hỗn hợp) thành undefined: bộ sinh hiểu là không cố định độ khó. */
function toDifficulty(setting: DifficultySetting) {
  return setting === 'mixed' ? undefined : setting
}

/**
 * Sinh bộ câu hỏi theo cấu hình.
 * @param config Cấu hình bài làm (dạng bài, số câu, độ khó).
 * @param seen Số lần mỗi câu đã gặp trong lịch sử; dạng dùng ngân hàng (Logic, Ngôn ngữ) ưu tiên câu ít gặp nhất.
 *   Dạng sinh bằng code không cần (đề luôn mới).
 * @returns Danh sách câu hỏi.
 * @throws Lỗi nếu dạng bài chưa được hỗ trợ, hoặc ngân hàng không đủ câu.
 */
export function generateQuestions(config: TestConfig, seen?: SeenCounts): Question[] {
  const difficulty = toDifficulty(config.difficulty)

  switch (config.category) {
    case 'number-series':
      return generateNumberSeriesQuestions(config.questionCount, difficulty)
    case 'numerical':
      return generateNumericalQuestions(config.questionCount, difficulty)
    case 'logical':
      return generateLogicalQuestions(config.questionCount, difficulty, seen)
    case 'verbal':
      return generateVerbalQuestions(config.questionCount, difficulty, seen)
    case 'abstract':
      return generateAbstractQuestions(config.questionCount, difficulty)
    case 'mixed':
      // Thi thử tổng hợp: mỗi dạng một số câu cố định (cùng độ khó đã chọn), rồi trộn lẫn ngẫu nhiên
      return shuffle(
        MIXED_CATEGORIES.flatMap((category) =>
          generateQuestions(
            { ...config, category, questionCount: MIXED_QUESTIONS_PER_CATEGORY },
            seen,
          ),
        ),
      )
    default:
      throw new Error(`Dạng bài "${config.category}" chưa được hỗ trợ`)
  }
}

/**
 * Số câu tối đa có thể ra cho một dạng bài + độ khó.
 * @returns Số câu (với dạng dùng ngân hàng câu hỏi), hoặc null nếu không giới hạn (dạng sinh bằng code).
 */
export function countAvailableQuestions(category: TestCategory, difficulty: DifficultySetting): number | null {
  switch (category) {
    case 'verbal':
      return countVerbalStatements(toDifficulty(difficulty))
    default:
      return null
  }
}
