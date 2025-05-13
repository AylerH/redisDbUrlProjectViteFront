// testApiEndpoints.cjs
const axios = require('axios');

// 配置
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const BACKEND_URL = 'https://redis-ctl-api.onrender.com';

// 测试端点
const endpoints = [
  { name: '健康检查', path: '/health', method: 'GET' },
  { name: '获取数据库列表(直接)', path: '/db_redis/databases', method: 'GET' },
  { name: '获取数据库列表(代理)', path: '/api/db_redis/databases', method: 'GET' },
  { name: '后端健康检查', path: `${BACKEND_URL}/db_redis/health`, method: 'GET', direct: true }
];

// 颜色标记
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// 格式化输出
function formatResponse(data) {
  if (typeof data === 'object') {
    return JSON.stringify(data, null, 2);
  }
  return data;
}

// 测试单个端点
async function testEndpoint(endpoint) {
  console.log(`${colors.blue}测试: ${endpoint.name} (${endpoint.method} ${endpoint.path})${colors.reset}`);
  
  try {
    const url = endpoint.direct ? endpoint.path : `${BASE_URL}${endpoint.path}`;
    console.log(`请求URL: ${url}`);
    
    const startTime = Date.now();
    const response = await axios({
      method: endpoint.method.toLowerCase(),
      url: url,
      timeout: 10000,
      validateStatus: () => true // 返回所有状态码
    });
    const duration = Date.now() - startTime;
    
    // 状态颜色
    const statusColor = response.status >= 200 && response.status < 300 ? colors.green : colors.red;
    
    console.log(`状态: ${statusColor}${response.status}${colors.reset}`);
    console.log(`耗时: ${duration}ms`);
    console.log(`响应头: `, response.headers);
    console.log(`响应数据: ${formatResponse(response.data)}`);
  } catch (err) {
    console.log(`${colors.red}错误: ${err.message}${colors.reset}`);
    if (err.response) {
      console.log(`状态: ${err.response.status}`);
      console.log(`响应: ${formatResponse(err.response.data)}`);
    }
  }
  
  console.log(`${colors.yellow}--------------------------------${colors.reset}\n`);
}

// 运行所有测试
async function runTests() {
  console.log(`${colors.green}开始API端点测试${colors.reset}`);
  console.log(`基础URL: ${BASE_URL}`);
  console.log(`${colors.yellow}================================${colors.reset}\n`);
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log(`${colors.green}测试完成${colors.reset}`);
}

// 执行测试
runTests().catch(err => {
  console.error(`${colors.red}测试失败: ${err.message}${colors.reset}`);
  process.exit(1);
}); 