import React, { useState } from 'react';
import DbSettings from './DbSettings';
import { exportDbToJson } from '../api/redisApi';

const JsonExport: React.FC = () => {
  const [dbName, setDbName] = useState<string>('');
  const [prettyJson, setPrettyJson] = useState<boolean>(true);
  const [asFile, setAsFile] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [downloadLink, setDownloadLink] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const handleExport = async () => {
    if (!dbName) {
      setError('请选择数据库');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setDownloadLink('');

    try {
      const response = await exportDbToJson(dbName, prettyJson, asFile);
      
      if (asFile) {
        // 如果是文件下载模式，创建下载链接
        const blob = new Blob([JSON.stringify(response, null, prettyJson ? 2 : 0)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        setDownloadLink(url);
        setFileName(`${dbName}_export.json`);
      } else {
        // 显示结果
        setResult(response);
      }
    } catch (err) {
      setError(`导出失败: ${err instanceof Error ? err.message : String(err)}`);
      console.error('导出失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="json-export-container">
      <h2>Redis数据库导出为JSON</h2>
      <p className="description">将Redis数据库内容导出为JSON格式</p>
      
      <DbSettings onDbNameChange={setDbName} />
      
      <div className="export-form">
        <div className="form-group checkbox-group">
          <label htmlFor="pretty-json" className="checkbox-label">
            <input
              id="pretty-json"
              type="checkbox"
              checked={prettyJson}
              onChange={(e) => setPrettyJson(e.target.checked)}
            />
            美化JSON (格式化输出)
          </label>
        </div>
        
        <div className="form-group checkbox-group">
          <label htmlFor="as-file" className="checkbox-label">
            <input
              id="as-file"
              type="checkbox"
              checked={asFile}
              onChange={(e) => setAsFile(e.target.checked)}
            />
            以文件形式下载
          </label>
        </div>
        
        <div className="button-group">
          <button 
            onClick={handleExport} 
            className="action-button"
            disabled={loading}
          >
            {loading ? '导出中...' : '导出数据'}
          </button>
          
          {downloadLink && (
            <a 
              href={downloadLink} 
              download={fileName}
              className="download-button"
              onClick={() => {
                // 点击下载后清理URL对象
                setTimeout(() => {
                  URL.revokeObjectURL(downloadLink);
                  setDownloadLink('');
                }, 100);
              }}
            >
              下载JSON文件
            </a>
          )}
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading && <div className="loading">正在导出数据...</div>}
      
      {result && !asFile && (
        <div className="result-container">
          <h3>导出结果:</h3>
          <pre className="result-display">
            {typeof result === 'string' ? result : JSON.stringify(result, null, prettyJson ? 2 : 0)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default JsonExport; 