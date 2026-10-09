// Hiển thị dữ kiện dạng ma trận hình 3 × 3 (dạng Suy luận hình); ô cần tìm hiện dấu "?".
import type { MatrixStimulus } from '../types/question'
import FigureView from './FigureView'
import './MatrixView.css'

interface MatrixViewProps {
  matrix: MatrixStimulus
}

/**
 * MatrixView: lưới 3 × 3 ô vuông, mỗi ô một hình; ô null (ô cần tìm) hiện dấu "?" nổi bật.
 * Ô tự co theo bề rộng màn hình (tối đa ~110px) để vừa điện thoại.
 */
function MatrixView({ matrix }: MatrixViewProps) {
  return (
    <div className="matrix-view" role="group" aria-label="Ma trận hình 3 × 3">
      {matrix.cells.map((cell, i) =>
        cell ? (
          <div key={i} className="matrix-view__cell">
            <FigureView figure={cell} />
          </div>
        ) : (
          <div key={i} className="matrix-view__cell matrix-view__cell--missing" aria-label="Ô cần tìm">
            ?
          </div>
        ),
      )}
    </div>
  )
}

export default MatrixView
