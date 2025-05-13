import React, { useState, useEffect } from 'react';
import { getDatabases, clearDatabasesCache } from '../api/redisApi';

interface Database {
  id: number;
  name: string;
  host: string;
  port: number;
  status: string;
  // 其他可能的字段
}

const DatabaseList: React.FC = () => {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  const fetchDatabases = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError('');
      console.log('开始获取数据库列表，强制刷新:', forceRefresh);
      
      // 使用缓存机制，根据参数决定是否强制刷新
      const response = await getDatabases(forceRefresh);
      console.log('获取到数据库响应:', response);
      
      // 处理不同格式的响应
      if (response) {
        if (Array.isArray(response)) {
          // 如果直接是数组
          setDatabases(response);
        } else if (response.databases && Array.isArray(response.databases)) {
          // 如果是 { databases: [...] } 格式
          setDatabases(response.databases);
        } else if (typeof response === 'object') {
          // 尝试将对象转为数组
          const dbArray = Object.keys(response).map(key => ({
            name: key,
            ...response[key]
          }));
          setDatabases(dbArray);
        } else {
          setDatabases([]);
          setError('数据库列表格式不支持');
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
  
  useEffect(() => {
    // 初次加载使用缓存数据（如果有）
    fetchDatabases(false);
  }, []);
  
  const handleRefresh = () => {
    // 清除缓存并强制刷新
    clearDatabasesCache();
    fetchDatabases(true);
  };
  
  return (
    <div className="database-list">
      <div className="database-header">
        <h3>Redis 数据库列表</h3>
        <button onClick={handleRefresh} className="refresh-button" disabled={loading}>
          {loading ? '加载中...' : '刷新'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
          <button 
            onClick={handleRefresh} 
            className="retry-button"
            style={{ marginLeft: '10px' }}
          >
            重试
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="loading">加载数据库列表中...</div>
      ) : databases.length > 0 ? (
        <table className="database-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>主机</th>
              <th>端口</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {databases.map((db, index) => (
              <tr key={index}>
                <td>{db.id || index + 1}</td>
                <td>{db.name || '未知'}</td>
                <td>{db.host || '未知'}</td>
                <td>{db.port || '未知'}</td>
                <td>
                  <span className={`status ${(db.status?.toLowerCase() || 'unknown')}`}>
                    {db.status || '未知'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="no-data">
          <p>没有找到Redis数据库</p>
          <p>如果确认服务器上有数据库，请点击刷新按钮或检查网络连接</p>
        </div>
      )}
    </div>
  );
};

export default DatabaseList; 