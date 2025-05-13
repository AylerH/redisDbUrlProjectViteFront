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

// 处理API请求错误并尝试备用方法
async function handleApiRequestWithFallback<T>(
  mainRequest: () => Promise<T>,
  directRequest: () => Promise<T>,
  mockData?: T
): Promise<T> {
  try {
    // 尝试主要请求方式
    return await mainRequest();
  } catch (error) {
    console.error('主要请求失败:', error);
    
    try {
      // 尝试直接请求
      console.log('尝试直接请求...');
      return await directRequest();
    } catch (directError) {
      console.error('直接请求也失败:', directError);
      
      // 如果有模拟数据，则返回
      if (mockData !== undefined) {
        console.log('返回模拟数据');
        return mockData;
      }
      
      // 否则抛出原始错误
      throw error;
    }
  }
}

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

  // 定义请求函数
  const mainRequest = async () => {
    const response = await redisApi.get('/db_redis/databases');
    console.log('成功获取数据库列表:', response.data);
    
    // 更新缓存
    cache.databases = response.data;
    cache.expiry = Date.now() + CACHE_EXPIRY;
    
    return response.data;
  };
  
  const directRequest = async () => {
    // 尝试不同的路径
    try {
      console.log('尝试路径 /db_redis/databases...');
      const response = await axios.get('/db_redis/databases');
      
      // 更新缓存
      cache.databases = response.data;
      cache.expiry = Date.now() + CACHE_EXPIRY;
      
      return response.data;
    } catch (error) {
      console.error('路径 /db_redis/databases 失败, 尝试完整路径');
      
      // 尝试使用完整URL
      const fullUrlResponse = await axios.get(window.location.origin + '/db_redis/databases');
      
      // 更新缓存
      cache.databases = fullUrlResponse.data;
      cache.expiry = Date.now() + CACHE_EXPIRY;
      
      return fullUrlResponse.data;
    }
  };
  
  return handleApiRequestWithFallback(mainRequest, directRequest, MOCK_DATABASE_LIST);
};

// 清除缓存，强制刷新
export const clearDatabasesCache = () => {
  cache.databases = undefined;
  cache.expiry = undefined;
  console.log('数据库缓存已清除');
};

// 根据ID获取公司详细信息
export const getCompanyById = async (dbName: string, companyId: string) => {
  const endpoint = `/db_redis/${dbName}/entity/${companyId}`;
  
  return handleApiRequestWithFallback(
    async () => {
      const response = await redisApi.get(endpoint);
      return response.data;
    },
    async () => {
      const response = await axios.get(`/${endpoint}`);
      return response.data;
    }
  );
};

// 获取特定公司的字段和对应的值
export const getCompanyFields = async (dbName: string, companyId: string) => {
  const endpoint = `/db_redis/${dbName}/entity/${companyId}/fields`;
  
  return handleApiRequestWithFallback(
    async () => {
      const response = await redisApi.get(endpoint);
      return response.data;
    },
    async () => {
      const response = await axios.get(`/${endpoint}`);
      return response.data;
    }
  );
};

// 获取数据库所有字段名称
export const getDbFields = async (dbName: string) => {
  const endpoint = `/db_redis/${dbName}/fields`;
  
  return handleApiRequestWithFallback(
    async () => {
      const response = await redisApi.get(endpoint);
      return response.data;
    },
    async () => {
      const response = await axios.get(`/${endpoint}`);
      return response.data;
    }
  );
};

// 获取数据库统计信息
export const getDbStats = async (dbName: string) => {
  const endpoint = `/db_redis/${dbName}/stats`;
  
  return handleApiRequestWithFallback(
    async () => {
      const response = await redisApi.get(endpoint);
      return response.data;
    },
    async () => {
      const response = await axios.get(`/${endpoint}`);
      return response.data;
    }
  );
};

// 获取所有公司列表
export const listAllCompanies = async (dbName: string, limit: number = 100, offset: number = 0) => {
  const endpoint = `/db_redis/${dbName}/list?limit=${limit}&offset=${offset}`;
  
  return handleApiRequestWithFallback(
    async () => {
      const response = await redisApi.get(endpoint);
      return response.data;
    },
    async () => {
      const response = await axios.get(`/${endpoint}`);
      return response.data;
    }
  );
};

// 导出数据库为JSON
export const exportDbToJson = async (dbName: string, pretty: boolean = false, asFile: boolean = false) => {
  const endpoint = `/db_redis/${dbName}/export/json?pretty=${pretty}&as_file=${asFile}`;
  
  return handleApiRequestWithFallback(
    async () => {
      const response = await redisApi.get(endpoint);
      return response.data;
    },
    async () => {
      const response = await axios.get(`/${endpoint}`);
      return response.data;
    }
  );
};

// 检查Redis健康状态
export const checkRedisHealth = async () => {
  const endpoint = `/db_redis/health`;
  
  return handleApiRequestWithFallback(
    async () => {
      const response = await redisApi.get(endpoint);
      return response.data;
    },
    async () => {
      const response = await axios.get(`/${endpoint}`);
      return response.data;
    }
  );
};

// 模糊匹配公司ID (POST方法)
export const matchCompanyById = async (dbName: string, query: string, minSimilarity: number = 0.6) => {
  const endpoint = `/db_redis/${dbName}/fuzzy_match/id`;
  const data = { query, min_similarity: minSimilarity };
  
  return handleApiRequestWithFallback(
    async () => {
      const response = await redisApi.post(endpoint, data);
      return response.data;
    },
    async () => {
      const response = await axios.post(`/${endpoint}`, data);
      return response.data;
    }
  );
};

// 模糊匹配公司名称 (POST方法)
export const matchCompanyByName = async (dbName: string, query: string, minSimilarity: number = 0.6) => {
  const endpoint = `/db_redis/${dbName}/fuzzy_match/name`;
  const data = { query, min_similarity: minSimilarity };
  
  return handleApiRequestWithFallback(
    async () => {
      const response = await redisApi.post(endpoint, data);
      return response.data;
    },
    async () => {
      const response = await axios.post(`/${endpoint}`, data);
      return response.data;
    }
  );
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