import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ApiPortConfigProps {
  onPortChange: (port: string) => void;
}

const ApiPortConfig: React.FC<ApiPortConfigProps> = ({ onPortChange }) => {
  const [port, setPort] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const API_BASE_URL = 'https://redis-ctl-api.onrender.com';
  
  useEffect(() => {
    // 从localStorage获取端口配置，而不是调用API
    const savedPort = localStorage.getItem('redisApiPort');
    if (savedPort) {
      setPort(savedPort);
      onPortChange(savedPort); // 通知父组件
      setMessage('已从本地存储获取端口配置');
    }
  }, [onPortChange]);
  
  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPort(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!port) {
      setMessage('请输入有效的端口号');
      return;
    }
    
    try {
      setIsLoading(true);
      // 设置端口配置到localStorage
      localStorage.setItem('redisApiPort', port);
      // 设置端口配置到后端
      const response = await axios.post(`${API_BASE_URL}/config/set`, { 
        port: port 
      });
      
      if (response.status === 200) {
        setMessage('端口配置成功');
        onPortChange(port);
      } else {
        setMessage('端口配置失败');
      }
    } catch (error) {
      // 即使API请求失败，仍然保存到localStorage
      localStorage.setItem('redisApiPort', port);
      onPortChange(port);
      setMessage(`端口已保存到本地，但API配置失败: ${error instanceof Error ? error.message : String(error)}`);
      console.error('端口配置错误:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="api-port-config">
      <h3>API 端口配置</h3>
      <form onSubmit={handleSubmit} className="port-form">
        <div className="form-group">
          <label htmlFor="port">GET 端口:</label>
          <input
            type="text"
            id="port"
            value={port}
            onChange={handlePortChange}
            placeholder="输入端口号"
            className="input-field"
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit" 
          className="action-button"
          disabled={isLoading}
        >
          {isLoading ? '配置中...' : '设置端口'}
        </button>
      </form>
      {message && (
        <div className={message.includes('失败') ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ApiPortConfig; 