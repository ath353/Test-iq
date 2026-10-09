// Kiểu dữ liệu dùng chung cho câu hỏi, bài làm và kết quả.
// Mọi bộ sinh đề (generators) và ngân hàng câu hỏi (data) đều phải trả về đúng các kiểu này.

/** Dạng bài. Thêm dạng mới thì bổ sung vào đây. */
export type QuestionCategory =
  | 'number-series' // Dãy số
  | 'logical' // Suy luận logic
  | 'numerical' // Suy luận số liệu
  | 'verbal' // Suy luận ngôn ngữ
  | 'abstract' // Suy luận hình

/** Mức độ khó của câu hỏi. */
export type Difficulty = 'easy' | 'medium' | 'hard'

/** Độ khó người dùng chọn cho cả bài: một mức cố định, hoặc 'mixed' (mỗi câu một mức ngẫu nhiên). */
export type DifficultySetting = Difficulty | 'mixed'

/** Một lựa chọn đáp án (A, B, C…). */
export interface Option {
  /** Mã lựa chọn, duy nhất trong một câu hỏi, ví dụ 'A'. */
  id: string
  /** Nội dung hiển thị, ví dụ '42'. */
  content: string
}

/**
 * Dữ kiện dạng BẢNG SỐ LIỆU (dạng Số liệu). Mọi ô đều là chuỗi đã định dạng sẵn để hiển thị.
 * Ví dụ: headers ['Quý', 'Doanh thu (tỷ đồng)'], rows [['Q1', '120'], ['Q2', '150']].
 */
export interface TableStimulus {
  type: 'table'
  /** Tên bảng, ví dụ 'Doanh thu công ty A năm 2025'. */
  title: string
  /** Dòng tiêu đề cột. */
  headers: string[]
  /** Các dòng dữ liệu; mỗi dòng có số ô bằng số cột. */
  rows: string[][]
  /** Ghi chú dưới bảng (đơn vị, nguồn…), có thể bỏ trống. */
  note?: string
}

/** Dữ kiện dạng ĐOẠN VĂN (dạng Ngôn ngữ): người làm đọc đoạn văn rồi đánh giá nhận định. */
export interface PassageStimulus {
  type: 'passage'
  /** Nội dung đoạn văn; xuống dòng bằng ký tự \n. */
  text: string
}

/**
 * Phần dữ kiện đi kèm câu hỏi, hiển thị phía trên đề bài.
 * Dạng HÌNH (giai đoạn 2.4a) sẽ được bổ sung vào đây khi thiết kế cách vẽ SVG.
 */
export type Stimulus = TableStimulus | PassageStimulus

/** Một câu hỏi trắc nghiệm hoàn chỉnh. */
export interface Question {
  /** Mã câu hỏi, duy nhất trong một bài làm. */
  id: string
  category: QuestionCategory
  difficulty: Difficulty
  /** Lời dẫn hiển thị phía trên đề, ví dụ 'Tìm số tiếp theo của dãy:'. */
  instruction: string
  /** Dữ kiện kèm theo (bảng, đoạn văn…); dạng Dãy số không có. */
  stimulus?: Stimulus
  /**
   * Đề bài, ví dụ '2, 6, 12, 20, 30, ?'.
   * Đề nhiều dòng (ví dụ các tiền đề của câu Logic) thì xuống dòng bằng ký tự \n.
   */
  prompt: string
  /** Danh sách lựa chọn, đã được xáo trộn thứ tự. */
  options: Option[]
  /** Mã của lựa chọn đúng (trùng với một Option.id). */
  correctOptionId: string
  /**
   * Lời giải từng bước, hiển thị ở màn hình kết quả. Bắt buộc có ít nhất 1 bước, không bước nào rỗng.
   * Ví dụ với đề '2, 6, 12, 20, 30, ?':
   *   [
   *     'Tính hiệu các số liền kề: 4, 6, 8, 10.',
   *     'Hiệu tăng đều 2 đơn vị, nên hiệu tiếp theo là 12.',
   *     'Số cần tìm: 30 + 12 = 42.',
   *   ]
   */
  explanationSteps: string[]
}

/** Cấu hình một bài làm, do người dùng chọn ở trang chủ. */
export interface TestConfig {
  category: QuestionCategory
  /** Số câu hỏi trong bài. */
  questionCount: number
  difficulty: DifficultySetting
  /** Tổng thời gian làm bài, tính bằng giây; null nghĩa là không giới hạn. */
  timeLimitSec: number | null
}

/** Câu trả lời của người dùng cho một câu hỏi. */
export interface UserAnswer {
  questionId: string
  /** Mã lựa chọn đã chọn; null nếu bỏ qua hoặc hết giờ. */
  selectedOptionId: string | null
}

/** Kết quả sau khi nộp bài. */
export interface TestResult {
  config: TestConfig
  questions: Question[]
  answers: UserAnswer[]
  /** Số câu đúng. */
  correctCount: number
  /** Thời gian thực tế đã dùng, tính bằng giây. */
  durationSec: number
  /** true nếu bài được tự động nộp do hết giờ. */
  timedOut: boolean
  /** Thời điểm nộp bài, dạng chuỗi ISO (để lưu localStorage được). */
  finishedAt: string
}
