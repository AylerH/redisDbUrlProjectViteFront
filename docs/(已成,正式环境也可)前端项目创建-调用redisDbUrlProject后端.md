# 使用Vite创建前端项目并调用Redis API

下面我将指导你如何使用Vite创建一个前端项目，并调用你提供的Redis控制API接口。

## 1. 创建Vite项目

首先，使用以下命令创建一个新的Vite项目（这里以React为例，你也可以选择Vue或其他框架）：

```bash
npm create vite@latest redis-ctl-frontend --template react
cd redis-ctl-frontend
npm install
```

## 2. 安装必要的依赖

安装axios用于API调用：

```bash
npm install axios
```

## 3. 创建API服务文件

在`src`目录下创建一个`api`文件夹，然后创建`redisApi.js`文件：

```javascript
// src/api/redisApi.js
import axios from 'axios';

const API_BASE_URL = 'https://redis-ctl-api.onrender.com';

const redisApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // 如果需要认证，可以在这里添加token
    // 'Authorization': `Bearer ${yourToken}`
  }
});

export const setValue = async (key, value) => {
  try {
    const response = await redisApi.post('/set', { key, value });
    return response.data;
  } catch (error) {
    console.error('Error setting value:', error);
    throw error;
  }
};

export const getValue = async (key) => {
  try {
    const response = await redisApi.get(`/get?key=${key}`);
    return response.data;
  } catch (error) {
    console.error('Error getting value:', error);
    throw error;
  }
};

export const deleteKey = async (key) => {
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

// 根据API文档添加其他需要的接口
```

## 4. 创建React组件使用API

创建一个简单的组件来测试API：

```javascript
// src/components/RedisControl.js
import React, { useState } from 'react';
import { setValue, getValue, deleteKey, getAllKeys } from '../api/redisApi';

const RedisControl = () => {
  const [key, setKey] = useState('');
  const [value, setValueInput] = useState('');
  const [result, setResult] = useState('');
  const [keysList, setKeysList] = useState([]);

  const handleSetValue = async () => {
    try {
      const response = await setValue(key, value);
      setResult(`Value set successfully: ${JSON.stringify(response)}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  const handleGetValue = async () => {
    try {
      const response = await getValue(key);
      setResult(`Value: ${JSON.stringify(response)}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  const handleDeleteKey = async () => {
    try {
      const response = await deleteKey(key);
      setResult(`Key deleted: ${JSON.stringify(response)}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  const handleGetAllKeys = async () => {
    try {
      const response = await getAllKeys();
      setKeysList(response.keys || []);
      setResult(`All keys fetched successfully`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h2>Redis Control Panel</h2>
      
      <div>
        <input
          type="text"
          placeholder="Key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <input
          type="text"
          placeholder="Value"
          value={value}
          onChange={(e) => setValueInput(e.target.value)}
        />
        <button onClick={handleSetValue}>Set Value</button>
        <button onClick={handleGetValue}>Get Value</button>
        <button onClick={handleDeleteKey}>Delete Key</button>
      </div>
      
      <div>
        <button onClick={handleGetAllKeys}>Get All Keys</button>
        {keysList.length > 0 && (
          <div>
            <h3>Keys:</h3>
            <ul>
              {keysList.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div>
        <h3>Result:</h3>
        <pre>{result}</pre>
      </div>
    </div>
  );
};

export default RedisControl;
```

## 5. 在主App中使用组件

修改`src/App.js`：

```javascript
import React from 'react';
import RedisControl from './components/RedisControl';
import './App.css';

function App() {
  return (
    <div className="App">
      <RedisControl />
    </div>
  );
}

export default App;
```

## 6. 运行项目

启动开发服务器：

```bash
npm run dev
```

## 7. 注意事项

1. **CORS问题**：如果API服务器没有正确设置CORS头，你可能需要在开发时配置代理或让后端添加适当的CORS头。

2. **认证**：如果API需要认证，你需要在请求头中添加认证令牌。

3. **环境变量**：对于生产环境，建议将API基础URL放在环境变量中。

4. **错误处理**：根据你的需求，可能需要更完善的错误处理机制。

5. **API文档**：根据你提供的API文档(https://redis-ctl-api.onrender.com/docs)，你可能需要调整上面的代码以匹配实际的API端点。

希望这个指南对你有所帮助！如果你需要针对特定API端点进行更具体的实现，可以根据API文档调整上面的代码。