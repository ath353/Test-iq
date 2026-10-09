// Danh sách các lựa chọn ở trang chủ (dạng bài, số câu, độ khó, tốc độ) và nhãn tiếng Việt tương ứng.
// Muốn đổi lựa chọn hoặc giá trị mặc định thì sửa ở file này.

import type { DifficultySetting, QuestionCategory } from '../types/question'

/** Thông tin một dạng bài hiển thị ở trang chủ. */
export interface CategoryOption {
  id: QuestionCategory
  label: string
  description: string
  /** false: chưa làm, hiện mờ kèm nhãn "Sắp có". */
  available: boolean
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'number-series', label: 'Dãy số', description: 'Tìm quy luật, điền số tiếp theo', available: true },
  { id: 'logical', label: 'Suy luận logic', description: 'Tam đoạn luận, sắp xếp thứ tự', available: false },
  { id: 'numerical', label: 'Suy luận số liệu', description: 'Đọc bảng, tính %, tỉ lệ', available: false },
  { id: 'verbal', label: 'Suy luận ngôn ngữ', description: 'Đúng / Sai / Không đủ thông tin', available: false },
  { id: 'abstract', label: 'Suy luận hình', description: 'Ma trận hình 3x3', available: false },
]

/** Các lựa chọn số câu. */
export const QUESTION_COUNT_OPTIONS = [10, 20, 30]

/** Các mức độ khó, kèm nhãn hiển thị. */
export const DIFFICULTY_OPTIONS: { id: DifficultySetting; label: string }[] = [
  { id: 'mixed', label: 'Hỗn hợp' },
  { id: 'easy', label: 'Dễ' },
  { id: 'medium', label: 'Trung bình' },
  { id: 'hard', label: 'Khó' },
]

/** Một mức tốc độ: số giây cho mỗi câu, hoặc null nếu không giới hạn thời gian. */
export interface SpeedOption {
  id: string
  label: string
  secondsPerQuestion: number | null
}

export const SPEED_OPTIONS: SpeedOption[] = [
  { id: 'relaxed', label: 'Thoải mái · 60 giây/câu', secondsPerQuestion: 60 },
  { id: 'standard', label: 'Chuẩn · 45 giây/câu', secondsPerQuestion: 45 },
  { id: 'pressure', label: 'Áp lực · 30 giây/câu', secondsPerQuestion: 30 },
  { id: 'unlimited', label: 'Không giới hạn', secondsPerQuestion: null },
]

/** Giá trị mặc định khi mở trang chủ. */
export const DEFAULTS = {
  category: 'number-series' as QuestionCategory,
  questionCount: 10,
  difficulty: 'mixed' as DifficultySetting,
  speedId: 'standard',
}

/** Lấy nhãn tiếng Việt của một dạng bài. */
export function getCategoryLabel(id: QuestionCategory): string {
  return CATEGORY_OPTIONS.find((c) => c.id === id)?.label ?? id
}

/** Lấy nhãn tiếng Việt của một mức độ khó. */
export function getDifficultyLabel(id: DifficultySetting): string {
  return DIFFICULTY_OPTIONS.find((d) => d.id === id)?.label ?? id
}
