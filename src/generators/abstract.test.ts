// Kiểm thử bộ sinh Suy luận hình (ma trận 3 × 3).
// Phần 1: kiểm tra bộ nhận diện quy luật trên các ma trận dựng tay (biết trước đáp án).
// Phần 2: chạy bộ sinh nhiều lần, kiểm tra mỗi câu có ĐÚNG MỘT lựa chọn làm ma trận hợp lệ.
import { describe, expect, it } from 'vitest'
import type { Figure } from '../types/figure'
import type { Difficulty } from '../types/question'
import { describeFigure } from '../utils/figure'
import {
  buildCells,
  buildFigureDistractors,
  generateAbstractQuestion,
  generateAbstractQuestions,
  isValidMatrix,
  matchingRules,
  planMatrix,
  sameFigure,
  visualRotation,
} from './abstract'

const RUNS = 300

/** Tạo nhanh 9 ô từ các bảng giá trị theo hàng (thuộc tính không truyền thì giữ cố định). */
function grid(parts: {
  shape?: Figure['shape'][][]
  fill?: Figure['fill'][][]
  count?: number[][]
  rotation?: number[][]
}): Figure[] {
  return [0, 1, 2].flatMap((r) =>
    [0, 1, 2].map((c) => ({
      shape: parts.shape?.[r][c] ?? 'circle',
      fill: parts.fill?.[r][c] ?? 'solid',
      count: parts.count?.[r][c] ?? 1,
      rotation: parts.rotation?.[r][c] ?? 0,
    })),
  )
}

describe('visualRotation / sameFigure', () => {
  it('quy góc xoay về chu kỳ đối xứng', () => {
    expect(visualRotation('triangle', 120)).toBe(0)
    expect(visualRotation('triangle', 270)).toBe(30)
    expect(visualRotation('circle', 90)).toBe(0)
    expect(visualRotation('arrow', -90)).toBe(270)
  })

  it('hai hình chỉ khác góc xoay "vô hình" được coi là giống nhau', () => {
    expect(sameFigure({ shape: 'square', fill: 'solid', count: 1, rotation: 0 }, { shape: 'square', fill: 'solid', count: 1, rotation: 90 })).toBe(true)
    expect(sameFigure({ shape: 'arrow', fill: 'solid', count: 1, rotation: 0 }, { shape: 'arrow', fill: 'solid', count: 1, rotation: 90 })).toBe(false)
  })
})

describe('matchingRules (ma trận dựng tay)', () => {
  it('nhận diện số lượng tăng dần', () => {
    const cells = grid({ count: [[1, 2, 3], [2, 3, 4], [1, 2, 3]] })
    expect(matchingRules(cells, 'count')).toContain('progression')
    expect(isValidMatrix(cells)).toBe(true)
  })

  it('nhận diện hoán vị dạng hình', () => {
    const cells = grid({
      shape: [
        ['circle', 'square', 'star'],
        ['square', 'star', 'circle'],
        ['star', 'circle', 'square'],
      ],
    })
    expect(matchingRules(cells, 'shape')).toEqual(['latin'])
  })

  it('nhận diện quy luật theo hàng và không đổi', () => {
    const cells = grid({ fill: [['solid', 'solid', 'solid'], ['outline', 'outline', 'outline'], ['striped', 'striped', 'striped']] })
    expect(matchingRules(cells, 'fill')).toEqual(['row'])
    expect(matchingRules(cells, 'shape')).toEqual(['constant', 'row'])
  })

  it('nhận diện góc xoay tăng dần 90°, và từ chối khi xoay mà mắt không thấy khác', () => {
    const arrows = grid({ shape: Array(3).fill(Array(3).fill('arrow')), rotation: [[0, 90, 180], [90, 180, 270], [270, 0, 90]] })
    expect(matchingRules(arrows, 'rotation')).toContain('progression')
    // Hình vuông xoay 0° → 90° → 180°: trông y hệt nhau, không được coi là quy luật xoay
    const squares = grid({ shape: Array(3).fill(Array(3).fill('square')), rotation: [[0, 90, 180], [0, 90, 180], [0, 90, 180]] })
    expect(matchingRules(squares, 'rotation')).not.toContain('progression')
  })

  it('ô cuối điền sai thì ma trận không hợp lệ', () => {
    const cells = grid({ count: [[1, 2, 3], [2, 3, 4], [1, 2, 4]] })
    expect(matchingRules(cells, 'count')).toEqual([])
    expect(isValidMatrix(cells)).toBe(false)
  })
})

describe('planMatrix + buildCells', () => {
  it('ma trận sinh ra luôn hợp lệ, số thuộc tính thay đổi đúng theo độ khó', () => {
    const expected: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 }
    for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
      for (let i = 0; i < RUNS; i++) {
        const cells = buildCells(planMatrix(difficulty))
        expect(isValidMatrix(cells)).toBe(true)
        // Đếm thuộc tính KHÔNG giống nhau trên cả 9 ô (đếm độc lập với kế hoạch)
        const varying = (['shape', 'fill', 'count', 'rotation'] as const).filter(
          (a) => !matchingRules(cells, a).includes('constant'),
        )
        expect(varying).toHaveLength(expected[difficulty])
        // Số lượng luôn trong khoảng 1–4
        for (const cell of cells) expect(cell.count).toBeGreaterThanOrEqual(1)
        for (const cell of cells) expect(cell.count).toBeLessThanOrEqual(4)
      }
    }
  })
})

describe('buildFigureDistractors', () => {
  it('4 đáp án nhiễu: nhìn khác đáp án, khác nhau, và KHÔNG làm ma trận hợp lệ', () => {
    for (let i = 0; i < RUNS; i++) {
      const plan = planMatrix(pickDifficulty(i))
      const cells = buildCells(plan)
      const distractors = buildFigureDistractors(cells, plan)
      expect(distractors).toHaveLength(4)
      for (const d of distractors) {
        expect(sameFigure(d, cells[8])).toBe(false)
        expect(isValidMatrix([...cells.slice(0, 8), d])).toBe(false)
      }
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) expect(sameFigure(distractors[a], distractors[b])).toBe(false)
    }
  })
})

/** Xoay vòng độ khó theo số lần chạy. */
function pickDifficulty(i: number): Difficulty {
  return (['easy', 'medium', 'hard'] as Difficulty[])[i % 3]
}

describe('generateAbstractQuestion', () => {
  it('đúng MỘT lựa chọn làm ma trận hợp lệ, và đó là đáp án đúng', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateAbstractQuestion('q', pickDifficulty(i))
      if (q.stimulus?.type !== 'matrix') throw new Error('thiếu ma trận')
      expect(q.stimulus.cells).toHaveLength(9)
      expect(q.stimulus.cells[8]).toBeNull()
      const known = q.stimulus.cells.slice(0, 8) as Figure[]

      const validOptions = q.options.filter((o) => o.figure && isValidMatrix([...known, o.figure]))
      expect(validOptions.map((o) => o.id)).toEqual([q.correctOptionId])
    }
  })

  it('5 lựa chọn A–E có hình và mô tả; lời giải hợp lệ, bước cuối nêu đúng hình cần tìm', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateAbstractQuestion('q', pickDifficulty(i))
      expect(q.category).toBe('abstract')
      expect(q.options.map((o) => o.id)).toEqual(['A', 'B', 'C', 'D', 'E'])
      for (const o of q.options) {
        expect(o.figure).toBeDefined()
        expect(o.content).toBe(describeFigure(o.figure!))
      }
      const answer = q.options.find((o) => o.id === q.correctOptionId)!.figure!
      for (const step of q.explanationSteps) expect(step.trim()).not.toBe('')
      expect(q.explanationSteps[q.explanationSteps.length - 1]).toBe(`Hình cần tìm: ${describeFigure(answer)}.`)
    }
  })

  it('đáp án đúng xuất hiện ở nhiều vị trí khác nhau (đã xáo trộn)', () => {
    const positions = new Set<string>()
    for (let i = 0; i < RUNS; i++) positions.add(generateAbstractQuestion('q', 'easy').correctOptionId)
    expect(positions.size).toBe(5)
  })
})

describe('generateAbstractQuestions', () => {
  it('sinh đúng số câu, mã không trùng, ma trận không trùng, giữ đúng độ khó', () => {
    const questions = generateAbstractQuestions(30, 'hard')
    expect(questions).toHaveLength(30)
    expect(new Set(questions.map((q) => q.id)).size).toBe(30)
    expect(new Set(questions.map((q) => JSON.stringify(q.stimulus))).size).toBe(30)
    expect(questions.every((q) => q.difficulty === 'hard')).toBe(true)
  })
})

describe('Mức khó', () => {
  it('không dùng quy luật "theo hàng" cho thuộc tính thay đổi', () => {
    for (let i = 0; i < RUNS; i++) {
      const plan = planMatrix('hard')
      for (const a of ['shape', 'fill', 'count', 'rotation'] as const) expect(plan[a].rule).not.toBe('row')
    }
  })
})
