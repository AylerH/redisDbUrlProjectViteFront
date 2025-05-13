import React, { useState, useRef } from 'react';
import DbSettings from './DbSettings';
import { uploadJsonFile, loadJsonBody } from '../api/redisApi';

// 示例JSON数据
const EXAMPLE_JSON = `{
  "001": {
    "name": "测试公司1",
    "address": "北京市朝阳区",
    "contact": "13800138000"
  },
  "002": {
    "name": "测试公司2",
    "address": "上海市浦东新区",
    "contact": "13900139000"
  }
}`;

const JsonUpload: React.FC = () => {
  const [dbName, setDbName] = useState<string>('');
  const [customDbName, setCustomDbName] = useState<string>('');
  const [useCustomDb, setUseCustomDb] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [uploadType, setUploadType] = useState<'file' | 'text'>('file');
  const [clearExisting, setClearExisting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleJsonTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
  };
  
  const handleCustomDbNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDbName(e.target.value);
  };

  const resetForm = () => {
    setFile(null);
    setJsonText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const loadExample = () => {
    setJsonText(EXAMPLE_JSON);
    setUploadType('text');
  };

  const getEffectiveDbName = () => {
    return useCustomDb ? customDbName : dbName;
  };

  const handleUpload = async () => {
    const effectiveDbName = getEffectiveDbName();
    
    if (!effectiveDbName) {
      setError('请选择或输入数据库名称');
      return;
    }

    if (uploadType === 'file' && !file) {
      setError('请选择JSON文件');
      return;
    }

    if (uploadType === 'text' && !jsonText.trim()) {
      setError('请输入JSON数据');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let response;
      
      if (uploadType === 'file' && file) {
        // 使用文件上传模式 - 调用 /upload_json 端点
        response = await uploadJsonFile(effectiveDbName, file, clearExisting);
      } else {
        // 使用JSON文本上传模式 - 调用 /load_json_body 端点
        let jsonData;
        try {
          jsonData = JSON.parse(jsonText);
        } catch (err) {
          setError('JSON格式错误，请检查您的输入');
          setLoading(false);
          return;
        }
        
        response = await loadJsonBody(effectiveDbName, jsonData, clearExisting);
      }

      setResult(response);
      resetForm();
    } catch (err) {
      setError(`JSON上传失败: ${err instanceof Error ? err.message : String(err)}`);
      console.error('JSON上传失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="json-upload-container">
      <h2>JSON数据上传到Redis</h2>
      <p className="description">上传JSON数据导入到Redis数据库中</p>
      
      <div className="db-selection-section">
        <div className="form-group checkbox-group">
          <label htmlFor="use-custom-db" className="checkbox-label">
            <input
              id="use-custom-db"
              type="checkbox"
              checked={useCustomDb}
              onChange={(e) => setUseCustomDb(e.target.checked)}
            />
            使用自定义数据库名
          </label>
        </div>
        
        {useCustomDb ? (
          <div className="form-group">
            <label htmlFor="custom-db-name">自定义数据库名:</label>
            <input
              id="custom-db-name"
              type="text"
              value={customDbName}
              onChange={handleCustomDbNameChange}
              className="input-field"
              placeholder="输入自定义数据库名称"
            />
          </div>
        ) : (
          <DbSettings onDbNameChange={setDbName} />
        )}
      </div>
      
      <div className="upload-form">
        <div className="form-group">
          <label>上传方式:</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="uploadType"
                checked={uploadType === 'file'}
                onChange={() => setUploadType('file')}
              />
              文件上传 (upload_json)
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="uploadType"
                checked={uploadType === 'text'}
                onChange={() => setUploadType('text')}
              />
              JSON文本 (load_json_body)
            </label>
          </div>
          <div className="upload-method-info">
            <p>上传方式说明：</p>
            <ul>
              <li><strong>文件上传</strong>：通过文件选择器上传JSON文件，使用/upload_json接口</li>
              <li><strong>JSON文本</strong>：直接输入或粘贴JSON文本，使用/load_json_body接口</li>
            </ul>
          </div>
        </div>
        
        <div className="form-group checkbox-group">
          <label htmlFor="clear-existing" className="checkbox-label">
            <input
              id="clear-existing"
              type="checkbox"
              checked={clearExisting}
              onChange={(e) => setClearExisting(e.target.checked)}
            />
            上传前清除现有数据
          </label>
        </div>
        
        {uploadType === 'file' ? (
          <div className="form-group">
            <label htmlFor="json-file">选择JSON文件:</label>
            <input
              id="json-file"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="file-input"
              ref={fileInputRef}
            />
            {file && <div className="file-selected">已选择: {file.name}</div>}
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="json-text">
              输入JSON数据:
              <button onClick={loadExample} className="example-button">
                加载示例
              </button>
            </label>
            <textarea
              id="json-text"
              value={jsonText}
              onChange={handleJsonTextChange}
              className="json-textarea"
              placeholder={`{
  "id_value": {
    "field_name": "-"
  }
}`}
              rows={10}
            />
            <div className="json-format-hint">
              <p>JSON格式说明:</p>
              <pre>{`{
  "id_value": {            // 键为ID值
    "field_name": "-",     // 字段名和值
    "field_name2": "value" // 可以有多个字段
  },
  "another_id": {          // 另一个实体
    "field_name": "value"
  }
}`}</pre>
            </div>
          </div>
        )}
        
        <div className="button-group">
          <button 
            onClick={handleUpload} 
            className="action-button"
            disabled={loading}
          >
            {loading ? '上传中...' : uploadType === 'file' ? '上传文件' : '上传JSON数据'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-message-with-retry">
          <div className="error-message">{error}</div>
          <button 
            onClick={handleUpload} 
            className="retry-button"
            disabled={loading}
          >
            重试
          </button>
        </div>
      )}
      
      {loading && <div className="loading">正在上传数据...</div>}
      
      {result && (
        <div className="result-container">
          <h3>上传结果:</h3>
          <pre className="result-display">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default JsonUpload; 