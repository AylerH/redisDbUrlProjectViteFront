import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 配置代理
      '/api': {
        target: 'https://redis-ctl-api.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('代理错误', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('发送请求到:', req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('收到响应:', proxyRes.statusCode, req.url);
          });
        },
      },
      // 新增直接路径的代理，确保/db_redis路径也能正确转发
      '/db_redis': {
        target: 'https://redis-ctl-api.onrender.com',
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('db_redis代理错误', err);
          });
        }
      }
    },
  },
})
