// Nạp và soát nội dung trang "Bí kíp" (src/data/tips.json). Có lỗi thì báo rõ chỗ sai, giống ngân hàng câu hỏi.

import { CATEGORY_OPTIONS } from '../config/testOptions'
import tipsData from '../data/tips.json'
import type { TipsContent } from '../types/tips'

/** Kiểu "đối tượng bất kỳ" để đọc dữ liệu chưa kiểm tra mà không dùng any. */
type Obj = Record<string, unknown>

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''

/** Kiểm tra một danh sách ý: là mảng không rỗng, mọi ý là chuỗi không rỗng. */
function checkItems(items: unknown, where: string, errors: string[]) {
  if (!Array.isArray(items) || items.length === 0) {
    errors.push(`${where}: cần ít nhất 1 ý`)
    return
  }
  items.forEach((item, i) => {
    if (!isText(item)) errors.push(`${where}, ý ${i + 1}: rỗng hoặc không phải chữ`)
  })
}

/**
 * Kiểm tra danh sách nhóm mẹo (TipSection[]): có id không trùng, có tiêu đề, có ý.
 * @param where Mô tả vị trí để ghi vào thông báo lỗi, ví dụ 'Bí kíp chung'.
 */
function checkSections(sections: unknown, where: string, errors: string[]) {
  if (!Array.isArray(sections) || sections.length === 0) {
    errors.push(`${where}: cần ít nhất 1 nhóm mẹo`)
    return
  }
  const ids = new Set<string>()
  sections.forEach((section, i) => {
    const at = `${where}, nhóm ${i + 1}`
    if (!isObj(section)) return errors.push(`${at}: sai cấu trúc`)
    if (!isText(section.id)) errors.push(`${at}: thiếu id`)
    else if (ids.has(section.id)) errors.push(`${at}: id "${section.id}" bị trùng`)
    else ids.add(section.id)
    if (!isText(section.title)) errors.push(`${at}: thiếu tiêu đề`)
    checkItems(section.items, `${at} (${String(section.title)})`, errors)
  })
}

/**
 * Soát toàn bộ nội dung Bí kíp.
 * @param data Dữ liệu đọc từ JSON (chưa tin cậy).
 * @returns Danh sách lỗi; rỗng nghĩa là hợp lệ.
 */
export function validateTips(data: unknown): string[] {
  const errors: string[] = []
  if (!isObj(data)) return ['Nội dung Bí kíp: sai cấu trúc']

  // Lộ trình cho người mới
  const plan = data.beginnerPlan
  if (!isObj(plan)) {
    errors.push('Lộ trình: thiếu')
  } else {
    if (!isText(plan.intro)) errors.push('Lộ trình: thiếu lời giới thiệu')
    if (!Array.isArray(plan.phases) || plan.phases.length === 0) {
      errors.push('Lộ trình: cần ít nhất 1 giai đoạn')
    } else {
      const ids = new Set<string>()
      plan.phases.forEach((phase: unknown, i: number) => {
        const at = `Lộ trình, giai đoạn ${i + 1}`
        if (!isObj(phase)) return errors.push(`${at}: sai cấu trúc`)
        if (!isText(phase.id) || ids.has(phase.id)) errors.push(`${at}: thiếu id hoặc id bị trùng`)
        else ids.add(phase.id)
        for (const field of ['days', 'title', 'goal'] as const) {
          if (!isText(phase[field])) errors.push(`${at}: thiếu "${field}"`)
        }
        checkItems(phase.tasks, `${at} (việc cần làm)`, errors)
      })
    }
    checkSections([plan.readiness], 'Lộ trình (dấu hiệu sẵn sàng)', errors)
    checkSections([plan.shortPlan], 'Lộ trình (bản rút gọn)', errors)
  }

  checkSections(data.general, 'Bí kíp chung', errors)

  // Mọi dạng bài đang có trên trang chủ đều phải có bí kíp
  const categories = isObj(data.categories) ? data.categories : {}
  for (const option of CATEGORY_OPTIONS) {
    if (option.id === 'mixed' || !option.available) continue
    const tips = categories[option.id]
    if (!isObj(tips)) {
      errors.push(`Dạng "${option.label}": chưa có bí kíp`)
      continue
    }
    if (!isText(tips.summary)) errors.push(`Dạng "${option.label}": thiếu câu tóm tắt`)
    checkSections(tips.sections, `Dạng "${option.label}"`, errors)
  }
  return errors
}

/**
 * Nạp nội dung Bí kíp sau khi soát; có lỗi thì báo lỗi kèm danh sách chỗ sai.
 * @param data Dữ liệu đọc từ JSON.
 */
export function loadTips(data: unknown): TipsContent {
  const errors = validateTips(data)
  if (errors.length > 0) throw new Error(`Nội dung Bí kíp có lỗi:\n${errors.join('\n')}`)
  return data as TipsContent
}

/** Nội dung Bí kíp, nạp một lần khi mở web. */
export const TIPS: TipsContent = loadTips(tipsData)
