// Hook đo bề rộng thật của một phần tử và cập nhật khi phần tử đổi kích thước (xoay điện thoại, đổi cỡ cửa sổ).
import { useEffect, useRef, useState } from 'react'

/**
 * useElementWidth: gắn ref vào phần tử cần đo, nhận lại bề rộng (px).
 * Dùng cho biểu đồ SVG để vẽ theo đúng điểm ảnh, chữ không bị co nhỏ trên điện thoại.
 * @param fallback Bề rộng tạm khi chưa đo được (lần vẽ đầu tiên, hoặc môi trường không có ResizeObserver).
 * @returns [ref gắn vào phần tử, bề rộng hiện tại]
 */
export function useElementWidth<T extends HTMLElement>(fallback = 600) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    // Theo dõi kích thước; làm tròn để không vẽ lại vì chênh lệch lẻ dưới 1px
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}
