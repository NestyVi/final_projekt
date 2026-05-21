import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/

export default defineConfig({
server: {
host: true, // Разрешает подключение с любого IP-адреса и в докере
port: 5173
// Устанавливает порт для сервера разработки
},
plugins: [react()],
})
