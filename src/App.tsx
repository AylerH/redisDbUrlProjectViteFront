import { useState } from 'react'
import './App.css'
import GetOperations from './components/GetOperations'
import FuzzyMatchById from './components/FuzzyMatchById'
import FuzzyMatchByName from './components/FuzzyMatchByName'
import FuzzyMatchBlankId from './components/FuzzyMatchBlankId'
import FuzzyMatchBlankName from './components/FuzzyMatchBlankName'
import JsonUpload from './components/JsonUpload'
import JsonExport from './components/JsonExport'

// 页面类型
type PageType = 'get-operations' | 
                'fuzzy-match-id' | 
                'fuzzy-match-name' | 
                'fuzzy-match-blank-id' | 
                'fuzzy-match-blank-name' | 
                'json-upload' | 
                'json-export'

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('get-operations')

  // 渲染当前页面内容
  const renderContent = () => {
    switch (currentPage) {
      case 'get-operations':
        return <GetOperations />
      case 'fuzzy-match-id':
        return <FuzzyMatchById />
      case 'fuzzy-match-name':
        return <FuzzyMatchByName />
      case 'fuzzy-match-blank-id':
        return <FuzzyMatchBlankId />
      case 'fuzzy-match-blank-name':
        return <FuzzyMatchBlankName />
      case 'json-upload':
        return <JsonUpload />
      case 'json-export':
        return <JsonExport />
      default:
        return <GetOperations />
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Redis 数据库管理控制台</h1>
        <nav className="main-nav">
          <ul>
            <li>
              <button 
                className={`nav-button ${currentPage === 'get-operations' ? 'active' : ''}`}
                onClick={() => setCurrentPage('get-operations')}
              >
                GET操作
              </button>
            </li>
            <li>
              <button 
                className={`nav-button ${currentPage === 'fuzzy-match-id' ? 'active' : ''}`}
                onClick={() => setCurrentPage('fuzzy-match-id')}
              >
                ID模糊匹配
              </button>
            </li>
            <li>
              <button 
                className={`nav-button ${currentPage === 'fuzzy-match-name' ? 'active' : ''}`}
                onClick={() => setCurrentPage('fuzzy-match-name')}
              >
                名称模糊匹配
              </button>
            </li>
            <li>
              <button 
                className={`nav-button ${currentPage === 'fuzzy-match-blank-id' ? 'active' : ''}`}
                onClick={() => setCurrentPage('fuzzy-match-blank-id')}
              >
                空格ID匹配
              </button>
            </li>
            <li>
              <button 
                className={`nav-button ${currentPage === 'fuzzy-match-blank-name' ? 'active' : ''}`}
                onClick={() => setCurrentPage('fuzzy-match-blank-name')}
              >
                空格名称匹配
              </button>
            </li>
            <li>
              <button 
                className={`nav-button ${currentPage === 'json-upload' ? 'active' : ''}`}
                onClick={() => setCurrentPage('json-upload')}
              >
                JSON上传
              </button>
            </li>
            <li>
              <button 
                className={`nav-button ${currentPage === 'json-export' ? 'active' : ''}`}
                onClick={() => setCurrentPage('json-export')}
              >
                JSON导出
              </button>
            </li>
          </ul>
        </nav>
      </header>
      <main className="App-main">
        {renderContent()}
      </main>
      <footer className="App-footer">
        <p>Redis 数据库控制台 &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
