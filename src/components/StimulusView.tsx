// Chọn cách hiển thị phần dữ kiện của câu hỏi theo loại (bảng, đoạn văn…).
import type { Stimulus } from '../types/question'
import TableView from './TableView'

interface StimulusViewProps {
  stimulus: Stimulus
}

/**
 * StimulusView: nhận dữ kiện bất kỳ, gọi đúng component hiển thị.
 * Thêm loại dữ kiện mới thì bổ sung một nhánh vào switch; TypeScript sẽ báo lỗi nếu thiếu nhánh.
 */
function StimulusView({ stimulus }: StimulusViewProps) {
  switch (stimulus.type) {
    case 'table':
      return <TableView table={stimulus} />
    case 'passage':
      // Đoạn văn sẽ được hiển thị ở bước 2.3b
      return null
  }
}

export default StimulusView
