// Vẽ một ô hình bằng SVG: 1–4 hình giống nhau, theo dạng hình, kiểu tô, góc xoay.
import { useId } from 'react'
import type { Figure } from '../types/figure'
import { describeFigure, layoutSlots, placePoints, shapePoints, toSvgPoints } from '../utils/figure'
import './FigureView.css'

interface FigureViewProps {
  figure: Figure
  /** Kích thước hiển thị (px), mặc định 96. */
  size?: number
}

/**
 * FigureView: một ô vuông SVG 100 × 100.
 * - Màu lấy theo màu chữ hiện tại (currentColor) nên tự đổi theo chế độ sáng / tối.
 * - Toạ độ đỉnh được tính sẵn (xoay + phóng + dời) trong placePoints, không dùng transform của SVG,
 *   nên nét viền và sọc ở hình to hay nhỏ đều dày như nhau.
 * - Kiểu "kẻ sọc" dùng một mẫu tô (pattern) riêng cho mỗi ô; mã mẫu lấy từ useId để không trùng giữa các ô.
 * - Có mô tả bằng lời (aria-label) cho trình đọc màn hình, ví dụ "2 tam giác tô đặc, xoay 90°".
 */
function FigureView({ figure, size = 96 }: FigureViewProps) {
  const patternId = `stripes-${useId().replace(/:/g, '')}`
  // Tô: đặc = màu chữ; rỗng = không tô; sọc = mẫu kẻ sọc
  const fill = figure.fill === 'solid' ? 'currentColor' : figure.fill === 'striped' ? `url(#${patternId})` : 'none'

  return (
    <svg
      className="figure-view"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={describeFigure(figure)}
    >
      {figure.fill === 'striped' && (
        <defs>
          {/* Sọc chéo 45°, khoảng cách 4 đơn vị, dùng chung màu chữ */}
          <pattern id={patternId} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="4" stroke="currentColor" strokeWidth="1.6" />
          </pattern>
        </defs>
      )}

      {layoutSlots(figure.count).map((slot, i) => {
        const common = { fill, stroke: 'currentColor', strokeWidth: 2.5, strokeLinejoin: 'round' as const }
        // Hình tròn xoay không đổi; các hình khác tính sẵn toạ độ đỉnh đã xoay và đặt vào vị trí
        return figure.shape === 'circle' ? (
          <circle key={i} cx={slot.x} cy={slot.y} r={slot.radius * 0.9} {...common} />
        ) : (
          <polygon
            key={i}
            points={toSvgPoints(placePoints(shapePoints(figure.shape), slot, figure.rotation))}
            {...common}
          />
        )
      })}
    </svg>
  )
}

export default FigureView
