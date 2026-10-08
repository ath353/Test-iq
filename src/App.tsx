// Component gốc của ứng dụng.
// Hiện chỉ hiển thị tiêu đề; các màn hình (Trang chủ, Làm bài, Kết quả) sẽ được thêm ở giai đoạn 1.

/**
 * App: khung ngoài cùng của trang web.
 * @returns Giao diện trang hiện tại.
 */
function App() {
  return (
    <main className="app">
      <h1>Luyện Test IQ</h1>
      <p>Luyện các dạng bài test năng lực khi tuyển dụng.</p>
    </main>
  )
}

export default App
