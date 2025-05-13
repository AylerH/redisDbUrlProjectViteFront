const axios = require('axios');

// API后端服务地址
const BACKEND_URL = 'https://redis-ctl-api.onrender.com';
console.log('直接请求模块 - 后端API URL:', BACKEND_URL);

// 判断是否在Render环境中
const isRenderEnvironment = process.env.RENDER === 'true';
console.log('运行环境:', isRenderEnvironment ? 'Render生产环境' : '本地开发环境');

// 请求配置
const REQUEST_CONFIG = {
  timeout: 8000, // 8秒超时
  maxRetries: 2,  // 最大重试次数
  retryDelay: 1000 // 重试延迟毫秒
};

// 带重试的请求函数
async function requestWithRetry(url, options = {}, retries = REQUEST_CONFIG.maxRetries) {
  console.log(`开始请求: ${options.method || 'GET'} ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await axios({
      url,
      timeout: REQUEST_CONFIG.timeout,
      ...options
    });
    const duration = Date.now() - startTime;
    console.log(`请求成功: ${options.method || 'GET'} ${url} - ${duration}ms`);
    console.log(`响应状态: ${response.status}`);
    return response;
  } catch (err) {
    // 请求错误处理
    if (err.response) {
      // 服务器响应了错误状态码
      console.error(`服务器错误: ${err.response.status} - ${url}`);
      console.error(`响应数据:`, err.response.data);
      throw err;
    } else if (err.request) {
      // 请求发送但没有收到响应
      console.error(`无响应错误: ${url} - ${err.message}`);
      
      // 重试逻辑
      if (retries > 0) {
        console.log(`重试请求 (${REQUEST_CONFIG.maxRetries - retries + 1}/${REQUEST_CONFIG.maxRetries}): ${url}`);
        await new Promise(resolve => setTimeout(resolve, REQUEST_CONFIG.retryDelay));
        return requestWithRetry(url, options, retries - 1);
      }
    } else {
      // 请求设置时出错
      console.error(`请求设置错误: ${url} - ${err.message}`);
    }
    throw err;
  }
}

// 检查缓存有效性的工具函数
function isCacheValid(cache) {
  return cache && 
         cache.timestamp && 
         Date.now() - cache.timestamp < 5 * 60 * 1000; // 5分钟缓存
}

// 缓存存储
const cache = {
  databases: null
};

// 数据库列表处理程序
async function getDatabases(req, res) {
  console.log(`接收到数据库列表请求 - URL: ${req.originalUrl}, 方法: ${req.method}`);
  
  try {
    // 检查是否有有效缓存
    if (isCacheValid(cache.databases)) {
      console.log('使用缓存的数据库列表');
      return res.json(cache.databases.data);
    }

    console.log('直接请求数据库列表...');
    console.log(`请求URL: ${BACKEND_URL}/db_redis/databases`);
    
    const response = await requestWithRetry(`${BACKEND_URL}/db_redis/databases`);
    
    // 更新缓存
    cache.databases = {
      timestamp: Date.now(),
      data: response.data
    };
    
    console.log('数据库列表获取成功:', response.data);
    return res.json(response.data);
  } catch (err) {
    console.error('直接请求数据库列表失败:', err.message);
    
    // 如果有过期缓存，使用它作为备份
    if (cache.databases) {
      console.log('使用过期缓存作为备份');
      return res.json(cache.databases.data);
    }
    
    // 返回模拟数据，防止前端崩溃
    return res.status(500).json({
      error: '无法获取数据库列表',
      message: err.message,
      databases: ["company_db", "test_db", "prod_db", "dev_db"]
    });
  }
}

// 获取公司详情处理程序
async function getCompanyById(req, res) {
  const { dbName, companyId } = req.params;
  console.log(`接收到公司详情请求 - URL: ${req.originalUrl}, 数据库: ${dbName}, ID: ${companyId}`);
  
  try {
    console.log(`直接请求公司详情: ${dbName}/${companyId}`);
    const response = await requestWithRetry(`${BACKEND_URL}/db_redis/${dbName}/entity/${companyId}`);
    return res.json(response.data);
  } catch (err) {
    console.error(`直接请求公司详情失败: ${dbName}/${companyId}`, err.message);
    return res.status(500).json({ 
      error: '无法获取公司详情',
      message: err.message
    });
  }
}

// 获取数据库字段处理程序
async function getDbFields(req, res) {
  const { dbName } = req.params;
  console.log(`接收到数据库字段请求 - URL: ${req.originalUrl}, 数据库: ${dbName}`);
  
  try {
    console.log(`直接请求数据库字段: ${dbName}`);
    const response = await requestWithRetry(`${BACKEND_URL}/db_redis/${dbName}/fields`);
    return res.json(response.data);
  } catch (err) {
    console.error(`直接请求数据库字段失败: ${dbName}`, err.message);
    return res.status(500).json({ 
      error: '无法获取数据库字段',
      message: err.message
    });
  }
}

// 获取公司列表处理程序
async function listCompanies(req, res) {
  const { dbName } = req.params;
  const { limit = 100, offset = 0 } = req.query;
  console.log(`接收到公司列表请求 - URL: ${req.originalUrl}, 数据库: ${dbName}, limit: ${limit}, offset: ${offset}`);
  
  try {
    console.log(`直接请求公司列表: ${dbName} (limit=${limit}, offset=${offset})`);
    const response = await requestWithRetry(
      `${BACKEND_URL}/db_redis/${dbName}/list?limit=${limit}&offset=${offset}`
    );
    return res.json(response.data);
  } catch (err) {
    console.error(`直接请求公司列表失败: ${dbName}`, err.message);
    return res.status(500).json({ 
      error: '无法获取公司列表',
      message: err.message
    });
  }
}

// 模糊匹配公司ID处理程序
async function matchCompanyById(req, res) {
  const { dbName } = req.params;
  console.log(`接收到模糊匹配请求 - URL: ${req.originalUrl}, 数据库: ${dbName}`);
  
  try {
    console.log(`直接请求模糊匹配公司ID: ${dbName}`);
    const response = await requestWithRetry(
      `${BACKEND_URL}/db_redis/${dbName}/fuzzy_match/id`, 
      {
        method: 'post',
        data: req.body
      }
    );
    return res.json(response.data);
  } catch (err) {
    console.error(`直接请求模糊匹配公司ID失败: ${dbName}`, err.message);
    return res.status(500).json({ 
      error: '无法执行模糊匹配',
      message: err.message
    });
  }
}

module.exports = {
  getDatabases,
  getCompanyById,
  getDbFields,
  listCompanies,
  matchCompanyById
}; 