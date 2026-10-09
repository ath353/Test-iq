// Bộ sinh câu hỏi dạng Suy luận số liệu (Numerical reasoning).
// Mỗi câu gồm 2 phần:
//   1. Bộ dữ liệu (Dataset): một bối cảnh (doanh thu, nhân sự…) + bảng số ngẫu nhiên 4 dòng × 4 cột.
//   2. Kiểu câu hỏi (QuestionKind): phép tính trên bảng (chênh lệch, tổng, % thay đổi…).
// Mỗi kiểu câu hỏi tự tính đáp án, lời giải từng bước và các "lỗi sai thường gặp" làm đáp án nhiễu.

import type { Difficulty, Option, Question, TableStimulus } from '../types/question'
import { formatNumber, formatPercent, roundTo } from '../utils/format'
import { pickOne, randomInt, shuffle } from '../utils/random'

// ─────────────────────────────── Bối cảnh & bộ dữ liệu ───────────────────────────────

/** Một bối cảnh số liệu: mô tả bảng và cách gọi tên trong câu hỏi. */
export interface DataContext {
  /** Tên bảng. */
  title: string
  /** Đơn vị, ví dụ 'tỷ đồng'. */
  unit: string
  /** Đại lượng, viết thường, ví dụ 'doanh thu'. */
  measure: string
  /** Tiêu đề cột đầu tiên, ví dụ 'Chi nhánh'. */
  entityHeader: string
  /** Tiền tố khi gọi tên một dòng trong câu, ví dụ 'chi nhánh' → 'chi nhánh Hà Nội'. */
  entityPrefix: string
  /** Danh sách tên dòng để chọn ngẫu nhiên. */
  entityPool: string[]
  /** Tên cột thời gian trong bảng, ví dụ ['Quý 1', 'Quý 2'…]. */
  periods: string[]
  /** Tên kỳ khi đặt trong câu (viết thường), ví dụ ['quý 1', 'quý 2'…]. */
  periodPhrases: string[]
  /** Đơn vị kỳ, ví dụ 'quý' (dùng trong "trung bình mỗi quý"). */
  periodUnit: string
  /** Khoảng giá trị ban đầu của mỗi dòng. */
  min: number
  max: number
}

export const CONTEXTS: DataContext[] = [
  {
    title: 'Doanh thu theo quý của các chi nhánh năm 2025',
    unit: 'tỷ đồng',
    measure: 'doanh thu',
    entityHeader: 'Chi nhánh',
    entityPrefix: 'chi nhánh',
    entityPool: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Nha Trang'],
    periods: ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'],
    periodPhrases: ['quý 1', 'quý 2', 'quý 3', 'quý 4'],
    periodUnit: 'quý',
    min: 200,
    max: 2500,
  },
  {
    title: 'Số nhân viên của các phòng ban qua các năm',
    unit: 'người',
    measure: 'số nhân viên',
    entityHeader: 'Phòng ban',
    entityPrefix: 'phòng',
    entityPool: ['Kinh doanh', 'Kỹ thuật', 'Marketing', 'Nhân sự', 'Kế toán', 'Chăm sóc khách hàng'],
    periods: ['2022', '2023', '2024', '2025'],
    periodPhrases: ['năm 2022', 'năm 2023', 'năm 2024', 'năm 2025'],
    periodUnit: 'năm',
    min: 20,
    max: 300,
  },
  {
    title: 'Số sản phẩm bán ra theo tháng của cửa hàng',
    unit: 'sản phẩm',
    measure: 'số sản phẩm bán ra',
    entityHeader: 'Mặt hàng',
    entityPrefix: 'mặt hàng',
    entityPool: ['Máy lọc nước', 'Nồi chiên', 'Quạt điện', 'Máy hút bụi', 'Bếp từ', 'Máy xay'],
    periods: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4'],
    periodPhrases: ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4'],
    periodUnit: 'tháng',
    min: 150,
    max: 1800,
  },
  {
    title: 'Lượng khách du lịch đến một số tỉnh',
    unit: 'nghìn lượt',
    measure: 'lượng khách du lịch',
    entityHeader: 'Tỉnh',
    entityPrefix: 'tỉnh',
    entityPool: ['Quảng Ninh', 'Lào Cai', 'Khánh Hòa', 'Lâm Đồng', 'Kiên Giang', 'Thừa Thiên Huế'],
    periods: ['2022', '2023', '2024', '2025'],
    periodPhrases: ['năm 2022', 'năm 2023', 'năm 2024', 'năm 2025'],
    periodUnit: 'năm',
    min: 80,
    max: 900,
  },
]

/** Bộ dữ liệu của một câu: bối cảnh + tên dòng + giá trị. values[dòng][cột]. */
export interface Dataset {
  context: DataContext
  entities: string[]
  values: number[][]
}

/** Số dòng của mỗi bảng. */
const ENTITY_COUNT = 4

/**
 * Sinh bộ dữ liệu ngẫu nhiên: chọn bối cảnh, chọn 4 tên dòng, sinh giá trị.
 * Mỗi dòng có giá trị đầu ngẫu nhiên, các kỳ sau thay đổi từ −15% đến +20% so với kỳ trước
 * (giống số liệu kinh doanh thật: không nhảy quá xa), và không bao giờ bằng nhau giữa 2 kỳ liền kề.
 */
export function buildDataset(context: DataContext = pickOne(CONTEXTS)): Dataset {
  const entities = shuffle(context.entityPool).slice(0, ENTITY_COUNT)
  const values = entities.map(() => {
    const row = [randomInt(context.min, context.max)]
    for (let i = 1; i < context.periods.length; i++) {
      let next = row[i - 1]
      // Lặp lại cho đến khi giá trị khác kỳ trước (tránh câu hỏi "chênh lệch = 0")
      while (next === row[i - 1]) next = Math.round(row[i - 1] * (1 + randomInt(-15, 20) / 100))
      row.push(Math.max(1, next))
    }
    return row
  })
  return { context, entities, values }
}

/** Chuyển bộ dữ liệu thành bảng để hiển thị. */
export function toTable(ds: Dataset): TableStimulus {
  return {
    type: 'table',
    title: ds.context.title,
    headers: [ds.context.entityHeader, ...ds.context.periods],
    rows: ds.entities.map((name, r) => [name, ...ds.values[r].map((v) => formatNumber(v))]),
    note: `Đơn vị: ${ds.context.unit}. Số liệu giả định, chỉ dùng để luyện tập.`,
  }
}

// ─────────────────────────────── Hàm hỗ trợ ───────────────────────────────

/** Viết hoa chữ cái đầu: 'doanh thu' → 'Doanh thu'. */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Tổng các số trong mảng. */
function sum(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0)
}

/** Chọn 2 vị trí khác nhau i < j trong khoảng [0, n). */
function pickTwoOrdered(n: number): [number, number] {
  const i = randomInt(0, n - 2)
  const j = randomInt(i + 1, n - 1)
  return [i, j]
}

/** Phần câu hỏi do một kiểu câu hỏi tạo ra. null nghĩa là bộ dữ liệu này không hợp, cần sinh lại. */
export interface QuestionParts {
  prompt: string
  /** Đáp án đúng, đã định dạng để hiển thị. */
  answer: string
  /** Đúng 4 (hoặc 3) đáp án nhiễu, đã định dạng, không trùng nhau và không trùng đáp án. */
  distractors: string[]
  steps: string[]
}

/**
 * Tạo 4 đáp án nhiễu dạng số: ưu tiên lỗi sai thường gặp, thiếu thì lấy số lệch 5–25% so với đáp án.
 * Đáp án nhiễu phải cách đáp án đúng một khoảng tối thiểu, để người làm cẩn thận không bị "hên xui"
 * giữa hai đáp án chỉ lệch nhau do làm tròn.
 * @param answer Đáp án đúng (đã làm tròn).
 * @param mistakes Các lỗi sai thường gặp (chưa làm tròn).
 * @param decimals Số chữ số thập phân khi hiển thị.
 * @param format Hàm định dạng để hiển thị (số hoặc phần trăm).
 * @returns 4 chuỗi đáp án nhiễu.
 */
export function buildNumericDistractors(
  answer: number,
  mistakes: number[],
  decimals: number,
  format: (n: number) => string,
): string[] {
  const minGap = Math.max(3 * 10 ** -decimals, Math.abs(answer) * 0.03)
  const used = new Set([format(answer)])
  const result: string[] = []

  /** Thêm một số nếu hợp lệ: dương, đủ xa đáp án, chưa trùng (sau khi định dạng). */
  const tryAdd = (n: number) => {
    const value = roundTo(n, decimals)
    const text = format(value)
    if (result.length >= 4 || !Number.isFinite(value) || value <= 0) return
    if (Math.abs(value - answer) < minGap || used.has(text)) return
    used.add(text)
    result.push(text)
  }

  for (const m of shuffle(mistakes)) tryAdd(m)
  // Bổ sung số lệch ngẫu nhiên; nới rộng dần để chắc chắn luôn đủ 4
  for (let spread = 25; result.length < 4; spread += 5) {
    tryAdd(answer * (1 + (pickOne([-1, 1]) * randomInt(5, spread)) / 100))
  }
  return result
}

// ─────────────────────────────── Các kiểu câu hỏi ───────────────────────────────

/**
 * CHÊNH LỆCH (dễ): giá trị của một dòng giữa 2 kỳ chênh nhau bao nhiêu.
 * Ví dụ: "Doanh thu của chi nhánh Hà Nội ở quý 3 nhiều hơn quý 1 bao nhiêu tỷ đồng?"
 * Trả về null nếu 2 kỳ bằng nhau (câu hỏi "nhiều hơn 0" vô nghĩa).
 */
export function differenceQuestion(ds: Dataset): QuestionParts | null {
  const { context: c } = ds
  const e = randomInt(0, ds.entities.length - 1)
  const [i, j] = pickTwoOrdered(c.periods.length)
  const a = ds.values[e][i]
  const b = ds.values[e][j]
  const answer = Math.abs(b - a)
  if (answer === 0) return null
  const word = b > a ? 'nhiều hơn' : 'ít hơn'
  const name = `${c.entityPrefix} ${ds.entities[e]}`
  const other = (e + 1) % ds.entities.length
  return {
    prompt: `${capitalize(c.measure)} của ${name} ${c.periodPhrases[j]} ${word} ${c.periodPhrases[i]} bao nhiêu ${c.unit}?`,
    answer: formatNumber(answer),
    // Sai thường gặp: nhìn nhầm dòng khác, nhầm sang kỳ liền kề
    distractors: buildNumericDistractors(
      answer,
      [
        Math.abs(ds.values[other][j] - ds.values[other][i]),
        Math.abs(b - ds.values[e][(j + 1) % c.periods.length]),
        Math.abs(ds.values[e][(i + 1) % c.periods.length] - a),
      ],
      0,
      (n) => formatNumber(n),
    ),
    steps: [
      `Đọc bảng, ${c.measure} của ${name}: ${c.periodPhrases[i]} là ${formatNumber(a)}, ${c.periodPhrases[j]} là ${formatNumber(b)}.`,
      `Chênh lệch: ${formatNumber(Math.max(a, b))} − ${formatNumber(Math.min(a, b))} = ${formatNumber(answer)} ${c.unit}.`,
    ],
  }
}

/**
 * TỔNG (dễ): tổng giá trị của một dòng qua tất cả các kỳ.
 * Ví dụ: "Tổng doanh thu của chi nhánh Đà Nẵng trong 4 quý là bao nhiêu tỷ đồng?"
 */
export function totalQuestion(ds: Dataset): QuestionParts {
  const { context: c } = ds
  const e = randomInt(0, ds.entities.length - 1)
  const row = ds.values[e]
  const answer = sum(row)
  const name = `${c.entityPrefix} ${ds.entities[e]}`
  return {
    prompt: `Tổng ${c.measure} của ${name} trong ${row.length} ${c.periodUnit} là bao nhiêu ${c.unit}?`,
    answer: formatNumber(answer),
    // Sai thường gặp: quên cộng kỳ đầu / kỳ cuối, cộng nhầm dòng khác
    distractors: buildNumericDistractors(
      answer,
      [answer - row[0], answer - row[row.length - 1], sum(ds.values[(e + 1) % ds.entities.length])],
      0,
      (n) => formatNumber(n),
    ),
    steps: [
      `Đọc bảng, ${c.measure} của ${name} qua các ${c.periodUnit}: ${row.map((v) => formatNumber(v)).join('; ')}.`,
      `Cộng lại: ${row.map((v) => formatNumber(v)).join(' + ')} = ${formatNumber(answer)} ${c.unit}.`,
    ],
  }
}

/**
 * PHẦN TRĂM THAY ĐỔI (trung bình): giá trị kỳ sau tăng/giảm bao nhiêu % so với kỳ trước.
 * Công thức: (giá trị mới − giá trị cũ) ÷ giá trị cũ × 100.
 * Trả về null nếu mức thay đổi làm tròn ra 0,0% (câu hỏi "tăng 0%" vô nghĩa).
 */
export function percentChangeQuestion(ds: Dataset): QuestionParts | null {
  const { context: c } = ds
  const e = randomInt(0, ds.entities.length - 1)
  const [i, j] = pickTwoOrdered(c.periods.length)
  const a = ds.values[e][i]
  const b = ds.values[e][j]
  const change = ((b - a) / a) * 100
  const answer = roundTo(Math.abs(change), 1)
  if (answer === 0) return null
  const word = b > a ? 'tăng' : 'giảm'
  const name = `${c.entityPrefix} ${ds.entities[e]}`
  return {
    prompt: `${capitalize(c.measure)} của ${name} ${c.periodPhrases[j]} ${word} bao nhiêu phần trăm so với ${c.periodPhrases[i]}? (làm tròn đến 1 chữ số thập phân)`,
    answer: formatPercent(answer),
    // Sai thường gặp: chia cho giá trị MỚI thay vì giá trị CŨ, tính nhầm cặp kỳ liền kề
    distractors: buildNumericDistractors(
      answer,
      [(Math.abs(b - a) / b) * 100, (Math.abs(b - ds.values[e][Math.max(0, j - 1)]) / ds.values[e][Math.max(0, j - 1)]) * 100],
      1,
      formatPercent,
    ),
    steps: [
      `Đọc bảng, ${c.measure} của ${name}: ${c.periodPhrases[i]} là ${formatNumber(a)}, ${c.periodPhrases[j]} là ${formatNumber(b)}.`,
      `Mức thay đổi: ${formatNumber(b)} − ${formatNumber(a)} = ${formatNumber(b - a)}.`,
      `Chia cho giá trị kỳ GỐC (${c.periodPhrases[i]}): ${formatNumber(Math.abs(b - a))} ÷ ${formatNumber(a)} × 100 ≈ ${formatPercent(answer)}.`,
    ],
  }
}

/**
 * TRUNG BÌNH (trung bình): giá trị trung bình mỗi kỳ của một dòng.
 */
export function averageQuestion(ds: Dataset): QuestionParts {
  const { context: c } = ds
  const e = randomInt(0, ds.entities.length - 1)
  const row = ds.values[e]
  const total = sum(row)
  const answer = roundTo(total / row.length, 1)
  const name = `${c.entityPrefix} ${ds.entities[e]}`
  return {
    prompt: `Trung bình mỗi ${c.periodUnit}, ${c.measure} của ${name} là bao nhiêu ${c.unit}? (làm tròn đến 1 chữ số thập phân)`,
    answer: formatNumber(answer, 1),
    // Sai thường gặp: chia nhầm số kỳ, lấy trung bình của giá trị lớn nhất và nhỏ nhất
    distractors: buildNumericDistractors(
      answer,
      [total / (row.length - 1), (Math.max(...row) + Math.min(...row)) / 2, total / (row.length + 1)],
      1,
      (n) => formatNumber(n, 1),
    ),
    steps: [
      `Tổng ${row.length} ${c.periodUnit}: ${row.map((v) => formatNumber(v)).join(' + ')} = ${formatNumber(total)}.`,
      `Chia cho số ${c.periodUnit}: ${formatNumber(total)} ÷ ${row.length} ≈ ${formatNumber(answer, 1)} ${c.unit}.`,
    ],
  }
}

/**
 * TỈ TRỌNG (trung bình): một dòng chiếm bao nhiêu % tổng cả cột trong một kỳ.
 */
export function shareQuestion(ds: Dataset): QuestionParts {
  const { context: c } = ds
  const e = randomInt(0, ds.entities.length - 1)
  const p = randomInt(0, c.periods.length - 1)
  const value = ds.values[e][p]
  const column = ds.values.map((row) => row[p])
  const total = sum(column)
  const answer = roundTo((value / total) * 100, 1)
  const name = `${c.entityPrefix} ${ds.entities[e]}`
  return {
    prompt: `${c.periodPhrases[p].charAt(0).toUpperCase() + c.periodPhrases[p].slice(1)}, ${c.measure} của ${name} chiếm bao nhiêu phần trăm tổng ${c.measure} của cả ${ds.entities.length} ${c.entityPrefix}? (làm tròn đến 1 chữ số thập phân)`,
    answer: formatPercent(answer),
    // Sai thường gặp: chia cho tổng các dòng CÒN LẠI, chia cho tổng cả dòng (theo thời gian)
    distractors: buildNumericDistractors(
      answer,
      [(value / (total - value)) * 100, (value / sum(ds.values[e])) * 100],
      1,
      formatPercent,
    ),
    steps: [
      `Tổng ${c.measure} của cả ${ds.entities.length} ${c.entityPrefix} ${c.periodPhrases[p]}: ${column.map((v) => formatNumber(v)).join(' + ')} = ${formatNumber(total)}.`,
      `Tỉ trọng của ${name}: ${formatNumber(value)} ÷ ${formatNumber(total)} × 100 ≈ ${formatPercent(answer)}.`,
    ],
  }
}

/** Khoảng cách tối thiểu (điểm %) giữa mức tăng trưởng cao nhất và cao nhì, để đáp án không gây tranh cãi. */
const MIN_GROWTH_GAP = 1

/**
 * TĂNG TRƯỞNG CAO NHẤT (khó): dòng nào tăng trưởng % cao nhất từ kỳ đầu đến kỳ cuối.
 * Bẫy: dòng tăng nhiều nhất về SỐ TUYỆT ĐỐI chưa chắc tăng nhiều nhất về PHẦN TRĂM.
 * Đáp án là tên dòng (4 lựa chọn). Trả về null nếu hai mức cao nhất quá sát nhau.
 */
export function highestGrowthQuestion(ds: Dataset): QuestionParts | null {
  const { context: c } = ds
  const last = c.periods.length - 1
  const growths = ds.values.map((row) => ((row[last] - row[0]) / row[0]) * 100)
  const sorted = [...growths].sort((x, y) => y - x)
  if (sorted[0] - sorted[1] < MIN_GROWTH_GAP) return null

  const best = growths.indexOf(sorted[0])
  const nameOf = (r: number) => `${c.entityPrefix} ${ds.entities[r]}`
  return {
    prompt: `${capitalize(c.entityPrefix)} nào có ${c.measure} tăng trưởng (tính theo phần trăm) cao nhất từ ${c.periodPhrases[0]} đến ${c.periodPhrases[last]}?`,
    answer: capitalize(nameOf(best)),
    distractors: ds.entities.map((_, r) => r).filter((r) => r !== best).map((r) => capitalize(nameOf(r))),
    steps: [
      `Tính mức tăng trưởng của từng ${c.entityPrefix}: (${c.periodPhrases[last]} − ${c.periodPhrases[0]}) ÷ ${c.periodPhrases[0]} × 100.`,
      ...ds.values.map(
        (row, r) =>
          `${capitalize(nameOf(r))}: (${formatNumber(row[last])} − ${formatNumber(row[0])}) ÷ ${formatNumber(row[0])} × 100 ≈ ${formatPercent(growths[r])}.`,
      ),
      `Cao nhất: ${capitalize(nameOf(best))}.`,
    ],
  }
}

/**
 * DỰ BÁO (khó): nếu kỳ tiếp theo thay đổi cùng tỉ lệ % như giữa 2 kỳ gần nhất, giá trị sẽ là bao nhiêu.
 * Công thức: giá trị cuối × (1 + tỉ lệ thay đổi). Tính bằng giá trị chưa làm tròn, làm tròn ở bước cuối.
 */
export function projectionQuestion(ds: Dataset): QuestionParts {
  const { context: c } = ds
  const e = randomInt(0, ds.entities.length - 1)
  const last = c.periods.length - 1
  const a = ds.values[e][last - 1]
  const b = ds.values[e][last]
  const rate = (b - a) / a
  const answer = roundTo(b * (1 + rate), 0)
  const name = `${c.entityPrefix} ${ds.entities[e]}`
  return {
    prompt: `Giả sử ${c.measure} của ${name} ở kỳ tiếp theo thay đổi với cùng tỉ lệ phần trăm như từ ${c.periodPhrases[last - 1]} sang ${c.periodPhrases[last]}. ${capitalize(c.measure)} kỳ tiếp theo sẽ là bao nhiêu ${c.unit}? (làm tròn đến số nguyên)`,
    answer: formatNumber(answer),
    // Sai thường gặp: cộng thêm đúng mức chênh lệch (tư duy tuyến tính), dùng tỉ lệ chia nhầm giá trị mới
    distractors: buildNumericDistractors(
      answer,
      [b + (b - a), b * (1 + (b - a) / b), b * (1 - rate)],
      0,
      (n) => formatNumber(n),
    ),
    steps: [
      `Tỉ lệ thay đổi từ ${c.periodPhrases[last - 1]} sang ${c.periodPhrases[last]}: (${formatNumber(b)} − ${formatNumber(a)}) ÷ ${formatNumber(a)} ≈ ${formatPercent(rate * 100, 2)}.`,
      `Kỳ tiếp theo: ${formatNumber(b)} × (1 ${rate >= 0 ? '+' : '−'} ${formatNumber(Math.abs(rate) * 100, 2)}%) ≈ ${formatNumber(answer)} ${c.unit} (tính bằng tỉ lệ chưa làm tròn).`,
    ],
  }
}

// ─────────────────────────────── Ghép thành câu hỏi ───────────────────────────────

/** Một kiểu câu hỏi: nhận bộ dữ liệu, trả về phần câu hỏi (hoặc null nếu cần sinh lại dữ liệu). */
type QuestionKind = (ds: Dataset) => QuestionParts | null

/** Các kiểu câu hỏi theo độ khó. Thêm kiểu mới thì đăng ký vào đây. */
export const KINDS_BY_DIFFICULTY: Record<Difficulty, QuestionKind[]> = {
  easy: [differenceQuestion, totalQuestion],
  medium: [percentChangeQuestion, averageQuestion, shareQuestion],
  hard: [highestGrowthQuestion, projectionQuestion],
}

/** Nhãn lựa chọn theo thứ tự. */
const OPTION_IDS = ['A', 'B', 'C', 'D', 'E']

/**
 * Sinh một câu hỏi Số liệu hoàn chỉnh.
 * @param id Mã câu hỏi (duy nhất trong bài làm).
 * @param difficulty Độ khó; kiểu câu hỏi được chọn ngẫu nhiên trong nhóm độ khó này.
 * @returns Câu hỏi kèm bảng số liệu, các lựa chọn đã xáo trộn và lời giải từng bước.
 */
export function generateNumericalQuestion(id: string, difficulty: Difficulty): Question {
  const kind = pickOne(KINDS_BY_DIFFICULTY[difficulty])
  // Một số kiểu câu hỏi từ chối bộ dữ liệu không phù hợp (trả về null) → sinh bộ dữ liệu khác
  let dataset = buildDataset()
  let parts = kind(dataset)
  while (parts === null) {
    dataset = buildDataset()
    parts = kind(dataset)
  }

  const values = shuffle([parts.answer, ...parts.distractors])
  const options: Option[] = values.map((content, i) => ({ id: OPTION_IDS[i], content }))

  return {
    id,
    category: 'numerical',
    difficulty,
    instruction: 'Dựa vào bảng số liệu, trả lời câu hỏi:',
    stimulus: toTable(dataset),
    prompt: parts.prompt,
    options,
    correctOptionId: OPTION_IDS[values.indexOf(parts.answer)],
    explanationSteps: parts.steps,
  }
}

/**
 * Sinh một bộ câu hỏi Số liệu, không có hai câu trùng đề.
 * @param count Số câu hỏi.
 * @param difficulty Độ khó cố định; bỏ trống thì mỗi câu lấy độ khó ngẫu nhiên.
 * @returns Danh sách câu hỏi với mã 'nr-1', 'nr-2', …
 */
export function generateNumericalQuestions(count: number, difficulty?: Difficulty): Question[] {
  const questions: Question[] = []
  // Đề trùng = cùng câu hỏi trên cùng bảng; khóa so sánh gồm cả câu hỏi lẫn dữ liệu bảng
  const used = new Set<string>()
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard']

  while (questions.length < count) {
    const question = generateNumericalQuestion(`nr-${questions.length + 1}`, difficulty ?? pickOne(difficulties))
    const key = question.prompt + JSON.stringify(question.stimulus)
    if (used.has(key)) continue
    used.add(key)
    questions.push(question)
  }
  return questions
}
