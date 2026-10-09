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

### Liên kết

| | Đường dẫn |
|---|---|
| Web (Vercel) | https://check-iq.vercel.app/ |
| Code (GitHub, Private) | https://github.com/ath353/Test-iq |

Vercel tự build và cập nhật web mỗi khi push lên nhánh `main`.

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

**Nguyên tắc dữ liệu:**
- Không sao chép đề có bản quyền (SHL, sách luyện thi…). Chỉ tham khảo dạng bài và tự tạo.
- **Mọi câu hỏi bắt buộc có lời giải từng bước** (trường `explanationSteps`): nêu quy luật và cách tính ra đáp án.
  Ít nhất 1 bước, không bước nào rỗng. Mỗi bộ sinh đề phải có test kiểm tra điều này.

---

## 2. Công nghệ

| Hạng mục | Lựa chọn |
|----------|----------|
| Framework | React 19 + TypeScript 6 |
| Build tool | Vite 8 |
| Kiểm tra code (lint) | oxlint (đi kèm template Vite) |
| Kiểm thử | Vitest (dùng cho bộ sinh đề) |
| Lưu trữ | localStorage (chưa có backend) |
| Quản lý phiên bản | Git, mỗi bước được duyệt là một commit, push lên GitHub |
| Hosting | Vercel (gói miễn phí), tự deploy khi push nhánh `main` |
| Môi trường | Node v24, npm 11, Windows |

Thêm thư viện mới **phải hỏi trước** và ghi lý do vào mục 7 (Nhật ký quyết định).

---

## 3. Quy trình làm việc (BẮT BUỘC)

1. **Làm từng bước một** theo Lộ trình (mục 6). Không làm trước bước chưa được giao.
2. **Hết mỗi bước phải DỪNG LẠI**, báo cáo: đã làm gì, file nào thay đổi, cách kiểm tra.
   Chờ người dùng **duyệt** rồi mới commit và chuyển sang bước tiếp theo.
3. **Không tự ý mở rộng phạm vi.** Phát hiện việc cần làm thêm thì đề xuất, không tự làm.
4. **Cập nhật file này** sau mỗi bước: trạng thái bước, nhật ký quyết định nếu có.
5. **Commit và push sau khi được duyệt**, message dạng: `[Bước X.Y] Mô tả ngắn`. Push xong thì web tự cập nhật.
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
- **CSS:** biến màu khai báo trong `src/index.css` (có cả chế độ tối), component chỉ dùng `var(--color-…)`, không viết mã màu trực tiếp.
  Tên class theo kiểu BEM: `khoi__phan-tu--bien-the` (ví dụ `option__label`, `option--selected`).

### Cấu trúc thư mục (dự kiến, cập nhật khi thay đổi)

```
src/
├── types/          # Kiểu dữ liệu dùng chung: question.ts (Question, TestConfig, TestResult…), bank.ts (câu hỏi soạn sẵn), figure.ts (ô hình)
├── config/         # Danh sách lựa chọn ở trang chủ + nhãn tiếng Việt (testOptions.ts)
├── generators/     # Bộ sinh đề: index.ts (điểm vào chung theo dạng bài) + mỗi dạng một file (numberSeries.ts, numerical.ts, logical.ts, verbal.ts, abstract.ts); bank.ts: soát dữ liệu JSON + ra đề từ ngân hàng (dùng chung)
├── data/           # Ngân hàng câu hỏi JSON soạn tay: logical.json, verbal.json
├── components/     # Component giao diện dùng lại (QuestionCard, QuestionNavigator, Timer, ReviewItem, OptionGroup, StimulusView, TableView, PassageView, FigureView, MatrixView), mỗi component kèm file .css cùng tên
├── pages/          # Các màn hình: HomePage → TestPage → ResultPage (App.tsx điều hướng)
├── hooks/          # Custom hooks (useTestTimer: đồng hồ đếm ngược / đếm xuôi)
└── utils/          # Hàm tiện ích (random.ts, time.ts, scoring.ts: chấm điểm, table.ts, format.ts: định dạng số kiểu VN, figure.ts: hình học của ô hình, storage.ts: đọc/ghi localStorage an toàn, activeTest.ts: lưu bài đang làm)
```

### Soạn câu hỏi JSON (Logic, Ngôn ngữ)

Mỗi câu trong `src/data/*.json` có dạng:

```json
{
  "id": "lg-001",
  "difficulty": "easy",
  "topic": "ordering",
  "prompt": "Dữ kiện 1.
Dữ kiện 2.

Câu hỏi?",
  "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3"],
  "answerIndex": 0,
  "explanationSteps": ["Bước 1…", "Bước 2…"],
  "fixedOrder": true
}
```

- `id`: duy nhất, dạng `<tiền tố>-<3 chữ số>` (Logic: `lg`). `difficulty`: `easy` / `medium` / `hard`.
- `topic` (Logic): `ordering` (sắp xếp thứ tự), `syllogism` (tam đoạn luận), `seating` (xếp chỗ ngồi).
- `prompt`: xuống dòng bằng `
`, mỗi dữ kiện một dòng. `options`: 3–5 lựa chọn, không kèm nhãn A/B/C.
- `answerIndex`: vị trí đáp án đúng, **đếm từ 0** (lựa chọn đầu tiên là 0).
- `fixedOrder` (không bắt buộc): `true` để giữ nguyên thứ tự lựa chọn (khi có lựa chọn kiểu "Không xác định được").
- Sửa file xong chạy `npm run test`: test sẽ báo rõ câu nào sai, sai ở đâu.

**Riêng dạng Ngôn ngữ** (`verbal.json`): một đoạn văn đi kèm nhiều nhận định, nên file chia 2 phần để không chép lại đoạn văn:

```json
{
  "passages": [{ "id": "vb-p01", "title": "Tên ngắn", "text": "Nội dung đoạn văn…" }],
  "statements": [{
    "id": "vb-001", "passageId": "vb-p01", "difficulty": "easy",
    "statement": "Nhận định cần đánh giá.",
    "answer": "true",
    "explanationSteps": ["Trích ý trong đoạn văn…", "Đáp án: Đúng."]
  }]
}
```

- `answer`: `true` (Đúng), `false` (Sai), `cannot-say` (Không đủ thông tin). Lựa chọn khi ra đề luôn là 3 lựa chọn cố định theo thứ tự này.
- Nhận định chỉ được đánh giá **dựa trên đoạn văn**, không dùng kiến thức bên ngoài.

### Lệnh thường dùng

| Lệnh | Tác dụng |
|------|----------|
| `npm run dev` | Chạy bản phát triển tại http://localhost:5173 |
| `npm run build` | Kiểm tra kiểu + build vào `dist` |
| `npm run lint` | Kiểm tra code bằng oxlint |
| `npm run test` | Chạy toàn bộ test một lần |
| `npm run test:watch` | Chạy test, tự chạy lại khi sửa code |

File test đặt **cạnh file được test**, đuôi `.test.ts` (ví dụ `random.ts` và `random.test.ts`).
Test component dùng đuôi `.test.tsx`, kết xuất ra HTML bằng `renderToStaticMarkup` (có sẵn trong `react-dom`, không cần thư viện test riêng).
File component (`.tsx`) chỉ export component; hàm tiện ích đặt trong `utils/` (để tính năng tự tải lại khi sửa code hoạt động đúng).

---

## 6. Lộ trình

### Giai đoạn 0: Thiết lập

| Bước | Nội dung | Tiêu chí hoàn thành | Trạng thái |
|------|----------|---------------------|------------|
| 0.1 | Tạo file CLAUDE.md | Người dùng đồng ý nội dung file | ✅ (commit cùng 0.2) |
| 0.2 | Khởi tạo Git + dự án Vite React TS, dọn code mẫu | `npm run dev` chạy, hiện trang trống có tiêu đề | ✅ |
| 0.3 | Tạo cấu trúc thư mục + kiểu dữ liệu chung (`Question`, `Option`…) + cài Vitest | `npm run test` chạy được, type rõ ràng có comment | ✅ |

### Giai đoạn 1: MVP dạng Dãy số

| Bước | Nội dung | Tiêu chí hoàn thành | Trạng thái |
|------|----------|---------------------|------------|
| 1.1 | Bộ sinh dãy số: các quy luật cơ bản (cộng, nhân, cộng tăng dần, bình phương, xen kẽ) | Có test: đáp án luôn đúng, đáp án nhiễu không trùng, lời giải từng bước không rỗng | ✅ |
| 1.2 | Màn hình làm bài: hiển thị câu hỏi, 4 đến 5 lựa chọn, chuyển câu | Làm được 1 bài 10 câu | ✅ |
| 1.3 | Đồng hồ đếm ngược cho cả bài | Hết giờ tự nộp bài | ✅ |
| 1.4 | Chấm điểm + màn hình kết quả + lời giải từng câu | Thấy điểm, câu sai, lời giải | ✅ |
| 1.5 | Trang chủ: chọn dạng bài, số câu, thời gian | Đi hết luồng Trang chủ → Làm bài → Kết quả | ✅ |
| 1.6 | Deploy lên Vercel: đẩy code lên GitHub, kết nối Vercel, ghi link vào file này | Mở được web qua link online, push là tự cập nhật | ✅ |

### Giai đoạn 2: Thêm dạng bài

Thứ tự: Số liệu → Logic → Ngôn ngữ → Hình (dạng sinh bằng code trước, dạng soạn tay sau, khó nhất cuối).

| Bước | Nội dung | Tiêu chí hoàn thành | Trạng thái |
|------|----------|---------------------|------------|
| 2.0 | Chuẩn bị nền tảng: mỗi câu có lời dẫn riêng; `Question` thêm phần "dữ kiện" (bảng, đoạn văn, hình); thẻ câu hỏi hiển thị theo từng loại | Dạng Dãy số vẫn chạy y như cũ, test đạt | ✅ |
| 2.1a | Số liệu: hiển thị bảng số liệu trong câu hỏi | Bảng đọc được trên điện thoại | ✅ |
| 2.1b | Số liệu: bộ sinh đề (tăng trưởng %, tỉ lệ, tổng, trung bình, chênh lệch) + test | Đáp án đúng, lời giải từng bước | ✅ |
| 2.1c | Số liệu: bật trên trang chủ | Làm hết một bài dạng Số liệu | ✅ |
| 2.2a | Logic: cấu trúc file JSON + test kiểm tra dữ liệu | Test bắt được câu thiếu đáp án / lời giải | ✅ |
| 2.2b | Logic: Claude soạn ~40 câu (sắp xếp thứ tự, tam đoạn luận, xếp chỗ ngồi), người dùng duyệt nội dung | Người dùng đồng ý từng câu | ✅ |
| 2.2c | Logic: bật trên trang chủ | Làm hết một bài dạng Logic | ✅ |
| 2.3a | Ngôn ngữ: soạn đoạn văn + nhận định (Đúng / Sai / Không đủ thông tin), người dùng duyệt | Người dùng đồng ý nội dung | ✅ |
| 2.3b | Ngôn ngữ: hiển thị đoạn văn + bật trên trang chủ | Làm hết một bài dạng Ngôn ngữ | ✅ |
| 2.4a | Hình: vẽ hình bằng SVG (dạng hình, màu, số lượng, góc xoay) | Hiển thị đúng ở chế độ sáng và tối | ✅ |
| 2.4b | Hình: bộ sinh ma trận 3x3 + đáp án nhiễu + test | Mỗi câu chỉ có đúng 1 đáp án hợp lệ | ✅ |
| 2.4c | Hình: lựa chọn đáp án dạng hình + bật trên trang chủ | Làm hết một bài dạng Hình | ✅ |

### Giai đoạn 3: Theo dõi tiến bộ

| Bước | Nội dung | Tiêu chí hoàn thành | Trạng thái |
|------|----------|---------------------|------------|
| 3.1 | Giữ bài đang làm khi tải lại trang: lưu câu đang xem, đáp án đã chọn, đồng hồ | F5 giữa bài vẫn làm tiếp; hết giờ trong lúc đóng tab thì mở lại tự nộp | ✅ |
| 3.2 | Lưu lịch sử kết quả trên trình duyệt (tối đa 200 bài gần nhất) | Nộp bài xong, tải lại trang, kết quả vẫn còn | 🔄 |
| 3.3 | Trang lịch sử: danh sách bài đã làm, xem lại chi tiết + lời giải | Mở lại được một bài cũ, xem đủ lời giải | ⬜ |
| 3.4 | Thống kê: % đúng theo dạng / độ khó, tiến bộ qua các lần làm, dạng yếu nhất | Thấy rõ dạng nào cần luyện thêm | ⬜ |
| 3.5 | Ưu tiên câu chưa làm cho Logic và Ngôn ngữ | Làm liên tiếp nhiều bài ít gặp lại câu cũ | ⬜ |
| 3.6 | Thi thử tổng hợp: một bài trộn nhiều dạng | Làm hết một bài tổng hợp, kết quả tách điểm theo từng dạng | ⬜ |

### Giai đoạn 4: Mở rộng đề

| Bước | Nội dung | Trạng thái |
|------|----------|------------|
| 4.1 | Logic sắp xếp thứ tự + xếp chỗ ngồi sinh bằng code (không giới hạn câu) | ⬜ |
| 4.2 | Dạng chuỗi 5 hình (SHL Inductive) | ⬜ |
| 4.3 | Soạn thêm ~40 nhận định Ngôn ngữ | ⬜ |
| 4.4 | Thêm quy luật cho Dãy số, Số liệu, Hình | ⬜ |

> Giai đoạn 4 sẽ được chia nhỏ chi tiết hơn khi tới lượt.

### Ý tưởng để sau (chưa đưa vào lộ trình)

- Máy tính nhỏ trên màn hình cho dạng Số liệu.
- Chế độ "không được quay lại câu trước" giống bài SHL thật.
- Đồng bộ lịch sử giữa nhiều máy (cần đăng nhập + máy chủ).

---

## 7. Nhật ký quyết định

| Ngày | Quyết định | Lý do |
|------|-----------|-------|
| 2026-10-08 | Dùng React + TS + Vite | Dễ mở rộng, có kiểm tra kiểu |
| 2026-10-08 | Đề sinh tự động bằng code, verbal/logic dùng JSON | Không hết đề, tránh bản quyền |
| 2026-10-08 | Comment tiếng Việt, tên biến tiếng Anh | Người dùng dễ kiểm soát code |
| 2026-10-08 | Git, commit sau mỗi bước được duyệt | Dễ quay lại khi sai |
| 2026-10-08 | Thêm bước 1.6 deploy Vercel cuối giai đoạn 1 | Có link online sớm để thử trên điện thoại, phát hiện lỗi môi trường thật |
| 2026-10-08 | Lời giải dạng từng bước (`explanationSteps: string[]`) thay cho một đoạn văn | Người dùng dễ theo dõi cách giải |
| 2026-10-08 | Dãy số: 5 lựa chọn A–E; dễ = cộng/nhân đều, trung bình = cộng tăng dần/bình phương, khó = xen kẽ | Giống bài SHL; độ khó tăng theo số bước suy luận |
| 2026-10-08 | Đáp án nhiễu ưu tiên "lỗi sai thường gặp" của từng quy luật | Đáp án nhiễu hợp lý, không bị loại dễ dàng |
| 2026-10-08 | Màn hình làm bài cho phép quay lại câu trước, nhảy câu, nộp sớm; hỏi xác nhận khi còn câu bỏ trống | Thuận tiện khi luyện tập; có thể thêm chế độ "không quay lại" giống SHL sau |
| 2026-10-08 | Thời gian mặc định 45 giây/câu; đồng hồ tính theo thời điểm kết thúc | Gần với bài SHL; không bị chạy chậm khi chuyển tab |
| 2026-10-08 | Hết giờ tự nộp không hỏi xác nhận; còn ≤ 60 giây thì đồng hồ chuyển đỏ | Giống bài thi thật |
| 2026-10-08 | Thêm `timedOut` vào `TestResult` | Màn hình kết quả cần báo bài nộp do hết giờ |
| 2026-10-08 | Kết quả chỉ hiện điểm và % đúng, KHÔNG quy đổi ra "điểm IQ" | Quy đổi IQ cần dữ liệu chuẩn hóa trên nhiều người; tự bịa công thức sẽ sai lệch |
| 2026-10-08 | Trang chủ: số câu 10/20/30; độ khó Hỗn hợp/Dễ/Trung bình/Khó; tốc độ 60/45/30 giây mỗi câu hoặc Không giới hạn | Người dùng chọn (bước 1.5) |
| 2026-10-08 | Dạng bài chưa làm hiện mờ kèm nhãn "Sắp có" | Người dùng thấy lộ trình của web |
| 2026-10-08 | `TestConfig` thêm `difficulty`; `timeLimitSec = null` nghĩa là không giới hạn (đồng hồ đếm xuôi) | Hỗ trợ lựa chọn ở trang chủ |
| 2026-10-08 | Thêm dạng bài mới: đăng ký trong `config/testOptions.ts` (available: true, timeMultiplier) và `generators/index.ts`; test tự báo lỗi nếu bật trên trang chủ mà quên đăng ký bộ sinh | Một chỗ duy nhất cho mỗi việc |
| 2026-10-09 | Repo GitHub để Private | Web vẫn công khai; code và email trong commit không bị lộ |
| 2026-10-09 | Giai đoạn 2 làm theo thứ tự Số liệu → Logic → Ngôn ngữ → Hình | Dạng sinh bằng code nhanh hơn, không giới hạn đề |
| 2026-10-09 | Dạng dùng ngân hàng câu hỏi (Logic, Ngôn ngữ) chỉ cho chọn 10/20 câu; giai đoạn 3 ưu tiên câu chưa làm | Ngân hàng có hạn, tránh lặp câu |
| 2026-10-09 | Ngôn ngữ chỉ có 3 lựa chọn: Đúng / Sai / Không đủ thông tin | Đúng chuẩn bài SHL |
| 2026-10-09 | `Question` thêm `instruction` (lời dẫn) và `stimulus` (dữ kiện: bảng / đoạn văn); kiểu dữ kiện HÌNH để bước 2.4a mới định nghĩa | Cấu trúc hình phụ thuộc cách vẽ SVG, định nghĩa sớm dễ phải sửa |
| 2026-10-09 | Thẻ câu hỏi có class theo dạng bài (`question-card--<dạng>`); đề mặc định chữ thường, giữ xuống dòng | Mỗi dạng một kiểu chữ phù hợp |
| 2026-10-09 | Bảng số liệu: cột số căn phải; bảng rộng thì cuộn ngang trong khung; màn kết quả hiện lại bảng + đề đầy đủ | Dễ đọc trên điện thoại; lời giải tham chiếu số trong bảng |
| 2026-10-09 | Số liệu: 4 bối cảnh (doanh thu, nhân sự, bán hàng, du lịch), bảng 4×4; dễ = chênh lệch/tổng, trung bình = % thay đổi/trung bình/tỉ trọng, khó = tăng trưởng cao nhất/dự báo | Bám sát dạng bài numerical của SHL |
| 2026-10-09 | Số hiển thị kiểu Việt Nam (1.234,5); làm tròn "nửa ra xa số 0" như tính tay; đáp án nhiễu cách đáp án đúng ≥ 3% | Tránh hai lựa chọn chỉ lệch nhau do làm tròn |
| 2026-10-09 | Mỗi dạng bài có hệ số thời gian (`timeMultiplier`): Dãy số ×1, Số liệu ×2 (120/90/60 giây/câu); nhãn tốc độ ở trang chủ tự đổi theo dạng bài | Số liệu cần đọc bảng và tính toán, bài SHL cho ~1–1,5 phút/câu |
| 2026-10-09 | Ngân hàng câu hỏi soạn tay dùng chung một cấu trúc JSON (`BankQuestion`) cho Logic và Ngôn ngữ; đáp án ghi bằng vị trí (`answerIndex`), khi ra đề mới xáo trộn và gán nhãn A–E | Người soạn không phải lo nhãn; một bộ soát lỗi dùng cho mọi ngân hàng |
| 2026-10-09 | Dữ liệu JSON được soát bằng test; có lỗi thì không ra đề (báo lỗi rõ câu nào, trường nào) | File soạn tay dễ sai sót |
| 2026-10-09 | Ngân hàng Logic 40 câu: 15 sắp xếp thứ tự, 13 tam đoạn luận, 12 xếp chỗ ngồi; 12 dễ, 15 trung bình, 13 khó | Đủ cho bài 10/20 câu |
| 2026-10-09 | Câu Logic được kiểm chứng bằng chương trình vét cạn (mọi hoán vị / mọi mô hình tập hợp) trước khi đưa vào; mỗi câu chỉ có đúng 1 đáp án | Tránh câu sai hoặc có 2 đáp án |
| 2026-10-09 | Logic: hệ số thời gian ×2 (120/90/60 giây/câu); chỉ cho chọn 10/20 câu | Câu xếp chỗ khó mất 1–2 phút; ngân hàng có hạn |
| 2026-10-09 | Ngân hàng không đủ câu cho độ khó đang chọn thì KHÓA lựa chọn số câu đó (kèm ghi chú số câu hiện có), không bù câu độ khó khác | Đề luôn đúng độ khó người dùng chọn |
| 2026-10-09 | Câu ra từ ngân hàng giữ nguyên mã gốc (ví dụ `lg-012`) | Để giai đoạn 3 thống kê theo từng câu, ưu tiên câu chưa làm |
| 2026-10-09 | Lựa chọn dài hơn 20 ký tự thì xếp danh sách dọc; màn kết quả hiện lại đề đầy đủ khi đề nhiều dòng | Đáp án Logic là cả câu, đề có nhiều tiền đề |
| 2026-10-09 | Ngôn ngữ dùng cấu trúc JSON riêng: `passages` + `statements` (nhận định trỏ tới đoạn văn qua `passageId`), thay vì dùng chung `BankQuestion` như đã định | Một đoạn văn có 4 nhận định; dùng chung cấu trúc thì phải chép đoạn văn 4 lần |
| 2026-10-09 | Ngân hàng Ngôn ngữ: 10 đoạn văn × 4 nhận định = 40 câu; đáp án 15 Đúng / 12 Sai / 13 Không đủ thông tin; test bắt buộc mỗi loại đáp án ≥ 25% | Tránh đoán bừa vẫn được điểm cao |
| 2026-10-09 | Ngôn ngữ: nhận định GOM THEO ĐOẠN VĂN (cùng đoạn văn thì đứng liền nhau); 3 lựa chọn cố định A Đúng / B Sai / C Không đủ thông tin; thời gian như Dãy số (×1); chỉ 10/20 câu | Giống bài SHL thật: đọc đoạn văn một lần, trả lời liên tiếp (~40 giây/nhận định) |
| 2026-10-09 | Ô hình = 1–4 hình giống nhau, 4 thuộc tính: dạng hình (8 loại), kiểu tô (đặc / rỗng / kẻ sọc), số lượng, góc xoay | Đủ để đặt quy luật ma trận kiểu Raven / SHL |
| 2026-10-09 | "Màu" của hình thể hiện bằng kiểu tô, KHÔNG dùng màu sắc thật; hình vẽ bằng màu chữ (currentColor) | Người mù màu vẫn làm được; tự đổi theo chế độ sáng / tối |
| 2026-10-09 | Toạ độ đỉnh tính sẵn bằng code (không dùng transform của SVG); có bảng chu kỳ đối xứng xoay của từng hình | Sọc / nét đều nhau ở mọi cỡ; tránh quy luật xoay mà mắt không thấy khác (vd. xoay hình vuông 90°) |
| 2026-10-09 | Ma trận hình: mỗi thuộc tính theo 1 quy luật theo hàng (không đổi / theo hàng / tăng dần / hoán vị); độ khó = số thuộc tính thay đổi (1/2/3); mức khó không dùng quy luật "theo hàng" | Bám dạng Raven / SHL; mức khó phải so sánh nhiều ô |
| 2026-10-09 | Mỗi đáp án nhiễu được đặt thử vào ô trống, nếu ma trận vẫn hợp lệ theo bất kỳ quy luật nào thì loại; ưu tiên bẫy "chép ô bên trái / phía trên" và "sai đúng một đặc điểm" | Đảm bảo chỉ 1 đáp án đúng, đáp án nhiễu hợp lý |
| 2026-10-09 | Đáp án nhiễu chỉ đổi góc xoay với tam giác / mũi tên (bội số 90°) | Hình vuông xoay 45° trông như hình thoi, dễ gây tranh cãi |
| 2026-10-09 | Suy luận hình: thời gian ×4/3 (80 / 60 / 40 giây/câu), số giây làm tròn; số câu 10/20/30 (sinh bằng code, không giới hạn) | Bài SHL thật ~60 giây mỗi ma trận |
| 2026-10-09 | Lựa chọn dạng hình hiển thị hình (có mô tả bằng lời cho trình đọc màn hình); màn kết quả hiện hình thu nhỏ ở "Bạn chọn / Đáp án đúng" | Dễ so sánh hình đã chọn với đáp án |
| 2026-10-09 | Giai đoạn 3 (theo dõi tiến bộ) làm trước giai đoạn 4 (mở rộng đề); bỏ máy tính trên màn hình (chuyển sang "Ý tưởng để sau") | Có thống kê mới biết cần mở rộng dạng nào |
| 2026-10-09 | Lịch sử chỉ lưu trên trình duyệt (localStorage), không đồng bộ giữa các máy | Không có máy chủ; đúng lựa chọn công nghệ ban đầu |
| 2026-10-09 | Bài đang làm lưu vào localStorage (khóa `test-iq:v1:active-test`) mỗi khi chọn đáp án / chuyển câu; mở web còn bài dở thì vào thẳng bài đó; nộp hoặc thoát thì xóa | F5 / lỡ đóng tab không mất bài |
| 2026-10-09 | Đồng hồ tính từ thời điểm bắt đầu đã lưu, KỂ CẢ lúc tab bị đóng; quá giờ thì mở lại tự nộp | Giống thi thật, không "dừng giờ" bằng cách đóng tab |
| 2026-10-09 | Thêm nút "Thoát bài" (có xác nhận) | Lưu bài đang làm khiến F5 không còn là cách thoát bài |
| 2026-10-09 | Mọi thao tác localStorage bọc try/catch, khóa có số phiên bản (`v1`); dữ liệu hỏng thì bỏ qua và xóa | Chế độ ẩn danh / bị chặn / dữ liệu cũ không làm web sập |
| 2026-10-08 | Thêm `.gitattributes` ép ký tự xuống dòng LF | Tránh lệch CRLF/LF giữa Windows và Vercel (Linux) |
