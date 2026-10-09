// Nhóm nút "chọn một trong nhiều" (dạng nút bấm nằm ngang), dùng cho các lựa chọn ở trang chủ.
import './OptionGroup.css'

interface OptionGroupProps<T extends string | number> {
  /** Tiêu đề nhóm, ví dụ "Số câu". */
  label: string
  /** Danh sách lựa chọn: giá trị, chữ hiển thị, và có bị khóa không (khóa thì mờ, không bấm được). */
  options: { value: T; label: string; disabled?: boolean }[]
  /** Giá trị đang chọn. */
  value: T
  /** Gọi khi người dùng chọn giá trị khác. */
  onChange: (value: T) => void
  /** Dòng ghi chú nhỏ bên dưới nhóm (ví dụ giải thích vì sao có lựa chọn bị khóa). */
  hint?: string
}

/**
 * OptionGroup: các nút nằm cạnh nhau, nút đang chọn được tô màu.
 * Dùng role="radiogroup" để trình đọc màn hình hiểu đây là nhóm chọn một.
 */
function OptionGroup<T extends string | number>({ label, options, value, onChange, hint }: OptionGroupProps<T>) {
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
              disabled={option.disabled}
              className={`option-group__item${isSelected ? ' option-group__item--selected' : ''}`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {hint && <p className="option-group__hint">{hint}</p>}
    </fieldset>
  )
}

export default OptionGroup
