const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();

// 环境变量
const isProduction = process.env.NODE_ENV === 'production';
const BACKEND_URL = process.env.BACKEND_URL || 'https://redis-ctl-api.onrender.com';

console.log('服务器启动环境:', isProduction ? '生产环境' : '开发环境');
console.log('后端API URL:', BACKEND_URL);

// 增加请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// 设置API代理
const apiProxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '' // 移除/api前缀
  },
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('代理错误:', err);
    res.status(500).send('代理请求失败');
  }
});

// DB Redis代理
const dbRedisProxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('db_redis代理错误:', err);
    res.status(500).send('db_redis代理请求失败');
  }
});

// API请求代理
app.use('/api', apiProxy);
app.use('/db_redis', dbRedisProxy);

// CORS支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 所有其他请求返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).send('服务器内部错误');
});

// 设置端口
const PORT = process.env.PORT || 3000;

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 