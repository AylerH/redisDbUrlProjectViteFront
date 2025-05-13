const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const axios = require('axios');
const directRequests = require('./directRequests.cjs');
const healthCheck = require('./healthCheck.cjs');
const routeCheck = require('./routeCheckMiddleware.cjs');
const fs = require('fs');
const app = express();

// 尝试从.env文件读取后端URL
let BACKEND_URL = 'https://redis-ctl-api.onrender.com'; // 默认值

// 读取.env文件
try {
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    const envLines = envContent.split('\n');
    
    for (const line of envLines) {
      if (line.startsWith('backend_url=')) {
        BACKEND_URL = line.substring('backend_url='.length).trim();
        break;
      }
    }
  }
} catch (err) {
  console.error('读取.env文件失败:', err);
}

// 从环境变量中读取后端URL（如果存在）
if (process.env.backend_url) {
  BACKEND_URL = process.env.backend_url;
}

console.log('后端API URL:', BACKEND_URL);

// 环境信息
const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.RENDER === 'true';
console.log(`环境: ${isProduction ? '生产' : '开发'}, Render环境: ${isRender ? '是' : '否'}`);

// 导出后端URL供其他模块使用
process.env.BACKEND_URL = BACKEND_URL;

// 使用JSON解析中间件
app.use(express.json());

// 添加路由检查中间件（仅在生产环境启用完整日志）
app.use(routeCheck.createMatchLogger());
if (isRender) {
  console.log('启用详细请求日志...');
  app.use(routeCheck.createRequestLogger());
  app.use(routeCheck.createApiPathChecker());
} else {
  // 在非Render环境中使用简化的请求日志
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
  });
}

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

// ======== 重要：提供后端URL配置的接口 ========
// 注意：这些路由必须在任何代理之前定义，确保它们总是可访问的
app.get('/config/backend-url', (req, res) => {
  console.log('提供后端URL配置 (无前缀路径)');
  res.json({ backend_url: BACKEND_URL });
});

app.get('/api/config/backend-url', (req, res) => {
  console.log('提供后端URL配置 (带前缀路径)');
  res.json({ backend_url: BACKEND_URL });
});

// 简化路径，任何位置都能访问的配置
app.get('*/backend-url', (req, res) => {
  console.log('提供后端URL配置 (通配路径)');
  res.json({ backend_url: BACKEND_URL });
});

// 健康检查路由
app.get('/health', healthCheck.healthCheckHandler);
app.get('/api/health', healthCheck.healthCheckHandler); // 备用路径

// 特殊路由处理 - 直接处理API请求
console.log('设置直接请求处理程序');

// 处理常见API路径 - 包括带和不带/api前缀的路径
app.get('/db_redis/databases', directRequests.getDatabases);
app.get('/api/db_redis/databases', directRequests.getDatabases);

app.get('/db_redis/:dbName/entity/:companyId', directRequests.getCompanyById);
app.get('/api/db_redis/:dbName/entity/:companyId', directRequests.getCompanyById);

app.get('/db_redis/:dbName/fields', directRequests.getDbFields);
app.get('/api/db_redis/:dbName/fields', directRequests.getDbFields);

app.get('/db_redis/:dbName/list', directRequests.listCompanies);
app.get('/api/db_redis/:dbName/list', directRequests.listCompanies);

app.post('/db_redis/:dbName/fuzzy_match/id', directRequests.matchCompanyById);
app.post('/api/db_redis/:dbName/fuzzy_match/id', directRequests.matchCompanyById);

// 修复 - 确保/api/db_redis/databases路径工作正常
app.get('/api/db_redis/databases', (req, res) => {
  console.log('捕获到特殊路径: /api/db_redis/databases');
  directRequests.getDatabases(req, res);
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