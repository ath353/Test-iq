// Nhóm nút "chọn một trong nhiều" (dạng nút bấm nằm ngang), dùng cho các lựa chọn ở trang chủ.
import './OptionGroup.css'

interface OptionGroupProps<T extends string | number> {
  /** Tiêu đề nhóm, ví dụ "Số câu". */
  label: string
  /** Danh sách lựa chọn: giá trị và chữ hiển thị. */
  options: { value: T; label: string }[]
  /** Giá trị đang chọn. */
  value: T
  /** Gọi khi người dùng chọn giá trị khác. */
  onChange: (value: T) => void
}

/**
 * OptionGroup: các nút nằm cạnh nhau, nút đang chọn được tô màu.
 * Dùng role="radiogroup" để trình đọc màn hình hiểu đây là nhóm chọn một.
 */
function OptionGroup<T extends string | number>({ label, options, value, onChange }: OptionGroupProps<T>) {
  return (
    <fieldset className="option-group">
      <legend className="option-group__label">{label}</legend>
      <div className="option-group__items" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const isSelected = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`option-group__item${isSelected ? ' option-group__item--selected' : ''}`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default OptionGroup
