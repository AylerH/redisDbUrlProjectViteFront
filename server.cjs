const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();

// API后端服务地址
const BACKEND_URL = 'https://redis-ctl-api.onrender.com';
console.log('后端API URL:', BACKEND_URL);

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// API代理配置
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

// DB Redis代理配置
const dbRedisProxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('db_redis代理错误:', err);
    res.status(500).send('db_redis代理请求失败');
  }
});

// 配置API代理
app.use('/api', apiProxy);
app.use('/db_redis', dbRedisProxy);

// CORS配置
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

// SPA路由支持
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).send('服务器内部错误');
});

// 端口配置
const PORT = process.env.PORT || 3000;

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 