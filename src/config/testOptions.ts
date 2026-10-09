// Danh sách các lựa chọn ở trang chủ (dạng bài, số câu, độ khó, tốc độ) và nhãn tiếng Việt tương ứng.
// Muốn đổi lựa chọn hoặc giá trị mặc định thì sửa ở file này.

import type { DifficultySetting, QuestionCategory, TestConfig } from '../types/question'

/** Thông tin một dạng bài hiển thị ở trang chủ. */
export interface CategoryOption {
  id: QuestionCategory
  label: string
  description: string
  /** false: chưa làm, hiện mờ kèm nhãn "Sắp có". */
  available: boolean
  /**
   * Hệ số thời gian so với mức chuẩn của Dãy số. Dạng cần đọc/tính nhiều thì hệ số lớn hơn.
   * Ví dụ hệ số 2: mức "Chuẩn" 45 giây/câu thành 90 giây/câu.
   */
  timeMultiplier: number
  /**
   * Danh sách số câu riêng cho dạng này; bỏ trống thì dùng QUESTION_COUNT_OPTIONS.
   * Dạng dùng ngân hàng câu hỏi có hạn chỉ cho chọn ít câu để đỡ lặp câu giữa các lần làm.
   */
  questionCounts?: number[]
}

export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: 'number-series',
    label: 'Dãy số',
    description: 'Tìm quy luật, điền số tiếp theo',
    available: true,
    timeMultiplier: 1,
  },
  {
    id: 'numerical',
    label: 'Suy luận số liệu',
    description: 'Đọc bảng, tính %, tỉ lệ',
    available: true,
    // Phải đọc bảng và tính toán: bài SHL thật cho khoảng 1–1,5 phút mỗi câu
    timeMultiplier: 2,
  },
  {
    id: 'logical',
    label: 'Suy luận logic',
    description: 'Tam đoạn luận, sắp xếp thứ tự',
    available: true,
    // Câu xếp chỗ ngồi khó thường mất 1–2 phút
    timeMultiplier: 2,
    // Ngân hàng 40 câu: chỉ cho chọn 10 hoặc 20 câu để đỡ lặp
    questionCounts: [10, 20],
  },
  {
    id: 'verbal',
    label: 'Suy luận ngôn ngữ',
    description: 'Đúng / Sai / Không đủ thông tin',
    available: true,
    // Nhận định gom theo đoạn văn, đọc một lần trả lời nhiều câu: bài SHL thật khoảng 40 giây mỗi nhận định
    timeMultiplier: 1,
    // Ngân hàng 40 nhận định: chỉ cho chọn 10 hoặc 20 câu để đỡ lặp
    questionCounts: [10, 20],
  },
  // Các dạng chưa làm: hệ số thời gian sẽ chốt khi làm tới
  { id: 'abstract', label: 'Suy luận hình', description: 'Ma trận hình 3x3', available: false, timeMultiplier: 1 },
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

/**
 * Một mức tốc độ. Số giây ở đây là mức GỐC (cho Dãy số);
 * số giây thực tế = mức gốc × hệ số thời gian của dạng bài. null nghĩa là không giới hạn.
 */
export interface SpeedOption {
  id: string
  name: string
  baseSecondsPerQuestion: number | null
}

export const SPEED_OPTIONS: SpeedOption[] = [
  { id: 'relaxed', name: 'Thoải mái', baseSecondsPerQuestion: 60 },
  { id: 'standard', name: 'Chuẩn', baseSecondsPerQuestion: 45 },
  { id: 'pressure', name: 'Áp lực', baseSecondsPerQuestion: 30 },
  { id: 'unlimited', name: 'Không giới hạn', baseSecondsPerQuestion: null },
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

/** Một lựa chọn số câu ở trang chủ, kèm trạng thái khóa. */
export interface QuestionCountChoice {
  count: number
  /** true: ngân hàng không đủ câu cho lựa chọn này, hiện mờ và không bấm được. */
  disabled: boolean
}

/**
 * Danh sách lựa chọn số câu cho một dạng bài, khóa các lựa chọn vượt quá số câu hiện có.
 * @param category Dạng bài.
 * @param available Số câu hiện có (theo độ khó đang chọn); null nghĩa là không giới hạn.
 */
export function getQuestionCountChoices(category: QuestionCategory, available: number | null): QuestionCountChoice[] {
  const counts = CATEGORY_OPTIONS.find((c) => c.id === category)?.questionCounts ?? QUESTION_COUNT_OPTIONS
  return counts.map((count) => ({ count, disabled: available !== null && count > available }))
}

/**
 * Chọn số câu hợp lệ: giữ nguyên lựa chọn hiện tại nếu còn dùng được.
 * Nếu không (đổi dạng bài / độ khó làm lựa chọn cũ bị khóa hoặc không có trong danh sách):
 * lấy lựa chọn lớn nhất còn mở mà không vượt quá số câu đang chọn; không có thì lấy lựa chọn nhỏ nhất còn mở.
 * Ví dụ: đang chọn 30 câu Dãy số, chuyển sang Logic (10/20) → 20 câu.
 * @returns Số câu hợp lệ, hoặc null nếu mọi lựa chọn đều bị khóa.
 */
export function resolveQuestionCount(current: number, choices: QuestionCountChoice[]): number | null {
  const enabled = choices.filter((c) => !c.disabled).map((c) => c.count)
  if (enabled.length === 0) return null
  if (enabled.includes(current)) return current
  const notLarger = enabled.filter((n) => n <= current)
  return notLarger.length > 0 ? Math.max(...notLarger) : Math.min(...enabled)
}

/** Lấy hệ số thời gian của một dạng bài (không tìm thấy thì coi là 1). */
function getTimeMultiplier(category: QuestionCategory): number {
  return CATEGORY_OPTIONS.find((c) => c.id === category)?.timeMultiplier ?? 1
}

/**
 * Số giây mỗi câu của một mức tốc độ, đã nhân hệ số của dạng bài.
 * Ví dụ: mức 'standard' (45 giây) với dạng Số liệu (hệ số 2) → 90.
 * @returns Số giây, hoặc null nếu mức tốc độ là không giới hạn.
 */
export function getSecondsPerQuestion(speed: SpeedOption, category: QuestionCategory): number | null {
  return speed.baseSecondsPerQuestion === null ? null : speed.baseSecondsPerQuestion * getTimeMultiplier(category)
}

/** Nhãn hiển thị của mức tốc độ theo dạng bài, ví dụ 'Chuẩn · 90 giây/câu'. */
export function getSpeedLabel(speed: SpeedOption, category: QuestionCategory): string {
  const seconds = getSecondsPerQuestion(speed, category)
  return seconds === null ? speed.name : `${speed.name} · ${seconds} giây/câu`
}

/**
 * Tìm lại mức tốc độ từ cấu hình lần làm trước (tổng thời gian ÷ số câu ÷ hệ số dạng bài),
 * để trang chủ giữ đúng lựa chọn cũ. Không khớp mức nào thì dùng mặc định.
 */
export function findSpeedId(config: TestConfig | null): string {
  if (!config) return DEFAULTS.speedId
  const match = SPEED_OPTIONS.find((s) => {
    const seconds = getSecondsPerQuestion(s, config.category)
    return seconds === null ? config.timeLimitSec === null : seconds * config.questionCount === config.timeLimitSec
  })
  return match?.id ?? DEFAULTS.speedId
}
