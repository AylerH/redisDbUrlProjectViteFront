import React, { useState, useEffect } from 'react';
import { getDatabases, clearDatabasesCache } from '../api/redisApi';

interface DbSettingsProps {
  onDbNameChange: (dbName: string) => void;
  onLimitChange?: (limit: number) => void;
  onOffsetChange?: (offset: number) => void;
  showPagination?: boolean;
}

const DbSettings: React.FC<DbSettingsProps> = ({ 
  onDbNameChange, 
  onLimitChange, 
  onOffsetChange, 
  showPagination = false 
}) => {
  const [dbName, setDbName] = useState<string>('');
  const [limit, setLimit] = useState<number>(100);
  const [offset, setOffset] = useState<number>(0);
  const [databases, setDatabases] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // 加载数据库列表
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('DbSettings: 开始获取数据库列表');
        
        // 不用强制刷新，使用缓存
        const response = await getDatabases(false);
        console.log('DbSettings: 获取到数据库数据:', response);
        
        // 处理不同格式的响应
        if (response) {
          let dbList: string[] = [];
          
          if (Array.isArray(response)) {
            // 如果直接是数组
            dbList = response.map((db: any) => typeof db === 'string' ? db : db.name || String(db));
          } else if (response.databases && Array.isArray(response.databases)) {
            // 如果是 { databases: [...] } 格式
            dbList = response.databases.map((db: any) => typeof db === 'string' ? db : db.name || String(db));
          } else if (typeof response === 'object') {
            // 尝试从对象中提取数据库名称
            dbList = Object.keys(response);
          }
          
          if (dbList.length > 0) {
            setDatabases(dbList);
            // 如果有数据库且当前未选择，则自动选择第一个
            if (!dbName) {
              handleDbNameChange(dbList[0]);
            }
            // 清除错误
            setError('');
          } else {
            setDatabases([]);
            setError('获取到的数据库列表为空');
          }
        } else {
          setDatabases([]);
          setError('未获取到数据库数据');
        }
      } catch (err) {
        setError(`获取数据库列表失败: ${err instanceof Error ? err.message : String(err)}`);
        console.error('获取数据库列表失败:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDatabases();
  }, []);

  const handleDbNameChange = (value: string) => {
    setDbName(value);
    onDbNameChange(value);
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setLimit(value);
      if (onLimitChange) {
        onLimitChange(value);
      }
    }
  };

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setOffset(value);
      if (onOffsetChange) {
        onOffsetChange(value);
      }
    }
  };

  const handleRetry = async () => {
    // 清除缓存并强制刷新
    clearDatabasesCache();
    try {
      setLoading(true);
      setError('');
      console.log('DbSettings: 开始强制刷新数据库列表');
      
      // 强制刷新
      const response = await getDatabases(true);
      console.log('DbSettings: 刷新后获取到数据据:', response);
      
      // 处理不同格式的响应
      if (response) {
        let dbList: string[] = [];
        
        if (Array.isArray(response)) {
          // 如果直接是数组
          dbList = response.map((db: any) => typeof db === 'string' ? db : db.name || String(db));
        } else if (response.databases && Array.isArray(response.databases)) {
          // 如果是 { databases: [...] } 格式
          dbList = response.databases.map((db: any) => typeof db === 'string' ? db : db.name || String(db));
        } else if (typeof response === 'object') {
          // 尝试从对象中提取数据库名称
          dbList = Object.keys(response);
        }
        
        if (dbList.length > 0) {
          setDatabases(dbList);
          // 如果有数据库且当前未选择，则自动选择第一个
          if (!dbName) {
            handleDbNameChange(dbList[0]);
          }
          // 清除错误
          setError('');
        } else {
          setDatabases([]);
          setError('获取到的数据库列表为空');
        }
      } else {
        setDatabases([]);
        setError('未获取到数据库数据');
      }
    } catch (err) {
      setError(`获取数据库列表失败: ${err instanceof Error ? err.message : String(err)}`);
      console.error('获取数据库列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="db-settings">
      <h3>数据库设置</h3>
      
      {error && (
        <div className="error-message-with-retry">
          <div className="error-message">{error}</div>
          <button onClick={handleRetry} className="retry-button">
            重试
          </button>
        </div>
      )}
      
      <div className="settings-group">
        <div className="form-group">
          <label htmlFor="db-name">数据库名称:</label>
          <select
            id="db-name"
            value={dbName}
            onChange={(e) => handleDbNameChange(e.target.value)}
            className="select-field"
            disabled={loading}
          >
            <option value="">-- 选择数据库 --</option>
            {databases.map((db, index) => (
              <option key={index} value={db}>
                {db}
              </option>
            ))}
          </select>
          {loading && <span className="loading-indicator">加载中...</span>}
          
          <button 
            onClick={handleRetry} 
            className="refresh-button" 
            title="刷新数据库列表" 
            disabled={loading}
          >
            刷新
          </button>
        </div>

        {showPagination && (
          <>
            <div className="form-group">
              <label htmlFor="limit">每页数量:</label>
              <input
                id="limit"
                type="number"
                min="1"
                value={limit}
                onChange={handleLimitChange}
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label htmlFor="offset">偏移量:</label>
              <input
                id="offset"
                type="number"
                min="0"
                value={offset}
                onChange={handleOffsetChange}
                className="input-field"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DbSettings; 