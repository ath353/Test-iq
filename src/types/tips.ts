// Kiểu dữ liệu cho nội dung trang "Bí kíp" (src/data/tips.json): lộ trình cho người mới, bí kíp chung, bí kíp từng dạng.

import type { QuestionCategory } from './question'

/** Một nhóm mẹo có tiêu đề, ví dụ "Bẫy hay gặp" với danh sách các ý. */
export interface TipSection {
  /** Mã duy nhất trong phạm vi chứa nó, ví dụ 'traps'. */
  id: string
  title: string
  /** Các ý, mỗi ý một câu hoặc một đoạn ngắn. */
  items: string[]
}

/** Một giai đoạn trong lộ trình ôn tập, ví dụ "Ngày 1: Làm quen". */
export interface PlanPhase {
  id: string
  /** Khoảng ngày, ví dụ 'Ngày 2–5'. */
  days: string
  title: string
  /** Mục tiêu của giai đoạn (1 câu). */
  goal: string
  /** Việc cần làm, theo thứ tự. */
  tasks: string[]
}

/** Lộ trình ôn tập cho người mới bắt đầu. */
export interface BeginnerPlan {
  intro: string
  phases: PlanPhase[]
  /** Dấu hiệu đã sẵn sàng đi thi. */
  readiness: TipSection
  /** Phiên bản rút gọn khi chỉ còn ít ngày. */
  shortPlan: TipSection
}

/** Bí kíp của một dạng bài. */
export interface CategoryTips {
  /** Một câu tóm tắt dạng bài hỏi gì. */
  summary: string
  sections: TipSection[]
}

/** Toàn bộ nội dung trang Bí kíp. */
export interface TipsContent {
  beginnerPlan: BeginnerPlan
  /** Bí kíp dùng cho mọi dạng (thời gian, đoán đáp án, ngày thi…). */
  general: TipSection[]
  /** Bí kíp theo từng dạng bài; mỗi dạng đang có trên trang chủ đều phải có. */
  categories: Record<QuestionCategory, CategoryTips>
}
