import React, { useState } from 'react';
import DbSettings from './DbSettings';
import { matchCompanyByBlankId } from '../api/redisApi';

const FuzzyMatchBlankId: React.FC = () => {
  const [dbName, setDbName] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [minSimilarity, setMinSimilarity] = useState<number>(0.4);
  const [limit, setLimit] = useState<number>(10);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 执行空格分隔模糊匹配
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
      const response = await matchCompanyByBlankId(dbName, query, minSimilarity, limit);
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
      <h2>空格分隔条件 ID 模糊匹配</h2>
      <p className="description">输入多个空格分隔的关键词，系统将匹配同时包含这些关键词的公司ID</p>
      
      <DbSettings onDbNameChange={setDbName} />
      
      <div className="search-form">
        <div className="form-group">
          <label htmlFor="query">查询词 (空格分隔):</label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field"
            placeholder="输入空格分隔的关键词 (例如: ABC 123 XYZ)"
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
        
        <div className="form-group">
          <label htmlFor="limit">结果数量限制:</label>
          <input
            id="limit"
            type="number"
            min="1"
            max="100"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
            className="input-field"
          />
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
                    <th>公司ID</th>
                    <th>相似度</th>
                  </tr>
                </thead>
                <tbody>
                  {result.matches.map((match: any, index: number) => (
                    <tr key={index}>
                      <td>{match.id}</td>
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

export default FuzzyMatchBlankId; 