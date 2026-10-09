// Kiểm thử bộ sinh Logic sắp xếp thứ tự.
// Vét cạn ĐỘC LẬP (viết lại ở đây, không dùng hàm của bộ sinh) để chắc mỗi câu đúng 1 đáp án, không dữ kiện thừa.
import { describe, expect, it } from 'vitest'
import type { Difficulty } from '../types/question'
import { buildOrderingPuzzle, generateOrderingQuestion, type OrderFact } from './logicOrdering'

const RUNS = 150

/** Mọi hoán vị của danh sách (viết riêng cho test). */
function allOrders(items: number[]): number[][] {
  if (items.length <= 1) return [items]
  return items.flatMap((x, i) => allOrders([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [x, ...rest]))
}

/** Thứ tự `order` (order[vị trí] = người) có thỏa mãn dữ kiện không (viết riêng cho test). */
function holds(order: number[], f: OrderFact): boolean {
  const pos = (p: number) => order.indexOf(p)
  if (f.kind === 'before') return pos(f.a) < pos(f.b)
  if (f.kind === 'immediately') return pos(f.b) - pos(f.a) === 1
  if (f.kind === 'first') return pos(f.a) === 0
  return pos(f.a) === order.length - 1
}

/** Các thứ tự thỏa mãn mọi dữ kiện. */
function countSolutions(n: number, facts: OrderFact[]): number[][] {
  return allOrders(Array.from({ length: n }, (_, i) => i)).filter((o) => facts.every((f) => holds(o, f)))
}

describe('buildOrderingPuzzle', () => {
  for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
    it(`mức "${difficulty}": đúng một thứ tự thỏa mãn, chính là thứ tự ẩn, và không có dữ kiện thừa`, () => {
      for (let i = 0; i < RUNS; i++) {
        const puzzle = buildOrderingPuzzle(difficulty)
        const n = puzzle.people.length
        const solutions = countSolutions(n, puzzle.facts)
        expect(solutions).toEqual([puzzle.order])
        // Không thừa: bỏ bất kỳ dữ kiện nào thì có nhiều hơn một thứ tự
        for (const fact of puzzle.facts) {
          expect(countSolutions(n, puzzle.facts.filter((f) => f !== fact)).length).toBeGreaterThan(1)
        }
      }
    })
  }

  it('số người tăng theo độ khó; mức khó không cho biết ai đứng đầu / cuối', () => {
    expect(buildOrderingPuzzle('easy').people).toHaveLength(4)
    expect(buildOrderingPuzzle('medium').people).toHaveLength(5)
    for (let i = 0; i < RUNS; i++) {
      const hard = buildOrderingPuzzle('hard')
      expect(hard.people).toHaveLength(6)
      expect(hard.facts.every((f) => f.kind !== 'first' && f.kind !== 'last')).toBe(true)
    }
  })

  it('mức dễ chỉ so sánh hai người liền kề (dễ ghép thành chuỗi)', () => {
    for (let i = 0; i < RUNS; i++) {
      const { order, facts } = buildOrderingPuzzle('easy')
      for (const f of facts) {
        if (f.kind === 'before') expect(order.indexOf(f.b) - order.indexOf(f.a)).toBe(1)
      }
    }
  })
})

describe('generateOrderingQuestion', () => {
  for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
    it(`câu hỏi mức "${difficulty}" hợp lệ, đáp án khớp với thứ tự trong lời giải`, () => {
      for (let i = 0; i < RUNS; i++) {
        const q = generateOrderingQuestion('q', difficulty)
        expect(q.category).toBe('logical')
        expect(q.difficulty).toBe(difficulty)
        const contents = q.options.map((o) => o.content)
        expect(new Set(contents).size).toBe(contents.length)
        const answer = q.options.find((o) => o.id === q.correctOptionId)!.content
        for (const step of q.explanationSteps) expect(step.trim()).not.toBe('')

        // Lấy thứ tự đúng từ bước 2 của lời giải: "…tất cả: An → Bình → Chi."
        const chain = q.explanationSteps[1].split(': ')[1].replace(/\.$/, '').split(' → ')
        const lastLine = q.prompt.split('\n').pop()!
        if (lastLine.includes('Thứ tự')) {
          expect(answer).toBe(chain.join(', '))
        } else {
          // Câu hỏi vị trí: "thứ k", "đầu tiên / nhất" (k = 1), "cuối cùng / thấp nhất" (k = n)
          const k = /thứ (\d)/.exec(lastLine)?.[1]
          const position = k ? Number(k) - 1 : /cuối|thấp nhất/.test(lastLine) ? chain.length - 1 : 0
          expect(answer).toBe(chain[position])
          // Không hỏi vị trí đã nói thẳng trong dữ kiện (đáp án không được lộ sẵn trong đề)
          const premises = q.prompt
            .split('\n')
            .filter((l) => l.startsWith('- '))
            .join(' ')
          const stated = new RegExp(
            `${answer} (về đích đầu tiên|về đích cuối cùng|cao nhất|thấp nhất|đứng đầu hàng|đứng cuối hàng|có điểm cao nhất|có điểm thấp nhất)`,
          )
          expect(premises).not.toMatch(stated)
        }
      }
    })
  }

  it('mức khó có cả câu hỏi "thứ tự nào đúng", đáp án nhiễu là các thứ tự sai', () => {
    let orderQuestions = 0
    for (let i = 0; i < RUNS; i++) {
      const q = generateOrderingQuestion('q', 'hard')
      if (q.prompt.split('\n').pop()!.includes('Thứ tự')) {
        orderQuestions++
        expect(q.options).toHaveLength(4)
      }
    }
    expect(orderQuestions).toBeGreaterThan(0)
  })
})
