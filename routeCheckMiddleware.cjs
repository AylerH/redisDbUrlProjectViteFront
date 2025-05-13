/**
 * 路由检查中间件
 * 用于诊断API请求路径问题
 */

// 颜色标记
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * 创建一个中间件来记录所有请求
 */
function createRequestLogger() {
  return (req, res, next) => {
    // 记录基本请求信息
    const startTime = Date.now();
    const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    
    console.log(`${colors.cyan}[${requestId}] 请求开始: ${req.method} ${req.originalUrl}${colors.reset}`);
    console.log(`${colors.blue}[${requestId}] 请求头: ${JSON.stringify(req.headers)}${colors.reset}`);
    
    // 记录请求体 (如果有)
    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`${colors.blue}[${requestId}] 请求体: ${JSON.stringify(req.body)}${colors.reset}`);
    }
    
    // 捕获响应
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - startTime;
      
      // 确定状态颜色
      let statusColor = colors.green;
      if (res.statusCode >= 400) {
        statusColor = colors.red;
      } else if (res.statusCode >= 300) {
        statusColor = colors.yellow;
      }
      
      console.log(`${statusColor}[${requestId}] 响应状态: ${res.statusCode} (${duration}ms)${colors.reset}`);
      
      // 记录响应体，但限制大小
      const bodyString = body ? body.toString().substring(0, 200) : '';
      console.log(`${colors.blue}[${requestId}] 响应体: ${bodyString}${bodyString.length > 200 ? '...' : ''}${colors.reset}`);
      
      return originalSend.call(this, body);
    };
    
    next();
  };
}

/**
 * 创建API路径检查中间件
 */
function createApiPathChecker() {
  return (req, res, next) => {
    // 检查是否是API请求
    if (req.path.includes('/api/') || req.path.includes('/db_redis/')) {
      const isApiPath = req.path.startsWith('/api/');
      const isDbRedisPath = req.path.startsWith('/db_redis/');
      
      console.log(`${colors.yellow}[路径检查] 检测到API请求: ${req.path}${colors.reset}`);
      console.log(`${colors.yellow}[路径检查] 路径类型: ${isApiPath ? '/api/' : ''}${isDbRedisPath ? '/db_redis/' : ''}${colors.reset}`);
      
      // 建议路径修复
      if (isApiPath && req.path.includes('/api/db_redis/')) {
        const alternativePath = req.path.replace('/api/db_redis/', '/db_redis/');
        console.log(`${colors.green}[路径检查] 备选路径: ${alternativePath}${colors.reset}`);
      } else if (isDbRedisPath) {
        const alternativePath = '/api' + req.path;
        console.log(`${colors.green}[路径检查] 备选路径: ${alternativePath}${colors.reset}`);
      }
    }
    
    next();
  };
}

/**
 * 创建匹配信息记录中间件
 */
function createMatchLogger() {
  return (req, res, next) => {
    // 保存原始URL用于日志
    req.originalFullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    console.log(`${colors.cyan}[完整URL] ${req.originalFullUrl}${colors.reset}`);
    
    next();
  };
}

module.exports = {
  createRequestLogger,
  createApiPathChecker,
  createMatchLogger
}; 