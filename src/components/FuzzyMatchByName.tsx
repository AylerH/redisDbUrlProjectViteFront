import React, { useState } from 'react';
import DbSettings from './DbSettings';
import { matchCompanyByName } from '../api/redisApi';

const FuzzyMatchByName: React.FC = () => {
  const [dbName, setDbName] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [minSimilarity, setMinSimilarity] = useState<number>(0.6);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 执行模糊匹配
  const handleSearch = async () => {
    if (!dbName) {
      setError('请选择数据库');
      return;
    }

    if (!query) {
      setError('请输入查询关键词');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await matchCompanyByName(dbName, query, minSimilarity);
      setResult(response);
    } catch (err) {
      setError(`模糊匹配失败: ${err instanceof Error ? err.message : String(err)}`);
      console.error('模糊匹配失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fuzzy-match-container">
      <h2>公司名称模糊匹配</h2>
      
      <DbSettings onDbNameChange={setDbName} />
      
      <div className="search-form">
        <div className="form-group">
          <label htmlFor="query">查询词:</label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field"
            placeholder="输入公司名称的部分内容"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="min-similarity">最小相似度:</label>
          <div className="slider-container">
            <input
              id="min-similarity"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={minSimilarity}
              onChange={(e) => setMinSimilarity(parseFloat(e.target.value))}
              className="slider"
            />
            <span className="slider-value">{minSimilarity}</span>
          </div>
        </div>
        
        <div className="button-group">
          <button 
            onClick={handleSearch} 
            className="action-button"
            disabled={loading}
          >
            {loading ? '搜索中...' : '开始搜索'}
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading && <div className="loading">正在搜索匹配结果...</div>}
      
      {result && (
        <div className="result-container">
          <h3>搜索结果:</h3>
          {Array.isArray(result.matches) && result.matches.length > 0 ? (
            <div className="matches-list">
              <table className="matches-table">
                <thead>
                  <tr>
                    <th>公司名称</th>
                    <th>相似度</th>
                  </tr>
                </thead>
                <tbody>
                  {result.matches.map((match: any, index: number) => (
                    <tr key={index}>
                      <td>{match.name}</td>
                      <td>{typeof match.similarity === 'number' ? match.similarity.toFixed(2) : match.similarity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-results">没有找到匹配结果</div>
          )}
          
          <pre className="result-display">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FuzzyMatchByName; 