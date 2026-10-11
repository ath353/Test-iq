// Hiển thị dữ kiện dạng chuỗi hình (dạng Suy luận hình, kiểu SHL Inductive); ô cuối hiện dấu "?".
import type { SequenceStimulus } from '../types/question'
import FigureView from './FigureView'
import './SequenceView.css'

interface SequenceViewProps {
  sequence: SequenceStimulus
}

/**
 * SequenceView: các ô hình xếp một hàng ngang, đọc từ trái sang phải; ô null (hình cần tìm) hiện dấu "?".
 * Giữa các ô có mũi tên nhỏ để thể hiện chiều đọc. Ô tự co theo bề rộng để luôn vừa một hàng (cả trên điện thoại).
 */
function SequenceView({ sequence }: SequenceViewProps) {
  return (
    <ol className="sequence-view" aria-label={`Chuỗi ${sequence.cells.length} hình, đọc từ trái sang phải`}>
      {sequence.cells.map((cell, i) => (
        <li key={i} className={`sequence-view__cell${cell ? '' : ' sequence-view__cell--missing'}`}>
          {cell ? <FigureView figure={cell} /> : <span aria-label="Hình cần tìm">?</span>}
        </li>
      ))}
    </ol>
  )
}

export default SequenceView
