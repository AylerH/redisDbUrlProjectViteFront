const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const app = express();

// 设置API代理
const apiProxy = createProxyMiddleware({
  target: 'https://redis-ctl-api.onrender.com',
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

// API请求代理
app.use('/api', apiProxy);
app.use('/db_redis', apiProxy);

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// 所有其他请求返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 设置端口
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 