// Kiểm thử bước 3.5: ưu tiên câu chưa làm cho Logic và Ngôn ngữ.
// Mô phỏng làm nhiều bài liên tiếp: sau mỗi bài, cộng các câu vừa làm vào bảng "đã gặp" rồi ra bài tiếp theo.
import { describe, expect, it } from 'vitest'
import type { Question, QuestionCategory } from '../types/question'
import { pickLeastSeen } from './bank'
import { generateQuestions } from './index'

/** Làm `rounds` bài liên tiếp, mỗi bài `count` câu; trả về danh sách mã câu của từng bài. */
function simulate(category: QuestionCategory, rounds: number, count: number, difficulty: 'mixed' | 'hard' = 'mixed') {
  const seen = new Map<string, number>()
  const tests: Question[][] = []
  for (let r = 0; r < rounds; r++) {
    const questions = generateQuestions({ category, questionCount: count, difficulty, timeLimitSec: null }, seen)
    for (const q of questions) seen.set(q.id, (seen.get(q.id) ?? 0) + 1)
    tests.push(questions)
  }
  return tests
}

describe('pickLeastSeen', () => {
  it('chọn phần tử chưa gặp trước, rồi đến phần tử gặp ít lần nhất', () => {
    const pool = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }))
    const seen = new Map([
      ['a', 2],
      ['b', 1],
      ['c', 1],
    ])
    for (let i = 0; i < 50; i++) {
      const picked = pickLeastSeen(pool, 3, seen).map((p) => p.id)
      // d, e chưa gặp → chắc chắn được chọn; chỗ còn lại là b hoặc c (gặp 1 lần), không bao giờ là a (gặp 2 lần)
      expect(picked).toContain('d')
      expect(picked).toContain('e')
      expect(picked).not.toContain('a')
    }
  })
})

describe('Ưu tiên câu chưa làm', () => {
  it('Logic: 4 bài 10 câu liên tiếp gặp đủ 40 câu khác nhau, không lặp câu nào', () => {
    for (let run = 0; run < 20; run++) {
      const ids = simulate('logical', 4, 10).flat().map((q) => q.id)
      expect(new Set(ids).size).toBe(40)
    }
  })

  it('Ngôn ngữ: 4 bài 10 câu liên tiếp gặp đủ 40 nhận định khác nhau, vẫn gom theo đoạn văn', () => {
    for (let run = 0; run < 20; run++) {
      const tests = simulate('verbal', 4, 10)
      expect(new Set(tests.flat().map((q) => q.id)).size).toBe(40)
      for (const questions of tests) {
        // Gom theo đoạn văn: một đoạn văn đã kết thúc thì không xuất hiện lại trong cùng bài
        const titles = questions.map((q) => (q.stimulus?.type === 'passage' ? q.stimulus.title : ''))
        const finished = new Set<string>()
        titles.forEach((title, k) => {
          expect(finished.has(title)).toBe(false)
          if (titles[k + 1] !== title) finished.add(title)
        })
      }
    }
  })

  it('Ngôn ngữ: bài đầu tiên đọc ít đoạn văn nhất (10 câu = 3 đoạn văn, mỗi đoạn 4 nhận định)', () => {
    for (let run = 0; run < 20; run++) {
      const [first] = simulate('verbal', 1, 10)
      const passages = new Set(first.map((q) => (q.stimulus?.type === 'passage' ? q.stimulus.title : '')))
      expect(passages.size).toBe(3)
    }
  })

  it('Logic hết câu soạn tay chưa làm thì sinh câu mới bằng code, không lặp câu thứ tự / xếp chỗ đã làm', () => {
    for (let run = 0; run < 20; run++) {
      // Mức khó chỉ có 9 câu thứ tự / xếp chỗ soạn tay: bài 2 phải dùng câu sinh bằng code
      const [first, second] = simulate('logical', 2, 10, 'hard')
      const firstIds = new Set(first.filter((q) => q.id.startsWith('lg-')).map((q) => q.id))
      const repeatedNonSyllogism = second.filter((q) => firstIds.has(q.id) && !q.prompt.includes('CHẮC CHẮN'))
      expect(repeatedNonSyllogism).toEqual([])
      expect(second.some((q) => !q.id.startsWith('lg-'))).toBe(true)
    }
  })

  it('không truyền lịch sử thì vẫn ra đề bình thường', () => {
    expect(generateQuestions({ category: 'logical', questionCount: 10, difficulty: 'mixed', timeLimitSec: null })).toHaveLength(10)
  })
})
