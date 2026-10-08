// Cấu hình Vite (build, chạy dev) và Vitest (kiểm thử) chung một file.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Chỉ chạy file *.test.ts trong src
    include: ['src/**/*.test.ts'],
  },
})
