const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const axios = require('axios');
const directRequests = require('./directRequests.cjs');
const healthCheck = require('./healthCheck.cjs');
const app = express();

// API后端服务地址
const BACKEND_URL = 'https://redis-ctl-api.onrender.com';
console.log('后端API URL:', BACKEND_URL);

// 使用JSON解析中间件
app.use(express.json());

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
  onError: (err, req, res, next) => {
    console.error('代理错误:', err);
    // 让请求继续，可能由直接请求处理
    next();
  }
});

// DB Redis代理配置
const dbRedisProxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res, next) => {
    console.error('db_redis代理错误:', err);
    // 让请求继续，可能由直接请求处理
    next();
  }
});

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

// 健康检查路由
app.get('/health', healthCheck.healthCheckHandler);
app.get('/api/health', healthCheck.healthCheckHandler); // 备用路径

// 直接处理特定请求
app.get('/db_redis/databases', directRequests.getDatabases);
app.get('/db_redis/:dbName/entity/:companyId', directRequests.getCompanyById);
app.get('/db_redis/:dbName/fields', directRequests.getDbFields);
app.get('/db_redis/:dbName/list', directRequests.listCompanies);
app.post('/db_redis/:dbName/fuzzy_match/id', directRequests.matchCompanyById);

// 尝试代理其他请求
app.use('/api', apiProxy);
app.use('/db_redis', dbRedisProxy);

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

// 初始化健康检查
healthCheck.initialize().then(() => {
  // 启动服务器
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`健康检查可访问：http://localhost:${PORT}/health`);
  });
}); 