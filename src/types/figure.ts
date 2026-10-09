// Kiểu dữ liệu của một ô hình (dạng Suy luận hình). Mỗi ô gồm 1–4 hình giống hệt nhau,
// xác định bởi 4 thuộc tính: dạng hình, kiểu tô, số lượng, góc xoay.
// Bộ sinh đề (bước 2.4b) đặt quy luật lên các thuộc tính này, ví dụ "số lượng tăng dần theo hàng".

/** Dạng hình. */
export type ShapeKind =
  | 'circle' // hình tròn
  | 'square' // hình vuông
  | 'triangle' // tam giác đều
  | 'diamond' // hình thoi
  | 'pentagon' // ngũ giác đều
  | 'hexagon' // lục giác đều
  | 'star' // ngôi sao 5 cánh
  | 'arrow' // mũi tên

/**
 * Kiểu tô ("màu" của hình), không dùng màu sắc thật để người mù màu vẫn làm được
 * và hình tự đổi theo chế độ sáng / tối.
 */
export type ShapeFill =
  | 'solid' // tô đặc
  | 'outline' // để rỗng, chỉ có viền
  | 'striped' // kẻ sọc chéo

/** Một ô hình trong ma trận hoặc trong lựa chọn đáp án. */
export interface Figure {
  shape: ShapeKind
  fill: ShapeFill
  /** Số hình trong ô: 1 đến 4. */
  count: number
  /** Góc xoay theo chiều kim đồng hồ, tính bằng độ (0, 45, 90…). Hình tròn xoay không đổi nên luôn để 0. */
  rotation: number
}
