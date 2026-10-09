// Biểu đồ đường: % đúng của từng bài theo thứ tự thời gian (tiến bộ qua các lần làm).
// Di chuột (hoặc dùng phím ← →) để xem giá trị từng bài; có bảng thay thế cho người không dùng chuột.
import { useState } from 'react'
import { getCategoryLabel } from '../config/testOptions'
import { useElementWidth } from '../hooks/useElementWidth'
import type { ProgressPoint } from '../utils/stats'
import { formatDateTime } from '../utils/time'
import './ProgressChart.css'

interface ProgressChartProps {
  points: ProgressPoint[]
}

/** Chiều cao biểu đồ và lề (px) chừa chỗ cho chữ trục. */
const HEIGHT = 220
const MARGIN = { top: 16, right: 40, bottom: 28, left: 44 }
/** Các mốc % có đường lưới ngang. */
const Y_TICKS = [0, 25, 50, 75, 100]

/**
 * ProgressChart:
 * - Trục ngang: thứ tự bài (Bài 1 … Bài n), trục dọc: 0–100% đúng.
 * - Đường 2px, điểm tròn có viền màu nền; điểm cuối có nhãn giá trị (chỉ ghi nhãn điểm cuối cho gọn).
 * - Di chuột: đường dọc bắt vào bài gần nhất + ô thông tin (giá trị in đậm, dạng bài và ngày làm bên dưới).
 * - Bàn phím: bấm vào biểu đồ (Tab) rồi dùng ← → để đi qua từng bài.
 * Cần ít nhất 2 bài mới vẽ (1 điểm không có xu hướng).
 */
function ProgressChart({ points }: ProgressChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>()
  // Bài đang được xem (di chuột / bàn phím); null là không xem bài nào
  const [active, setActive] = useState<number | null>(null)

  // Khung đo bề rộng (ref) luôn được tạo, kể cả khi chưa đủ dữ liệu, để đổi bộ lọc sang dạng có dữ liệu
  // thì biểu đồ vẽ ngay đúng bề rộng
  if (points.length < 2) {
    return (
      <div className="progress-chart" ref={containerRef}>
        <p className="progress-chart__empty">Cần ít nhất 2 bài để xem tiến bộ.</p>
      </div>
    )
  }

  // Quy đổi chỉ số bài và % sang toạ độ điểm ảnh
  const plotWidth = Math.max(1, width - MARGIN.left - MARGIN.right)
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const xOf = (i: number) => MARGIN.left + (plotWidth * i) / (points.length - 1)
  const yOf = (accuracy: number) => MARGIN.top + plotHeight * (1 - accuracy / 100)
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(p.accuracy)}`).join(' ')
  // Vùng tô nhạt dưới đường (10% độ đậm)
  const area = `${path} L${xOf(points.length - 1)},${yOf(0)} L${xOf(0)},${yOf(0)} Z`
  const last = points.length - 1

  /** Tìm bài gần nhất theo vị trí chuột trên trục ngang. */
  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const index = Math.round(((x - MARGIN.left) / plotWidth) * (points.length - 1))
    setActive(Math.min(last, Math.max(0, index)))
  }

  /** Bàn phím: ← → đi qua từng bài. */
  function handleKeyDown(event: React.KeyboardEvent<SVGSVGElement>) {
    if (event.key === 'ArrowRight') setActive((i) => Math.min(last, (i ?? -1) + 1))
    else if (event.key === 'ArrowLeft') setActive((i) => Math.max(0, (i ?? last + 1) - 1))
    else return
    event.preventDefault()
  }

  // Nhãn trục ngang: chỉ bài đầu, bài giữa, bài cuối (tránh chữ chồng nhau)
  const xLabels = [...new Set([0, Math.floor(last / 2), last])]
  const activePoint = active === null ? null : points[active]

  return (
    <div className="progress-chart" ref={containerRef}>
      <div className="progress-chart__plot">
        <svg
          width={width}
          height={HEIGHT}
          tabIndex={0}
          role="img"
          aria-label={`Biểu đồ % đúng của ${points.length} bài gần nhất, từ ${points[0].accuracy}% đến ${points[last].accuracy}%. Dùng phím mũi tên trái phải để xem từng bài.`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(last)}
          onBlur={() => setActive(null)}
          onKeyDown={handleKeyDown}
        >
          {/* Lưới ngang mảnh + nhãn % bên trái */}
          {Y_TICKS.map((t) => (
            <g key={t}>
              <line className="progress-chart__grid" x1={MARGIN.left} x2={MARGIN.left + plotWidth} y1={yOf(t)} y2={yOf(t)} />
              <text className="progress-chart__axis" x={MARGIN.left - 8} y={yOf(t)} textAnchor="end" dominantBaseline="middle">
                {t}%
              </text>
            </g>
          ))}

          {/* Nhãn trục ngang */}
          {xLabels.map((i) => (
            <text key={i} className="progress-chart__axis" x={xOf(i)} y={HEIGHT - 8} textAnchor="middle">
              Bài {i + 1}
            </text>
          ))}

          <path className="progress-chart__area" d={area} />
          <path className="progress-chart__line" d={path} />

          {/* Đường dọc bắt vào bài đang xem */}
          {active !== null && (
            <line
              className="progress-chart__crosshair"
              x1={xOf(active)}
              x2={xOf(active)}
              y1={MARGIN.top}
              y2={MARGIN.top + plotHeight}
            />
          )}

          {/* Điểm từng bài; điểm đang xem to hơn */}
          {points.map((p, i) => (
            <circle
              key={p.id}
              className="progress-chart__dot"
              cx={xOf(i)}
              cy={yOf(p.accuracy)}
              r={i === active ? 6 : 4}
            />
          ))}

          {/* Nhãn giá trị ở điểm cuối (chỉ một nhãn, phần còn lại xem bằng di chuột / bảng) */}
          <text
            className="progress-chart__end-label"
            x={xOf(last) + 10}
            y={yOf(points[last].accuracy)}
            dominantBaseline="middle"
          >
            {points[last].accuracy}%
          </text>
        </svg>

        {/* Ô thông tin khi di chuột: giá trị đậm ở trên, thông tin phụ bên dưới */}
        {activePoint && active !== null && (
          <div
            className="progress-chart__tooltip"
            style={{
              left: Math.min(Math.max(xOf(active), 70), width - 70),
              top: yOf(activePoint.accuracy),
            }}
            role="status"
          >
            <strong>{activePoint.accuracy}% đúng</strong>
            <span>
              Bài {active + 1} · {getCategoryLabel(activePoint.category)}
            </span>
            <span>{formatDateTime(activePoint.finishedAt)}</span>
          </div>
        )}
      </div>

      {/* Bảng thay thế: xem mọi giá trị mà không cần di chuột */}
      <details className="progress-chart__table">
        <summary>Xem dạng bảng</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Bài</th>
              <th scope="col">Dạng bài</th>
              <th scope="col">Ngày làm</th>
              <th scope="col">% đúng</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td>{getCategoryLabel(p.category)}</td>
                <td>{formatDateTime(p.finishedAt)}</td>
                <td>{p.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}

export default ProgressChart
