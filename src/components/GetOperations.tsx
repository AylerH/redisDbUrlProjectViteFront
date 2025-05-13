import React, { useState, useEffect } from 'react';
import DbSettings from './DbSettings';
import { 
  getCompanyById, 
  getCompanyFields, 
  getDbFields, 
  getDbStats, 
  listAllCompanies, 
  exportDbToJson, 
  checkRedisHealth 
} from '../api/redisApi';

// 定义操作类型
type OperationType = 
  | 'company-by-id' 
  | 'company-fields' 
  | 'db-fields' 
  | 'db-stats' 
  | 'company-list' 
  | 'export-json' 
  | 'redis-health';

const GetOperations: React.FC = () => {
  const [dbName, setDbName] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [limit, setLimit] = useState<number>(100);
  const [offset, setOffset] = useState<number>(0);
  const [prettyJson, setPrettyJson] = useState<boolean>(true);
  const [asFile, setAsFile] = useState<boolean>(false);
  const [operation, setOperation] = useState<OperationType>('company-list');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 切换操作类型时重置结果
  useEffect(() => {
    setResult(null);
    setError('');
  }, [operation]);

  // 执行选定的操作
  const executeOperation = async () => {
    if (!dbName && operation !== 'redis-health') {
      setError('请选择数据库');
      return;
    }

    if ((operation === 'company-by-id' || operation === 'company-fields') && !companyId) {
      setError('请输入公司ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let response;
      
      switch (operation) {
        case 'company-by-id':
          response = await getCompanyById(dbName, companyId);
          break;
        case 'company-fields':
          response = await getCompanyFields(dbName, companyId);
          break;
        case 'db-fields':
          response = await getDbFields(dbName);
          break;
        case 'db-stats':
          response = await getDbStats(dbName);
          break;
        case 'company-list':
          response = await listAllCompanies(dbName, limit, offset);
          break;
        case 'export-json':
          response = await exportDbToJson(dbName, prettyJson, asFile);
          break;
        case 'redis-health':
          response = await checkRedisHealth();
          break;
        default:
          setError('未知操作类型');
          return;
      }
      
      setResult(response);
    } catch (err) {
      setError(`操作失败: ${err instanceof Error ? err.message : String(err)}`);
      console.error('操作失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 根据操作类型显示不同的表单
  const renderForm = () => {
    switch (operation) {
      case 'company-by-id':
      case 'company-fields':
        return (
          <div className="form-group">
            <label htmlFor="company-id">公司ID:</label>
            <input
              id="company-id"
              type="text"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="input-field"
              placeholder="输入公司ID"
            />
          </div>
        );
      
      case 'export-json':
        return (
          <div className="form-group checkbox-group">
            <div className="checkbox-item">
              <input
                id="pretty-json"
                type="checkbox"
                checked={prettyJson}
                onChange={(e) => setPrettyJson(e.target.checked)}
              />
              <label htmlFor="pretty-json">美化JSON</label>
            </div>
            <div className="checkbox-item">
              <input
                id="as-file"
                type="checkbox"
                checked={asFile}
                onChange={(e) => setAsFile(e.target.checked)}
              />
              <label htmlFor="as-file">作为文件下载</label>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // 渲染操作结果
  const renderResult = () => {
    if (loading) {
      return <div className="loading">加载中...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    if (!result) {
      return null;
    }

    return (
      <div className="result-container">
        <h3>结果:</h3>
        <pre className="result-display">
          {typeof result === 'object' ? JSON.stringify(result, null, 2) : result}
        </pre>
      </div>
    );
  };

  // 操作类型选项
  const operationOptions = [
    { value: 'company-list', label: '获取公司列表' },
    { value: 'company-by-id', label: '根据ID获取公司信息' },
    { value: 'company-fields', label: '获取公司字段' },
    { value: 'db-fields', label: '获取数据库字段' },
    { value: 'db-stats', label: '获取数据库统计信息' },
    { value: 'export-json', label: '导出数据库为JSON' },
    { value: 'redis-health', label: '检查Redis健康状态' },
  ];

  return (
    <div className="get-operations">
      <h2>Redis 数据库查询操作</h2>
      
      <div className="operation-selector">
        <label htmlFor="operation-type">选择操作:</label>
        <select
          id="operation-type"
          value={operation}
          onChange={(e) => setOperation(e.target.value as OperationType)}
          className="select-field"
        >
          {operationOptions.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>
      
      {operation !== 'redis-health' && (
        <DbSettings 
          onDbNameChange={setDbName} 
          onLimitChange={setLimit} 
          onOffsetChange={setOffset} 
          showPagination={operation === 'company-list'} 
        />
      )}
      
      {renderForm()}
      
      <div className="button-group">
        <button 
          onClick={executeOperation} 
          className="action-button"
          disabled={loading}
        >
          {loading ? '处理中...' : '执行查询'}
        </button>
      </div>
      
      {renderResult()}
    </div>
  );
};

export default GetOperations; 