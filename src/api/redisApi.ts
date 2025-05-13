import axios from 'axios';

// 获取环境信息（仅用于日志显示）
const isDevelopment = import.meta.env.DEV;
console.log('前端应用环境:', isDevelopment ? '开发环境' : '生产环境');

// 无论在任何环境中，都使用相对路径访问API
const API_BASE_URL = '/api';
console.log('API基础URL:', API_BASE_URL);

// 创建一个统一的API实例
const createRedisApi = () => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: false,
    timeout: 30000
  });

  // 请求拦截器
  instance.interceptors.request.use((config) => {
    console.log(`发送请求: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  }, (error) => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  });

  // 响应拦截器
  instance.interceptors.response.use((response) => {
    console.log(`响应成功: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  }, (error) => {
    if (error.response) {
      console.error(`响应错误: ${error.response.status} ${error.config?.url}`);
    } else if (error.request) {
      console.error('未收到响应:', error.message);
    } else {
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  });

  return instance;
};

// 默认API实例
let redisApi = createRedisApi();

// 缓存
interface Cache {
  databases?: { databases: string[] };
  expiry?: number;
}

// 全局缓存对象
const cache: Cache = {};

// 缓存过期时间 (ms)，默认10分钟
const CACHE_EXPIRY = 10 * 60 * 1000;

// 处理模拟数据（当API调用失败时使用）
const MOCK_DATABASE_LIST = {
  "databases": ["company_db", "test_db", "prod_db", "dev_db"]
};

// 自定义端口
let customPort: string = '';

// 更新API端口
export const updateApiPort = (port: string) => {
  console.log(`API端口已更新为: ${port}`);
  customPort = port;
  return port;
};

// 获取Redis数据库列表（带缓存）
export const getDatabases = async (forceRefresh: boolean = false) => {
  // 如果缓存有效且未强制刷新，直接返回缓存
  if (
    cache.databases && 
    cache.expiry && 
    Date.now() < cache.expiry && 
    !forceRefresh
  ) {
    console.log('返回缓存的数据库列表');
    return cache.databases;
  }

  try {
    // 日志记录
    console.log(`请求数据库列表 - 强制刷新:${forceRefresh}`);
    
    // 统一的API请求方式，开发环境和生产环境相同
    const response = await redisApi.get('/db_redis/databases');
    console.log('成功获取数据库列表:', response.data);
    
    // 更新缓存
    cache.databases = response.data;
    cache.expiry = Date.now() + CACHE_EXPIRY;
    
    return response.data;
  } catch (error) {
    console.error('获取数据库列表失败:', error);
    
    // 尝试直接获取
    try {
      console.log('尝试直接获取数据库列表...');
      const directResponse = await axios.get('/db_redis/databases');
      console.log('直接请求成功:', directResponse.data);
      
      // 更新缓存
      cache.databases = directResponse.data;
      cache.expiry = Date.now() + CACHE_EXPIRY;
      
      return directResponse.data;
    } catch (directError) {
      console.error('直接请求失败:', directError);
      
      if (cache.databases) {
        console.log('返回过期的缓存数据');
        return cache.databases;
      }
      
      // 返回模拟数据
      return MOCK_DATABASE_LIST;
    }
  }
};

// 清除缓存，强制刷新
export const clearDatabasesCache = () => {
  cache.databases = undefined;
  cache.expiry = undefined;
  console.log('数据库缓存已清除');
};

// 根据ID获取公司详细信息
export const getCompanyById = async (dbName: string, companyId: string) => {
  try {
    const response = await redisApi.get(`/db_redis/${dbName}/entity/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('获取公司信息失败:', error);
    throw error;
  }
};

// 获取特定公司的字段和对应的值
export const getCompanyFields = async (dbName: string, companyId: string) => {
  try {
    const response = await redisApi.get(`/db_redis/${dbName}/entity/${companyId}/fields`);
    return response.data;
  } catch (error) {
    console.error('获取公司字段失败:', error);
    throw error;
  }
};

// 获取数据库所有字段名称
export const getDbFields = async (dbName: string) => {
  try {
    const response = await redisApi.get(`/db_redis/${dbName}/fields`);
    return response.data;
  } catch (error) {
    console.error('获取数据库字段失败:', error);
    throw error;
  }
};

// 获取数据库统计信息
export const getDbStats = async (dbName: string) => {
  try {
    const response = await redisApi.get(`/db_redis/${dbName}/stats`);
    return response.data;
  } catch (error) {
    console.error('获取数据库统计信息失败:', error);
    throw error;
  }
};

// 获取所有公司列表
export const listAllCompanies = async (dbName: string, limit: number = 100, offset: number = 0) => {
  try {
    const response = await redisApi.get(`/db_redis/${dbName}/list?limit=${limit}&offset=${offset}`);
    return response.data;
  } catch (error) {
    console.error('获取公司列表失败:', error);
    throw error;
  }
};

// 导出数据库为JSON
export const exportDbToJson = async (dbName: string, pretty: boolean = false, asFile: boolean = false) => {
  try {
    const response = await redisApi.get(`/db_redis/${dbName}/export/json?pretty=${pretty}&as_file=${asFile}`);
    return response.data;
  } catch (error) {
    console.error('导出数据库失败:', error);
    throw error;
  }
};

// 检查Redis健康状态
export const checkRedisHealth = async () => {
  try {
    const response = await redisApi.get('/db_redis/health');
    return response.data;
  } catch (error) {
    console.error('检查Redis健康状态失败:', error);
    throw error;
  }
};

// 模糊匹配公司ID (POST方法)
export const matchCompanyById = async (dbName: string, query: string, minSimilarity: number = 0.6) => {
  try {
    const response = await redisApi.post(`/db_redis/${dbName}/fuzzy_match/id`, {
      query,
      min_similarity: minSimilarity
    });
    return response.data;
  } catch (error) {
    console.error('模糊匹配公司ID失败:', error);
    throw error;
  }
};

// 模糊匹配公司名称 (POST方法)
export const matchCompanyByName = async (dbName: string, query: string, minSimilarity: number = 0.6) => {
  try {
    const response = await redisApi.post(`/db_redis/${dbName}/fuzzy_match/name`, {
      query,
      min_similarity: minSimilarity
    });
    return response.data;
  } catch (error) {
    console.error('模糊匹配公司名称失败:', error);
    throw error;
  }
};

// 空格分隔条件模糊匹配公司ID (POST方法)
export const matchCompanyByBlankId = async (dbName: string, query: string, minSimilarity: number = 0.4, limit: number = 10) => {
  try {
    const response = await redisApi.post(`/db_redis/${dbName}/fuzzy_match_blank/id`, {
      query,
      min_similarity: minSimilarity,
      limit
    });
    return response.data;
  } catch (error) {
    console.error('空格分隔模糊匹配公司ID失败:', error);
    throw error;
  }
};

// 空格分隔条件模糊匹配公司名称 (POST方法)
export const matchCompanyByBlankName = async (dbName: string, query: string, minSimilarity: number = 0.4, limit: number = 10) => {
  try {
    const response = await redisApi.post(`/db_redis/${dbName}/fuzzy_match_blank/name`, {
      query,
      min_similarity: minSimilarity,
      limit
    });
    return response.data;
  } catch (error) {
    console.error('空格分隔模糊匹配公司名称失败:', error);
    throw error;
  }
};

export const setValue = async (key: string, value: string) => {
  try {
    const response = await redisApi.post('/set', { key, value });
    return response.data;
  } catch (error) {
    console.error('Error setting value:', error);
    throw error;
  }
};

export const getValue = async (key: string, port?: string) => {
  try {
    // 如果提供了自定义端口，使用自定义端口
    const portToUse = port || customPort;
    const endpoint = portToUse ? `/get?key=${key}&port=${portToUse}` : `/get?key=${key}`;
    const response = await redisApi.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error getting value:', error);
    throw error;
  }
};

export const deleteKey = async (key: string) => {
  try {
    const response = await redisApi.delete(`/delete?key=${key}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting key:', error);
    throw error;
  }
};

export const getAllKeys = async () => {
  try {
    const response = await redisApi.get('/keys');
    return response.data;
  } catch (error) {
    console.error('Error getting all keys:', error);
    throw error;
  }
};

// 上传JSON数据到Redis（支持文件和JSON对象）
export const uploadJsonData = async (
  dbName: string, 
  data: File | object, 
  isFile: boolean = false, 
  clearExisting: boolean = false
) => {
  try {
    const url = `/db_redis/${dbName}/upload_json?clear_existing=${clearExisting}`;
    
    let requestConfig = {};
    let requestData;
    
    if (isFile) {
      // 文件上传模式
      const formData = new FormData();
      formData.append('file', data as File);
      
      requestData = formData;
      requestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      };
    } else {
      // JSON对象直接上传模式
      requestData = data;
      requestConfig = {
        headers: {
          'Content-Type': 'application/json',
        }
      };
    }
    
    console.log(`上传JSON数据到 ${dbName}, 是否为文件模式: ${isFile}, 是否清除现有数据: ${clearExisting}`);
    const response = await redisApi.post(url, requestData, requestConfig);
    console.log('上传成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('上传JSON数据失败:', error);
    throw error;
  }
};

// 通过文件上传JSON数据到Redis（/upload_json 端点）
export const uploadJsonFile = async (
  dbName: string, 
  file: File,
  clearExisting: boolean = false
) => {
  try {
    const url = `/db_redis/${dbName}/upload_json?clear_existing=${clearExisting}`;
    
    // 创建 FormData 用于文件上传
    const formData = new FormData();
    formData.append('file', file);
    
    console.log(`通过文件上传JSON数据到 ${dbName}, 是否清除现有数据: ${clearExisting}`);
    const response = await redisApi.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    console.log('文件上传成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
};

// 直接上传JSON数据体到Redis（/load_json_body 端点）
export const loadJsonBody = async (
  dbName: string, 
  jsonData: object,
  clearExisting: boolean = false
) => {
  try {
    const url = `/db_redis/${dbName}/load_json_body?clear_existing=${clearExisting}`;
    
    console.log(`直接上传JSON数据到 ${dbName}, 是否清除现有数据: ${clearExisting}`);
    const response = await redisApi.post(url, jsonData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('JSON数据体上传成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('JSON数据体上传失败:', error);
    throw error;
  }
};

// 可以根据API文档添加其他需要的接口 