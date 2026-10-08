// Điểm khởi chạy của ứng dụng: gắn component gốc <App /> vào thẻ #root trong index.html.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode giúp phát hiện sớm lỗi tiềm ẩn khi phát triển (không ảnh hưởng bản build).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
