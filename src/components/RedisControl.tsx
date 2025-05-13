import React, { useState } from 'react';
import { setValue, getValue, deleteKey, getAllKeys, updateApiPort } from '../api/redisApi';
import ApiPortConfig from './ApiPortConfig';
import DatabaseList from './DatabaseList';

const RedisControl: React.FC = () => {
  const [key, setKey] = useState('');
  const [value, setValueInput] = useState('');
  const [result, setResult] = useState('');
  const [keysList, setKeysList] = useState<string[]>([]);
  const [customPort, setCustomPort] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDatabases, setShowDatabases] = useState<boolean>(false);

  const handleSetValue = async () => {
    if (!key) {
      setResult('错误: 请输入键名');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await setValue(key, value);
      setResult(`值设置成功: ${JSON.stringify(response)}`);
    } catch (error) {
      setResult(`错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetValue = async () => {
    if (!key) {
      setResult('错误: 请输入键名');
      return;
    }
    
    try {
      setIsLoading(true);
      // 使用当前配置的端口获取值
      const response = await getValue(key, customPort);
      setResult(`值: ${JSON.stringify(response)}`);
    } catch (error) {
      setResult(`错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!key) {
      setResult('错误: 请输入键名');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await deleteKey(key);
      setResult(`键已删除: ${JSON.stringify(response)}`);
    } catch (error) {
      setResult(`错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAllKeys = async () => {
    try {
      setIsLoading(true);
      const response = await getAllKeys();
      setKeysList(response.keys || []);
      setResult(`所有键获取成功`);
    } catch (error) {
      setResult(`错误: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePortChange = (port: string) => {
    setCustomPort(port);
    updateApiPort(port);
    setResult(`端口已更新为: ${port}`);
  };
  
  const toggleDatabasesView = () => {
    setShowDatabases(prev => !prev);
  };

  return (
    <div className="redis-control">
      <h2>Redis 控制面板</h2>
      
      {/* API端口配置组件 */}
      <ApiPortConfig onPortChange={handlePortChange} />
      
      <div className="control-panel">
        <div className="input-group">
          <input
            type="text"
            placeholder="键"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="input-field"
            disabled={isLoading}
          />
          <input
            type="text"
            placeholder="值"
            value={value}
            onChange={(e) => setValueInput(e.target.value)}
            className="input-field"
            disabled={isLoading}
          />
        </div>
        
        <div className="button-group">
          <button onClick={handleSetValue} className="action-button" disabled={isLoading}>
            {isLoading ? '处理中...' : '设置值'}
          </button>
          <button onClick={handleGetValue} className="action-button" disabled={isLoading}>
            {isLoading ? '处理中...' : '获取值'}
          </button>
          <button onClick={handleDeleteKey} className="action-button" disabled={isLoading}>
            {isLoading ? '处理中...' : '删除键'}
          </button>
          <button onClick={handleGetAllKeys} className="action-button" disabled={isLoading}>
            {isLoading ? '处理中...' : '获取所有键'}
          </button>
        </div>
        
        <div className="database-toggle">
          <button 
            onClick={toggleDatabasesView} 
            className="toggle-button"
          >
            {showDatabases ? '隐藏数据库列表' : '显示数据库列表'}
          </button>
        </div>
      </div>
      
      {customPort && (
        <div className="port-info">
          <p>当前使用的GET端口: <span className="highlight">{customPort}</span></p>
        </div>
      )}
      
      {keysList.length > 0 && (
        <div className="keys-list">
          <h3>键列表:</h3>
          <ul>
            {keysList.map((k, i) => (
              <li key={i} onClick={() => setKey(k)} className="key-item">
                {k}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="result-container">
        <h3>结果:</h3>
        <pre className="result-display">{result}</pre>
      </div>
      
      {/* 数据库列表组件 */}
      {showDatabases && <DatabaseList />}
    </div>
  );
};

export default RedisControl; 