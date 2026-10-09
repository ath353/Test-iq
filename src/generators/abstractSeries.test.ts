// Kiểm thử bộ sinh chuỗi hình.
// Phần 1: bộ nhận diện quy luật trên các chuỗi dựng tay (biết trước kết quả).
// Phần 2: chạy bộ sinh nhiều lần, mỗi câu có ĐÚNG MỘT lựa chọn làm chuỗi hợp lệ.
import { describe, expect, it } from 'vitest'
import type { Figure } from '../types/figure'
import type { Difficulty } from '../types/question'
import { describeFigure } from '../utils/figure'
import {
  buildSeriesCells,
  buildSeriesDistractors,
  generateSeriesQuestion,
  isValidSequence,
  planSeries,
  SEQUENCE_LENGTH,
  sequenceRules,
} from './abstractSeries'
import { sameFigure } from './abstract'

const RUNS = 300

/** Tạo nhanh chuỗi 6 hình từ các dãy giá trị (thuộc tính không truyền thì giữ cố định). */
function seq(parts: { shape?: Figure['shape'][]; fill?: Figure['fill'][]; count?: number[]; rotation?: number[] }): Figure[] {
  return Array.from({ length: 6 }, (_, i) => ({
    shape: parts.shape?.[i] ?? 'circle',
    fill: parts.fill?.[i] ?? 'solid',
    count: parts.count?.[i] ?? 1,
    rotation: parts.rotation?.[i] ?? 0,
  }))
}

describe('sequenceRules (chuỗi dựng tay)', () => {
  it('nhận diện chu kỳ 2 và chu kỳ 3', () => {
    expect(sequenceRules(seq({ fill: ['solid', 'outline', 'solid', 'outline', 'solid', 'outline'] }), 'fill')).toEqual(['cycle2'])
    expect(sequenceRules(seq({ count: [1, 2, 4, 1, 2, 4] }), 'count')).toEqual(['cycle3'])
    expect(sequenceRules(seq({}), 'shape')).toEqual(['constant'])
  })

  it('nhận diện xoay đều, từ chối xoay mà mắt không thấy khác', () => {
    const arrows = seq({ shape: Array(6).fill('arrow'), rotation: [0, 90, 180, 270, 0, 90] })
    expect(sequenceRules(arrows, 'rotation')).toContain('rotate')
    const squares = seq({ shape: Array(6).fill('square'), rotation: [0, 90, 180, 270, 0, 90] })
    expect(sequenceRules(squares, 'rotation')).not.toContain('rotate')
  })

  it('điền sai hình cuối thì chuỗi không hợp lệ', () => {
    expect(isValidSequence(seq({ count: [1, 2, 4, 1, 2, 4] }))).toBe(true)
    expect(isValidSequence(seq({ count: [1, 2, 4, 1, 2, 1] }))).toBe(false)
    // Chu kỳ 2 nhưng hình cuối lặp lại hình trước nó (bẫy "chép hình cuối")
    expect(isValidSequence(seq({ fill: ['solid', 'outline', 'solid', 'outline', 'solid', 'solid'] }))).toBe(false)
  })
})

/** Xoay vòng độ khó theo số lần chạy. */
const levelOf = (i: number): Difficulty => (['easy', 'medium', 'hard'] as Difficulty[])[i % 3]

describe('planSeries + buildSeriesCells', () => {
  it('chuỗi luôn hợp lệ; số thuộc tính thay đổi đúng theo độ khó; mức khó có chu kỳ 3', () => {
    const expected: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 }
    for (let i = 0; i < RUNS; i++) {
      const difficulty = levelOf(i)
      const plan = planSeries(difficulty)
      const cells = buildSeriesCells(plan)
      expect(cells).toHaveLength(SEQUENCE_LENGTH)
      expect(isValidSequence(cells)).toBe(true)
      const varying = (['shape', 'fill', 'count', 'rotation'] as const).filter(
        (a) => !sequenceRules(cells, a).includes('constant'),
      )
      expect(varying).toHaveLength(expected[difficulty])
      if (difficulty === 'hard') {
        expect((['shape', 'fill', 'count'] as const).some((a) => sequenceRules(cells, a).includes('cycle3'))).toBe(true)
      }
      if (difficulty !== 'easy') {
        // Mức trung bình / khó: đáp án KHÔNG được trùng hình thứ 4 (tránh chuỗi chỉ cần "chép cách 2 ô")
        expect(sameFigure(cells[5], cells[3])).toBe(false)
      }
      if (difficulty === 'easy') {
        expect((['shape', 'fill', 'count'] as const).some((a) => sequenceRules(cells, a).includes('cycle3'))).toBe(false)
      }
    }
  })
})

describe('buildSeriesDistractors', () => {
  it('4 đáp án nhiễu: nhìn khác đáp án, khác nhau, không làm chuỗi hợp lệ', () => {
    for (let i = 0; i < RUNS; i++) {
      const plan = planSeries(levelOf(i))
      const cells = buildSeriesCells(plan)
      const distractors = buildSeriesDistractors(cells, plan)
      expect(distractors).toHaveLength(4)
      for (const d of distractors) {
        expect(sameFigure(d, cells[5])).toBe(false)
        expect(isValidSequence([...cells.slice(0, 5), d])).toBe(false)
      }
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) expect(sameFigure(distractors[a], distractors[b])).toBe(false)
    }
  })
})

describe('generateSeriesQuestion', () => {
  it('đúng MỘT lựa chọn làm chuỗi hợp lệ, và đó là đáp án đúng', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateSeriesQuestion('q', levelOf(i))
      if (q.stimulus?.type !== 'sequence') throw new Error('thiếu chuỗi hình')
      expect(q.stimulus.cells).toHaveLength(6)
      expect(q.stimulus.cells[5]).toBeNull()
      const known = q.stimulus.cells.slice(0, 5) as Figure[]
      const valid = q.options.filter((o) => o.figure && isValidSequence([...known, o.figure]))
      expect(valid.map((o) => o.id)).toEqual([q.correctOptionId])
    }
  })

  it('5 lựa chọn có hình; lời giải bước cuối nêu đúng hình cần tìm', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateSeriesQuestion('q', levelOf(i))
      expect(q.options.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D', 'E'])
      const answer = q.options.find((o) => o.id === q.correctOptionId)!.figure!
      expect(q.explanationSteps.at(-1)).toBe(`Hình cần tìm: ${describeFigure(answer)}.`)
      for (const step of q.explanationSteps) expect(step.trim()).not.toBe('')
    }
  })
})
