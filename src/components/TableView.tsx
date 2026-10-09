// Hiển thị dữ kiện dạng bảng số liệu (dạng Số liệu): tên bảng, bảng, ghi chú.
import type { TableStimulus } from '../types/question'
import { isNumericCell } from '../utils/table'
import './TableView.css'

interface TableViewProps {
  table: TableStimulus
}

/**
 * TableView: bảng số liệu.
 * - Ô số căn phải, chữ số rộng bằng nhau để các cột thẳng hàng.
 * - Cột đầu tiên (tên dòng) đậm hơn.
 * - Bảng rộng hơn màn hình (điện thoại) thì cuộn ngang trong khung, không làm vỡ trang.
 */
function TableView({ table }: TableViewProps) {
  // Cột số = mọi ô trong cột đều là số (trừ cột đầu là tên dòng). Cột số căn phải cả tiêu đề lẫn ô.
  const numericColumns = table.headers.map(
    (_, c) => c > 0 && table.rows.every((row) => isNumericCell(row[c] ?? '')),
  )
  const numericClass = (c: number) => (numericColumns[c] ? 'table-view__cell--numeric' : undefined)

  return (
    <figure className="table-view">
      {/* Khung cuộn ngang; tabIndex để người dùng bàn phím cũng cuộn được */}
      <div className="table-view__scroll" tabIndex={0} role="region" aria-label={table.title}>
        <table className="table-view__table">
          <caption className="table-view__title">{table.title}</caption>
          <thead>
            <tr>
              {table.headers.map((header, i) => (
                <th key={i} scope="col" className={numericClass(i)}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) =>
                  // Ô đầu mỗi dòng là tên dòng (th), các ô còn lại là dữ liệu (td)
                  c === 0 ? (
                    <th key={c} scope="row">
                      {cell}
                    </th>
                  ) : (
                    <td key={c} className={numericClass(c)}>
                      {cell}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.note && <figcaption className="table-view__note">{table.note}</figcaption>}
    </figure>
  )
}

export default TableView
