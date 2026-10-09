// Kiểm thử bộ sinh Logic xếp chỗ ngồi.
// Vét cạn ĐỘC LẬP (viết lại ở đây) để chắc mỗi câu đúng 1 cách xếp, không dữ kiện thừa.
import { describe, expect, it } from 'vitest'
import type { Difficulty } from '../types/question'
import { buildSeatingPuzzle, generateSeatingQuestion, type SeatFact } from './logicSeating'

const RUNS = 150

/** Mọi cách xếp (seatOf[người] = ghế) cho n người (viết riêng cho test). */
function allSeatings(n: number): number[][] {
  const result: number[][] = []
  const walk = (prefix: number[]) => {
    if (prefix.length === n) return void result.push(prefix)
    for (let s = 0; s < n; s++) if (!prefix.includes(s)) walk([...prefix, s])
  }
  walk([])
  return result
}

/** Cách xếp có thỏa mãn dữ kiện không (viết riêng cho test). */
function holds(seatOf: number[], f: SeatFact): boolean {
  const s = (p: number) => seatOf[p]
  const isEnd = (p: number) => s(p) === 0 || s(p) === seatOf.length - 1
  switch (f.kind) {
    case 'seat':
      return s(f.a) === f.seat
    case 'end':
      return isEnd(f.a)
    case 'notEnd':
      return !isEnd(f.a)
    case 'adjacent':
      return Math.abs(s(f.a) - s(f.b)) === 1
    case 'notAdjacent':
      return Math.abs(s(f.a) - s(f.b)) !== 1
    case 'leftOf':
      return s(f.a) < s(f.b)
    case 'immediatelyLeft':
      return s(f.b) - s(f.a) === 1
  }
}

const solutions = (n: number, facts: SeatFact[]) => allSeatings(n).filter((o) => facts.every((f) => holds(o, f)))

describe('buildSeatingPuzzle', () => {
  for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
    it(`mức "${difficulty}": đúng một cách xếp thỏa mãn, chính là cách xếp ẩn, không dữ kiện thừa`, () => {
      for (let i = 0; i < RUNS; i++) {
        const puzzle = buildSeatingPuzzle(difficulty)
        const n = puzzle.people.length
        expect(solutions(n, puzzle.facts)).toEqual([puzzle.seatOf])
        for (const fact of puzzle.facts) {
          expect(solutions(n, puzzle.facts.filter((f) => f !== fact)).length).toBeGreaterThan(1)
        }
      }
    })
  }

  it('mức khó: tối đa 1 dữ kiện "ngồi ghế số mấy"; mức dễ không dùng dữ kiện gián tiếp', () => {
    for (let i = 0; i < RUNS; i++) {
      expect(buildSeatingPuzzle('hard').facts.filter((f) => f.kind === 'seat').length).toBeLessThanOrEqual(1)
      const easyKinds = buildSeatingPuzzle('easy').facts.map((f) => f.kind)
      expect(easyKinds.every((k) => ['seat', 'immediatelyLeft', 'end'].includes(k))).toBe(true)
    }
  })
})

describe('generateSeatingQuestion', () => {
  for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
    it(`câu hỏi mức "${difficulty}" hợp lệ, đáp án khớp cách xếp trong lời giải, không lộ đáp án`, () => {
      for (let i = 0; i < RUNS; i++) {
        const q = generateSeatingQuestion('q', difficulty)
        const contents = q.options.map((o) => o.content)
        expect(new Set(contents).size).toBe(contents.length)
        const answer = q.options.find((o) => o.id === q.correctOptionId)!.content

        // Cách xếp từ bước 2 của lời giải: "…: ghế 1: An; ghế 2: Bình."
        const arrangement = q.explanationSteps[1].split('tất cả: ')[1].replace(/\.$/, '').split('; ')
        const seatToPerson = new Map(arrangement.map((x) => [Number(/ghế (\d)/.exec(x)![1]), x.split(': ')[1]]))
        const lastLine = q.prompt.split('\n').pop()!
        const premises = q.prompt.split('\n').filter((l) => l.startsWith('- '))
        const askSeat = /^Ai ngồi ở ghế số (\d)\?$/.exec(lastLine)
        if (askSeat) {
          expect(answer).toBe(seatToPerson.get(Number(askSeat[1])))
          expect(premises.some((l) => l.includes(`ngồi ghế số ${askSeat[1]}.`))).toBe(false)
        } else {
          const person = lastLine.replace(' ngồi ghế số mấy?', '')
          const seat = [...seatToPerson].find(([, p]) => p === person)![0]
          expect(answer).toBe(`Ghế ${seat}`)
          expect(premises.some((l) => l.startsWith(`- ${person} ngồi ghế số`))).toBe(false)
        }
      }
    })
  }
})
