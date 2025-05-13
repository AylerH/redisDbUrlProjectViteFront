// healthCheck.cjs
const axios = require('axios');

// 从环境变量获取API后端地址
const BACKEND_URL = process.env.BACKEND_URL || 'https://redis-ctl-api.onrender.com';
console.log('健康检查模块 - 后端API URL:', BACKEND_URL);

// 后端健康状态
let backendHealth = {
  status: 'unknown',
  lastCheck: null,
  error: null
};

// 检查后端健康状态
async function checkBackendHealth() {
  try {
    const startTime = Date.now();
    const response = await axios.get(`${BACKEND_URL}/db_redis/health`, {
      timeout: 5000
    });
    const responseTime = Date.now() - startTime;
    
    backendHealth = {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: null
    };
    
    console.log(`后端健康检查成功，响应时间: ${responseTime}ms`);
    return true;
  } catch (err) {
    backendHealth = {
      status: 'unhealthy',
      lastCheck: new Date().toISOString(),
      error: err.message
    };
    
    console.error('后端健康检查失败:', err.message);
    return false;
  }
}

// 获取当前健康状态
function getHealthStatus() {
  return {
    server: {
      status: 'healthy',
      uptime: process.uptime()
    },
    backend: backendHealth,
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      backendUrl: BACKEND_URL
    }
  };
}

// 健康检查路由处理程序
function healthCheckHandler(req, res) {
  res.json(getHealthStatus());
}

// 初始化函数 - 在服务器启动时调用
async function initialize() {
  // 首次健康检查
  await checkBackendHealth();
  
  // 设置定期健康检查 (每5分钟)
  setInterval(checkBackendHealth, 5 * 60 * 1000);
}

module.exports = {
  initialize,
  healthCheckHandler,
  checkBackendHealth
}; 