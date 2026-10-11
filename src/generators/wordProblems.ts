// Bộ sinh câu hỏi dạng Toán đố (word problems): phần trăm, chia tỉ lệ, tuổi, năng suất, chuyển động, vòi nước…
// Cách sinh: chọn ĐÁP ÁN ĐẸP trước (số nguyên hoặc 1 chữ số thập phân), rồi tính ngược ra số liệu trong đề,
// để đề luôn tính tay được như bài thi thật. Đáp án nhiễu ưu tiên "lỗi sai thường gặp" của từng kiểu bài.

import type { Difficulty, Option, Question } from '../types/question'
import { formatNumber } from '../utils/format'
import { pickOne, randomInt, shuffle } from '../utils/random'
import { buildNumericDistractors } from './numerical'

// ─────────────────────────────── Kiểu dữ liệu & tiện ích ───────────────────────────────

/** Mã các kiểu bài; test dùng mã này để chọn công thức giải lại tương ứng. */
export type WordKindId =
  | 'percent-discount'
  | 'ratio-split'
  | 'age-sum'
  | 'average-needed'
  | 'work-together'
  | 'meet-up'
  | 'age-future'
  | 'cost-from-profit'
  | 'catch-up'
  | 'fill-drain'
  | 'successive-discount'
  | 'average-speed'

/** Phần câu hỏi do một kiểu bài tạo ra. */
export interface WordProblemParts {
  kind: WordKindId
  /** Các con số xuất hiện trong đề (để test giải lại độc lập). */
  params: Record<string, number>
  prompt: string
  /** Đáp án đúng (đã là số đẹp, chưa định dạng). */
  answer: number
  /** Số chữ số thập phân khi hiển thị đáp án và các lựa chọn. */
  decimals: number
  /** Giá trị lớn nhất hợp lý của đáp án nhiễu (không bắt buộc), ví dụ 10 với điểm thang 10. */
  max?: number
  /** Đơn vị ghi sau số, ví dụ 'tuổi', 'giờ', '%'. */
  unit: string
  /** Kết quả của các lỗi sai thường gặp (chưa làm tròn), dùng làm đáp án nhiễu. */
  mistakes: number[]
  steps: string[]
}

/** Viết số trong đề / lời giải: số nguyên không có phần thập phân, số lẻ giữ tối đa 2 chữ số. */
export function fmt(n: number): string {
  if (Number.isInteger(n)) return formatNumber(n)
  return formatNumber(n, Number.isInteger(n * 10) ? 1 : 2)
}

/** Ghép số với đơn vị: '%' viết liền, đơn vị khác cách một dấu cách. */
export function withUnit(text: string, unit: string): string {
  return unit === '%' ? `${text}%` : `${text} ${unit}`
}

/** Số có phải "số đẹp" không: nhân 10 ra số nguyên (tối đa 1 chữ số thập phân). */
function isNice(n: number): boolean {
  return Math.abs(n * 10 - Math.round(n * 10)) < 1e-9
}

/** Ước chung lớn nhất (dùng để chọn tỉ lệ tối giản). */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/** Tên người dùng trong đề (chọn ngẫu nhiên cho đa dạng). */
const NAMES = ['An', 'Bình', 'Chi', 'Dũng', 'Hà', 'Hùng', 'Lan', 'Minh', 'Nam', 'Ngọc', 'Phương', 'Quân', 'Thảo', 'Tuấn']

/** Chọn 2 tên khác nhau. */
function pickTwoNames(): [string, string] {
  const [a, b] = shuffle(NAMES)
  return [a, b]
}

/** Mặt hàng cho bài giảm giá / lãi lỗ. */
const ITEMS = ['chiếc áo khoác', 'đôi giày', 'chiếc túi xách', 'bộ bàn ghế', 'chiếc quạt điện', 'cái nồi cơm điện', 'chiếc ba lô']

/**
 * Cặp địa điểm cho bài chuyển động. Dùng tên chung chung (A – B) thay vì tên thành phố thật,
 * vì quãng đường sinh ngẫu nhiên có thể sai lệch với thực tế (ví dụ "Hà Nội – Nam Định dài 345 km").
 */
const ROUTES = [
  ['A', 'B'],
  ['thành phố A', 'thành phố B'],
  ['bến A', 'bến B'],
  ['tỉnh A', 'tỉnh B'],
  ['M', 'N'],
]

/**
 * Liệt kê các cặp (a, b), a < b ≤ max, mà phép tính f(a, b) ra số nguyên dương.
 * Dùng cho bài năng suất / vòi nước / vận tốc trung bình để đáp án luôn đẹp.
 */
function nicePairs(values: number[], f: (a: number, b: number) => number): [number, number][] {
  const pairs: [number, number][] = []
  for (const a of values) {
    for (const b of values) {
      if (a >= b) continue
      const r = f(a, b)
      if (r > 0 && Number.isInteger(r)) pairs.push([a, b])
    }
  }
  return pairs
}

/** Dãy số nguyên từ from đến to với bước step. */
function range(from: number, to: number, step = 1): number[] {
  const result: number[] = []
  for (let n = from; n <= to; n += step) result.push(n)
  return result
}

// Tính sẵn các cặp số cho đáp án nguyên (chỉ tính một lần khi nạp file)
/** Năng suất chung: a·b/(a+b) nguyên. Ví dụ (6, 12) → 4 ngày. */
const WORK_PAIRS = nicePairs(range(3, 30), (a, b) => (a * b) / (a + b))
/** Vòi chảy vào a giờ, vòi xả b giờ: a·b/(b−a) nguyên. Ví dụ (4, 6) → 12 giờ. */
const FILL_DRAIN_PAIRS = nicePairs(range(2, 15), (a, b) => (a * b) / (b - a)).filter(([a, b]) => (a * b) / (b - a) <= 40)
/** Vận tốc trung bình đi – về: 2·v1·v2/(v1+v2) nguyên. Ví dụ (40, 60) → 48 km/h. */
const SPEED_PAIRS = nicePairs(range(20, 90, 5), (a, b) => (2 * a * b) / (a + b))

// ─────────────────────────────── Mức DỄ ───────────────────────────────

/**
 * PHẦN TRĂM (dễ): giá sau khi giảm d%.
 * Lỗi thường gặp: chỉ tính số tiền được giảm; cộng thêm d% thay vì trừ; trừ thẳng d (nghìn đồng).
 */
export function percentDiscount(): WordProblemParts {
  const price = randomInt(4, 30) * 20 // 80–600 nghìn đồng, bội của 20 để đáp án là số nguyên
  const d = pickOne([10, 15, 20, 25, 30, 35, 40])
  const off = (price * d) / 100
  const answer = price - off
  return {
    kind: 'percent-discount',
    params: { price, d },
    prompt: `Một ${pickOne(ITEMS)} có giá niêm yết ${fmt(price)} nghìn đồng, nay được giảm giá ${d}%. Giá bán sau khi giảm là bao nhiêu?`,
    answer,
    decimals: 0,
    unit: 'nghìn đồng',
    mistakes: [off, price + off, price - d],
    steps: [
      `Số tiền được giảm: ${fmt(price)} × ${d}% = ${fmt(off)} nghìn đồng.`,
      `Giá sau khi giảm: ${fmt(price)} − ${fmt(off)} = ${fmt(answer)} nghìn đồng.`,
    ],
  }
}

/**
 * CHIA THEO TỈ LỆ (dễ): chia tổng số tiền cho 2 người theo tỉ lệ a : b, hỏi phần của người thứ hai.
 * Lỗi thường gặp: ra phần của người thứ nhất; chia đôi; lấy tổng × b / a.
 */
export function ratioSplit(): WordProblemParts {
  let a = 1
  let b = 1
  // Tỉ lệ tối giản, hai phần khác nhau
  while (a === b || gcd(a, b) !== 1) {
    a = randomInt(1, 7)
    b = randomInt(1, 7)
  }
  const unitValue = randomInt(3, 30) * 10 // giá trị 1 phần (nghìn đồng)
  const total = (a + b) * unitValue
  const answer = b * unitValue
  const [first, second] = pickTwoNames()
  return {
    kind: 'ratio-split',
    params: { total, a, b },
    prompt: `Chia ${fmt(total)} nghìn đồng cho ${first} và ${second} theo tỉ lệ ${a} : ${b}. ${second} nhận được bao nhiêu?`,
    answer,
    decimals: 0,
    unit: 'nghìn đồng',
    mistakes: [a * unitValue, total / 2, (total * b) / a],
    steps: [
      `Tổng số phần bằng nhau: ${a} + ${b} = ${a + b} phần.`,
      `Giá trị một phần: ${fmt(total)} : ${a + b} = ${fmt(unitValue)} nghìn đồng.`,
      `${second} nhận ${b} phần: ${b} × ${fmt(unitValue)} = ${fmt(answer)} nghìn đồng.`,
    ],
  }
}

/**
 * TUỔI, MỘT MỐC (dễ): bố gấp m lần tuổi con, tổng hai người S tuổi; hỏi tuổi con.
 * Lỗi thường gặp: S : m (quên tính phần của con); chia đôi; ra tuổi bố.
 */
export function ageSum(): WordProblemParts {
  let child = 0
  let m = 0
  // Bố từ 25 đến 60 tuổi cho hợp lý
  while (m * child < 25 || m * child > 60) {
    child = randomInt(4, 15)
    m = randomInt(3, 6)
  }
  const sum = (m + 1) * child
  const [parent, kid] = pickOne([
    ['bố', 'con'],
    ['mẹ', 'con'],
    ['ông', 'cháu'],
  ])
  return {
    kind: 'age-sum',
    params: { m, sum },
    prompt: `Năm nay tuổi ${parent} gấp ${m} lần tuổi ${kid}. Tổng số tuổi của hai người là ${sum}. Hỏi ${kid} bao nhiêu tuổi?`,
    answer: child,
    decimals: 0,
    unit: 'tuổi',
    mistakes: [sum / m, sum / 2, m * child],
    steps: [
      `Coi tuổi ${kid} là 1 phần thì tuổi ${parent} là ${m} phần; tổng là ${m} + 1 = ${m + 1} phần.`,
      `Tuổi ${kid}: ${sum} : ${m + 1} = ${child} tuổi.`,
    ],
  }
}

/**
 * TRUNG BÌNH (dễ): đã có n bài, trung bình a; bài thứ n+1 cần bao nhiêu điểm để trung bình đạt t.
 * Lỗi thường gặp: chỉ cần t điểm; lấy 2t − a (chỉ "bù" chênh lệch một lần); chia sai số bài.
 */
export function averageNeeded(): WordProblemParts {
  for (;;) {
    const n = randomInt(3, 5)
    const a = randomInt(10, 16) / 2 // 5,0 – 8,0, bước 0,5
    // Cao hơn 0,1 – 0,6 điểm; tính trên số nguyên rồi chia để tránh sai số số thực (7,300000001)
    const t = (a * 10 + randomInt(1, 6)) / 10
    const need = t * (n + 1) - a * n
    // Điểm bài mới phải hợp lệ (≤ 10), cao hơn mục tiêu, và là số đẹp
    if (need > 10 || need <= t || !isNice(need)) continue
    const answer = Math.round(need * 10) / 10
    const name = pickOne(NAMES)
    return {
      kind: 'average-needed',
      params: { n, a, t, total: n + 1 },
      prompt: `Điểm trung bình ${n} bài kiểm tra đầu tiên của ${name} là ${fmt(a)}. Bài thứ ${n + 1}, ${name} cần đạt bao nhiêu điểm để điểm trung bình cả ${n + 1} bài là ${fmt(t)}?`,
      answer,
      decimals: 1,
      unit: 'điểm',
      max: 10, // điểm thang 10: lựa chọn kiểu "11,4 điểm" bị loại ngay, không còn là bẫy
      mistakes: [t, 2 * t - a, t * n - a * (n - 1)],
      steps: [
        `Tổng điểm cần có sau ${n + 1} bài: ${fmt(t)} × ${n + 1} = ${fmt(t * (n + 1))}.`,
        `Tổng điểm ${n} bài đã có: ${fmt(a)} × ${n} = ${fmt(a * n)}.`,
        `Bài thứ ${n + 1} cần: ${fmt(t * (n + 1))} − ${fmt(a * n)} = ${fmt(answer)} điểm.`,
      ],
    }
  }
}

// ─────────────────────────────── Mức TRUNG BÌNH ───────────────────────────────

/**
 * NĂNG SUẤT CHUNG (trung bình): A làm một mình hết a ngày, B hết b ngày; cùng làm hết bao lâu.
 * Lỗi thường gặp: lấy trung bình (a + b) : 2; lấy hiệu b − a; chia đôi người nhanh hơn a : 2.
 */
export function workTogether(): WordProblemParts {
  const [a, b] = pickOne(WORK_PAIRS)
  const answer = (a * b) / (a + b)
  const [first, second] = pickTwoNames()
  const job = pickOne(['sơn xong một bức tường', 'nhập xong một bộ dữ liệu', 'đóng xong một lô hàng', 'dọn xong một kho hàng'])
  return {
    kind: 'work-together',
    params: { a, b },
    prompt: `Nếu làm một mình, ${first} ${job} trong ${a} ngày, còn ${second} mất ${b} ngày. Nếu hai người cùng làm thì mất bao nhiêu ngày?`,
    answer,
    decimals: 0,
    unit: 'ngày',
    mistakes: [(a + b) / 2, b - a, a / 2],
    steps: [
      `Mỗi ngày ${first} làm được 1/${a} công việc, ${second} làm được 1/${b} công việc.`,
      `Mỗi ngày cả hai làm được: 1/${a} + 1/${b} = ${a + b}/${a * b} = 1/${fmt(answer)} công việc.`,
      `Vậy hai người cùng làm hết ${fmt(answer)} ngày.`,
    ],
  }
}

/**
 * GẶP NHAU (trung bình): hai xe xuất phát cùng lúc từ hai đầu quãng đường, đi ngược chiều.
 * Lỗi thường gặp: chia cho hiệu vận tốc; chia cho vận tốc một xe; lấy quãng đường : trung bình vận tốc × 2.
 */
export function meetUp(): WordProblemParts {
  let v1 = 0
  let v2 = 0
  let t = 0
  // Hai vận tốc khác nhau; quãng đường phải là số nguyên km (tránh đề kiểu "287,5 km")
  while (v1 === v2 || !Number.isInteger((v1 + v2) * t)) {
    v1 = randomInt(6, 12) * 5 // 30–60 km/h
    v2 = randomInt(8, 14) * 5 // 40–70 km/h
    t = pickOne([1, 1.5, 2, 2.5, 3])
  }
  const distance = (v1 + v2) * t
  const [from, to] = pickOne(ROUTES)
  return {
    kind: 'meet-up',
    params: { distance, v1, v2 },
    prompt: `Quãng đường ${from} – ${to} dài ${fmt(distance)} km. Cùng một lúc, một ô tô đi từ ${from} với vận tốc ${v1} km/h và một xe máy đi từ ${to} với vận tốc ${v2} km/h, ngược chiều nhau. Sau bao nhiêu giờ hai xe gặp nhau?`,
    answer: t,
    decimals: 1,
    unit: 'giờ',
    mistakes: [distance / Math.abs(v1 - v2), distance / v1, distance / v2],
    steps: [
      `Hai xe đi ngược chiều nên mỗi giờ khoảng cách giảm: ${v1} + ${v2} = ${v1 + v2} km.`,
      `Thời gian để gặp nhau: ${fmt(distance)} : ${v1 + v2} = ${fmt(t)} giờ.`,
    ],
  }
}

/**
 * TUỔI, HAI MỐC (trung bình): hiện nay mẹ gấp r lần con; sau k năm mẹ gấp r2 lần con; hỏi tuổi con hiện nay.
 * Lỗi thường gặp: ra tuổi con sau k năm; ra tuổi mẹ; lấy tuổi con − k.
 */
export function ageFuture(): WordProblemParts {
  for (;;) {
    const child = randomInt(4, 15)
    const r = randomInt(3, 7)
    const k = randomInt(2, 15)
    const mother = r * child
    if (mother < 24 || mother > 55) continue
    const r2 = (mother + k) / (child + k)
    // Tỉ lệ sau k năm phải là số đẹp (nguyên hoặc ,5) và vẫn lớn hơn 1
    if (!Number.isInteger(r2 * 2) || r2 <= 1 || r2 >= r) continue
    const [parent, kid] = pickOne([
      ['mẹ', 'con'],
      ['bố', 'con'],
    ])
    return {
      kind: 'age-future',
      params: { r, k, r2 },
      prompt: `Hiện nay tuổi ${parent} gấp ${r} lần tuổi ${kid}. Sau ${k} năm nữa, tuổi ${parent} gấp ${fmt(r2)} lần tuổi ${kid}. Hỏi ${kid} hiện nay bao nhiêu tuổi?`,
      answer: child,
      decimals: 0,
      unit: 'tuổi',
      mistakes: [child + k, mother, child - k],
      steps: [
        `Gọi tuổi ${kid} hiện nay là x thì tuổi ${parent} là ${r}x.`,
        `Sau ${k} năm: ${r}x + ${k} = ${fmt(r2)} × (x + ${k}).`,
        // Hệ số bằng 1 thì viết thẳng "x = …" (không viết "1x")
        r - r2 === 1
          ? `Chuyển vế: (${r} − ${fmt(r2)})x = ${fmt(r2)} × ${k} − ${k} → x = ${child}.`
          : `Chuyển vế: (${r} − ${fmt(r2)})x = ${fmt(r2)} × ${k} − ${k} → ${fmt(r - r2)}x = ${fmt(r2 * k - k)} → x = ${child}.`,
        `Kiểm tra: hiện nay ${parent} ${mother} tuổi, ${kid} ${child} tuổi; sau ${k} năm là ${mother + k} và ${child + k} (gấp ${fmt(r2)} lần).`,
      ],
    }
  }
}

/**
 * LÃI – LỖ (trung bình): bán giá S thì lãi p% so với giá vốn; hỏi giá vốn.
 * Lỗi thường gặp: lấy S trừ p% của S (S × (100 − p)%); trừ thẳng p; lấy S cộng p%.
 */
export function costFromProfit(): WordProblemParts {
  const p = pickOne([10, 15, 20, 25, 30, 40, 50])
  const cost = randomInt(5, 40) * 20 // 100–800 nghìn đồng
  const sell = (cost * (100 + p)) / 100
  return {
    kind: 'cost-from-profit',
    params: { sell, p },
    prompt: `Một cửa hàng bán ${pickOne(ITEMS)} với giá ${fmt(sell)} nghìn đồng và lãi ${p}% so với giá vốn. Giá vốn của mặt hàng này là bao nhiêu?`,
    answer: cost,
    decimals: 0,
    unit: 'nghìn đồng',
    mistakes: [(sell * (100 - p)) / 100, sell - p, (sell * (100 + p)) / 100],
    steps: [
      `Lãi ${p}% so với giá vốn nghĩa là: giá bán = giá vốn × (100% + ${p}%) = giá vốn × ${fmt((100 + p) / 100)}.`,
      `Giá vốn: ${fmt(sell)} : ${fmt((100 + p) / 100)} = ${fmt(cost)} nghìn đồng.`,
      `Lưu ý: KHÔNG lấy ${fmt(sell)} trừ đi ${p}% của chính giá bán, vì ${p}% được tính trên giá vốn.`,
    ],
  }
}

// ─────────────────────────────── Mức KHÓ ───────────────────────────────

/**
 * ĐUỔI KỊP (khó): xe A đi trước h giờ với vận tốc v1; xe B đuổi theo với v2 > v1; hỏi B đi bao lâu thì đuổi kịp.
 * Lỗi thường gặp: chia cho tổng vận tốc; tính từ lúc xe A xuất phát (cộng thêm h); chia cho v2.
 */
export function catchUp(): WordProblemParts {
  for (;;) {
    const v1 = randomInt(6, 10) * 5 // 30–50 km/h
    const v2 = v1 + randomInt(1, 6) * 5 // nhanh hơn 5–30 km/h
    const h = pickOne([0.5, 1, 1.5, 2])
    const t = (v1 * h) / (v2 - v1)
    // Đáp án đẹp (nguyên hoặc ,5) và không quá dài
    if (!Number.isInteger(t * 2) || t > 6) continue
    const [first, second] = pickTwoNames()
    const gap = v1 * h
    return {
      kind: 'catch-up',
      params: { v1, v2, h },
      prompt: `${first} đi xe máy từ nhà với vận tốc ${v1} km/h. Sau ${fmt(h)} giờ, ${second} xuất phát từ cùng chỗ đó, đi cùng đường với vận tốc ${v2} km/h để đuổi theo. Kể từ lúc ${second} xuất phát, sau bao nhiêu giờ thì ${second} đuổi kịp ${first}?`,
      answer: t,
      decimals: 1,
      unit: 'giờ',
      mistakes: [gap / (v1 + v2), t + h, gap / v2],
      steps: [
        `Khi ${second} xuất phát, ${first} đã đi được: ${v1} × ${fmt(h)} = ${fmt(gap)} km.`,
        `Hai người đi cùng chiều nên mỗi giờ khoảng cách rút ngắn: ${v2} − ${v1} = ${v2 - v1} km.`,
        `Thời gian đuổi kịp: ${fmt(gap)} : ${v2 - v1} = ${fmt(t)} giờ.`,
      ],
    }
  }
}

/**
 * VÒI NƯỚC (khó): vòi chảy vào đầy bể trong a giờ, vòi xả cạn bể trong b giờ (b > a); mở cả hai thì bao lâu đầy.
 * Lỗi thường gặp: coi như cả hai cùng chảy vào a·b/(a+b); lấy hiệu b − a; lấy trung bình.
 */
export function fillDrain(): WordProblemParts {
  const [a, b] = pickOne(FILL_DRAIN_PAIRS)
  const answer = (a * b) / (b - a)
  return {
    kind: 'fill-drain',
    params: { a, b },
    prompt: `Một bể nước rỗng có một vòi chảy vào và một vòi xả ra. Nếu chỉ mở vòi chảy vào thì sau ${a} giờ bể đầy. Nếu bể đầy mà chỉ mở vòi xả thì sau ${b} giờ bể cạn. Mở cả hai vòi cùng lúc khi bể đang rỗng thì sau bao nhiêu giờ bể đầy?`,
    answer,
    decimals: 0,
    unit: 'giờ',
    mistakes: [(a * b) / (a + b), b - a, (a + b) / 2],
    steps: [
      `Mỗi giờ vòi chảy vào được 1/${a} bể, vòi xả ra 1/${b} bể.`,
      `Mỗi giờ mở cả hai, lượng nước tăng: 1/${a} − 1/${b} = ${b - a}/${a * b} = 1/${fmt(answer)} bể.`,
      `Vậy sau ${fmt(answer)} giờ bể đầy.`,
    ],
  }
}

/**
 * GIẢM GIÁ LIÊN TIẾP (khó): giảm d1% rồi giảm tiếp d2% trên giá đã giảm; tổng cộng giảm bao nhiêu %.
 * Lỗi thường gặp: cộng d1 + d2; lấy trung bình; chỉ tính phần trăm còn lại.
 */
export function successiveDiscount(): WordProblemParts {
  const d1 = randomInt(1, 5) * 10 // 10–50%
  const d2 = randomInt(1, 4) * 10 // 10–40%
  const remain = ((100 - d1) * (100 - d2)) / 100
  const answer = 100 - remain
  return {
    kind: 'successive-discount',
    params: { d1, d2 },
    prompt: `Một cửa hàng giảm giá ${d1}% cho một mặt hàng, sau đó giảm tiếp ${d2}% trên giá đã giảm. So với giá ban đầu, mặt hàng đã được giảm tổng cộng bao nhiêu phần trăm?`,
    answer,
    decimals: 0,
    unit: '%',
    mistakes: [d1 + d2, (d1 + d2) / 2, remain],
    steps: [
      `Coi giá ban đầu là 100%. Sau lần giảm ${d1}%, giá còn: 100% − ${d1}% = ${100 - d1}%.`,
      `Lần giảm ${d2}% tính trên giá mới, nên giá còn: ${100 - d1}% × ${fmt((100 - d2) / 100)} = ${fmt(remain)}%.`,
      `Tổng cộng đã giảm: 100% − ${fmt(remain)}% = ${fmt(answer)}% (không phải ${d1}% + ${d2}% = ${d1 + d2}%).`,
    ],
  }
}

/**
 * VẬN TỐC TRUNG BÌNH (khó): đi với v1, về cùng quãng đường với v2; vận tốc trung bình cả đi lẫn về.
 * Lỗi thường gặp: lấy trung bình cộng (v1 + v2) : 2; quên nhân 2 (v1·v2/(v1+v2)); lấy tổng v1 + v2.
 */
export function averageSpeed(): WordProblemParts {
  const [v1, v2] = shuffle(pickOne(SPEED_PAIRS)) // ngẫu nhiên lượt đi nhanh hay chậm
  const answer = (2 * v1 * v2) / (v1 + v2)
  // Chọn quãng đường chia hết cho cả 2 vận tốc để lời giải minh hoạ bằng số cụ thể
  const distance = lcm(v1, v2)
  const [from, to] = pickOne(ROUTES)
  return {
    kind: 'average-speed',
    params: { v1, v2 },
    prompt: `Một người đi ô tô từ ${from} đến ${to} với vận tốc ${v1} km/h, rồi quay về theo đúng đường đó với vận tốc ${v2} km/h. Vận tốc trung bình trên cả quãng đường đi và về là bao nhiêu?`,
    answer,
    decimals: 0,
    unit: 'km/h',
    mistakes: [(v1 + v2) / 2, (v1 * v2) / (v1 + v2), v1 + v2],
    steps: [
      `Vận tốc trung bình = tổng quãng đường : tổng thời gian (KHÔNG phải trung bình cộng hai vận tốc).`,
      `Giả sử quãng đường một chiều dài ${fmt(distance)} km: lượt đi mất ${fmt(distance / v1)} giờ, lượt về mất ${fmt(distance / v2)} giờ.`,
      `Vận tốc trung bình: (${fmt(distance)} × 2) : (${fmt(distance / v1)} + ${fmt(distance / v2)}) = ${fmt(2 * distance)} : ${fmt(distance / v1 + distance / v2)} = ${fmt(answer)} km/h.`,
    ],
  }
}

/** Bội chung nhỏ nhất. */
function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b)
}

// ─────────────────────────────── Ghép thành câu hỏi ───────────────────────────────

/** Các kiểu bài theo độ khó. Thêm kiểu mới thì đăng ký vào đây. */
export const WORD_KINDS_BY_DIFFICULTY: Record<Difficulty, (() => WordProblemParts)[]> = {
  easy: [percentDiscount, ratioSplit, ageSum, averageNeeded],
  medium: [workTogether, meetUp, ageFuture, costFromProfit],
  hard: [catchUp, fillDrain, successiveDiscount, averageSpeed],
}

/** Nhãn lựa chọn theo thứ tự. */
const OPTION_IDS = ['A', 'B', 'C', 'D', 'E']

/**
 * Định dạng một đáp án để hiển thị: số kiểu Việt Nam + đơn vị.
 * @param value Giá trị số.
 * @param parts Phần câu hỏi (lấy số chữ số thập phân và đơn vị).
 */
export function formatAnswer(value: number, parts: Pick<WordProblemParts, 'decimals' | 'unit'>): string {
  return withUnit(formatNumber(value, parts.decimals), parts.unit)
}

/**
 * Sinh một câu Toán đố hoàn chỉnh từ phần câu hỏi đã có.
 * @param id Mã câu hỏi.
 * @param difficulty Độ khó ghi vào câu hỏi.
 * @param parts Kết quả của một kiểu bài.
 */
export function partsToQuestion(id: string, difficulty: Difficulty, parts: WordProblemParts): Question {
  const answerText = formatAnswer(parts.answer, parts)
  const distractors = buildNumericDistractors(parts.answer, parts.mistakes, parts.decimals, (n) => formatAnswer(n, parts), parts.max)
  const values = shuffle([answerText, ...distractors])
  const options: Option[] = values.map((content, i) => ({ id: OPTION_IDS[i], content }))
  return {
    id,
    category: 'word-problem',
    difficulty,
    instruction: 'Đọc đề và chọn đáp án đúng:',
    prompt: parts.prompt,
    options,
    correctOptionId: OPTION_IDS[values.indexOf(answerText)],
    explanationSteps: [...parts.steps, `Đáp án: ${answerText}.`],
  }
}

/**
 * Sinh một câu Toán đố: chọn ngẫu nhiên một kiểu bài trong nhóm độ khó.
 * @param id Mã câu hỏi (duy nhất trong bài làm).
 * @param difficulty Độ khó.
 */
export function generateWordProblem(id: string, difficulty: Difficulty): Question {
  return partsToQuestion(id, difficulty, pickOne(WORD_KINDS_BY_DIFFICULTY[difficulty])())
}

/**
 * Sinh một bộ câu Toán đố, không có hai câu trùng đề.
 * @param count Số câu hỏi.
 * @param difficulty Độ khó cố định; bỏ trống thì mỗi câu lấy độ khó ngẫu nhiên.
 * @returns Danh sách câu hỏi với mã 'wp-1', 'wp-2', …
 */
export function generateWordProblems(count: number, difficulty?: Difficulty): Question[] {
  const questions: Question[] = []
  const used = new Set<string>()
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard']
  while (questions.length < count) {
    const question = generateWordProblem(`wp-${questions.length + 1}`, difficulty ?? pickOne(difficulties))
    if (used.has(question.prompt)) continue
    used.add(question.prompt)
    questions.push(question)
  }
  return questions
}
