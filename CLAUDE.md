# TEST-IQ: Web luyện thi năng lực nhận thức (IQ / Aptitude test)

> File này là **nguồn thông tin duy nhất** của dự án. Claude đọc file này trước mỗi lần làm việc
> và cập nhật nó sau mỗi bước. Mọi thay đổi về phạm vi, công nghệ hay quy trình phải được ghi lại ở đây.

---

## 1. Tổng quan

- **Mục tiêu:** Trang web giúp người dùng luyện các dạng bài test năng lực mà doanh nghiệp hay dùng
  khi tuyển dụng (SHL, Talent Q, Cut-e, Wonderlic…).
- **Người dùng:** Người đi xin việc, sinh viên chuẩn bị thi tuyển (Management Trainee, ngân hàng, Big4…).
- **Điểm khác biệt:** Đề được **sinh tự động bằng code** (không bao giờ hết đề) và có **lời giải chi tiết**.
- **Ngôn ngữ giao diện:** Tiếng Việt.

### Các dạng bài (phạm vi đầy đủ)

| # | Dạng | Nguồn dữ liệu | Giai đoạn |
|---|------|---------------|-----------|
| 1 | Dãy số (Number series) | Code tự sinh | 1 |
| 2 | Suy luận logic (Deductive) | Ngân hàng JSON | 2 |
| 3 | Suy luận số liệu (Numerical) | Code tự sinh | 2 |
| 4 | Suy luận ngôn ngữ (Verbal) | Ngân hàng JSON | 2 |
| 5 | Suy luận hình (Abstract / Matrix) | Code tự sinh + SVG | 2 |
| 6 | Sơ đồ biến đổi (Diagrammatic) | Code tự sinh + SVG | Sau MVP |
| 7 | Xoay hình (Spatial) | Code tự sinh + SVG | Sau MVP |

**Nguyên tắc dữ liệu:** Không sao chép đề có bản quyền (SHL, sách luyện thi…). Chỉ tham khảo dạng bài và tự tạo.

---

## 2. Công nghệ

| Hạng mục | Lựa chọn |
|----------|----------|
| Framework | React 19 + TypeScript 6 |
| Build tool | Vite 8 |
| Kiểm tra code (lint) | oxlint (đi kèm template Vite) |
| Kiểm thử | Vitest (dùng cho bộ sinh đề) |
| Lưu trữ | localStorage (chưa có backend) |
| Quản lý phiên bản | Git, mỗi bước được duyệt là một commit |
| Môi trường | Node v24, npm 11, Windows |

Thêm thư viện mới **phải hỏi trước** và ghi lý do vào mục 7 (Nhật ký quyết định).

---

## 3. Quy trình làm việc (BẮT BUỘC)

1. **Làm từng bước một** theo Lộ trình (mục 6). Không làm trước bước chưa được giao.
2. **Hết mỗi bước phải DỪNG LẠI**, báo cáo: đã làm gì, file nào thay đổi, cách kiểm tra.
   Chờ người dùng **duyệt** rồi mới commit và chuyển sang bước tiếp theo.
3. **Không tự ý mở rộng phạm vi.** Phát hiện việc cần làm thêm thì đề xuất, không tự làm.
4. **Cập nhật file này** sau mỗi bước: trạng thái bước, nhật ký quyết định nếu có.
5. **Commit sau khi được duyệt**, message dạng: `[Bước X.Y] Mô tả ngắn`.
6. Gặp chỗ chưa rõ thì **hỏi**, không đoán.

### Trạng thái bước

| Ký hiệu | Ý nghĩa |
|---------|---------|
| ⬜ | Chưa làm |
| 🔄 | Đang làm |
| ⏸️ | Xong, chờ duyệt |
| ✅ | Đã duyệt và commit |

---

## 4. Cú pháp báo lỗi / yêu cầu sửa

Người dùng báo lỗi theo mẫu:

```
Vị trí:   <file / màn hình / thành phần / dòng>
Vấn đề:   <đang sai thế nào>
Mong muốn: <kết quả đúng phải ra sao>
```

**Claude phải:**
- Chỉ sửa đúng phạm vi được chỉ ra, không sửa lan sang chỗ khác.
- Thiếu một trong ba phần thì hỏi lại trước khi sửa.
- Sau khi sửa, báo lại: đã sửa file nào, dòng nào, vì sao.

---

## 5. Quy ước code

- **Comment bằng tiếng Việt**, viết ngay khi code (không để dồn đến cuối):
  - Đầu mỗi file: 1 đến 2 dòng mô tả file làm gì.
  - Mỗi hàm/component: mô tả mục đích, tham số, giá trị trả về.
  - Logic khó (quy luật sinh đề, công thức chấm điểm): giải thích từng bước.
- Tên biến, hàm, file bằng **tiếng Anh**: `camelCase` cho biến/hàm, `PascalCase` cho component và type.
- Mỗi file một trách nhiệm chính. Bộ sinh đề là **hàm thuần** (không phụ thuộc React) để dễ test.
- Không dùng `any` trong TypeScript.

### Cấu trúc thư mục (dự kiến, cập nhật khi thay đổi)

```
src/
├── types/          # Kiểu dữ liệu dùng chung (Question, Answer, Result…)
├── generators/     # Bộ sinh đề tự động, mỗi dạng một file + file test
├── data/           # Ngân hàng câu hỏi JSON (logic, verbal)
├── components/     # Component giao diện dùng lại
├── pages/          # Các màn hình (Trang chủ, Làm bài, Kết quả)
├── hooks/          # Custom hooks (đồng hồ đếm ngược…)
└── utils/          # Hàm tiện ích (random, chấm điểm, lưu trữ…)
```

---

## 6. Lộ trình

### Giai đoạn 0: Thiết lập

| Bước | Nội dung | Tiêu chí hoàn thành | Trạng thái |
|------|----------|---------------------|------------|
| 0.1 | Tạo file CLAUDE.md | Người dùng đồng ý nội dung file | ✅ (commit cùng 0.2) |
| 0.2 | Khởi tạo Git + dự án Vite React TS, dọn code mẫu | `npm run dev` chạy, hiện trang trống có tiêu đề | ✅ |
| 0.3 | Tạo cấu trúc thư mục + kiểu dữ liệu chung (`Question`, `Option`…) + cài Vitest | `npm run test` chạy được, type rõ ràng có comment | ⬜ |

### Giai đoạn 1: MVP dạng Dãy số

| Bước | Nội dung | Tiêu chí hoàn thành | Trạng thái |
|------|----------|---------------------|------------|
| 1.1 | Bộ sinh dãy số: các quy luật cơ bản (cộng, nhân, cộng tăng dần, bình phương, xen kẽ) | Có test, đáp án luôn đúng, đáp án nhiễu không trùng | ⬜ |
| 1.2 | Màn hình làm bài: hiển thị câu hỏi, 4 đến 5 lựa chọn, chuyển câu | Làm được 1 bài 10 câu | ⬜ |
| 1.3 | Đồng hồ đếm ngược cho cả bài | Hết giờ tự nộp bài | ⬜ |
| 1.4 | Chấm điểm + màn hình kết quả + lời giải từng câu | Thấy điểm, câu sai, lời giải | ⬜ |
| 1.5 | Trang chủ: chọn dạng bài, số câu, thời gian | Đi hết luồng Trang chủ → Làm bài → Kết quả | ⬜ |
| 1.6 | Deploy lên Vercel: đẩy code lên GitHub, kết nối Vercel, ghi link vào file này | Mở được web qua link online, push là tự cập nhật | ⬜ |

### Giai đoạn 2: Thêm dạng bài

| Bước | Nội dung | Trạng thái |
|------|----------|------------|
| 2.1 | Suy luận logic (ngân hàng JSON) | ⬜ |
| 2.2 | Suy luận số liệu (sinh bảng + câu hỏi) | ⬜ |
| 2.3 | Suy luận ngôn ngữ (Đúng / Sai / Không đủ thông tin) | ⬜ |
| 2.4 | Suy luận hình ma trận 3x3 (SVG) | ⬜ |

### Giai đoạn 3: Nâng cao

| Bước | Nội dung | Trạng thái |
|------|----------|------------|
| 3.1 | Lưu lịch sử làm bài (localStorage) | ⬜ |
| 3.2 | Thống kê điểm mạnh / yếu theo dạng | ⬜ |
| 3.3 | Chế độ thi thử tổng hợp nhiều dạng | ⬜ |

> Giai đoạn 2 và 3 sẽ được chia nhỏ chi tiết hơn khi tới lượt.

---

## 7. Nhật ký quyết định

| Ngày | Quyết định | Lý do |
|------|-----------|-------|
| 2026-10-08 | Dùng React + TS + Vite | Dễ mở rộng, có kiểm tra kiểu |
| 2026-10-08 | Đề sinh tự động bằng code, verbal/logic dùng JSON | Không hết đề, tránh bản quyền |
| 2026-10-08 | Comment tiếng Việt, tên biến tiếng Anh | Người dùng dễ kiểm soát code |
| 2026-10-08 | Git, commit sau mỗi bước được duyệt | Dễ quay lại khi sai |
| 2026-10-08 | Thêm bước 1.6 deploy Vercel cuối giai đoạn 1 | Có link online sớm để thử trên điện thoại, phát hiện lỗi môi trường thật |
| 2026-10-08 | Thêm `.gitattributes` ép ký tự xuống dòng LF | Tránh lệch CRLF/LF giữa Windows và Vercel (Linux) |
