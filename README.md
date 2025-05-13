# Redis 数据库 URL 管理工具

这是一个功能强大的 Redis 数据库控制面板，用于全面管理 Redis 数据库中的数据。该项目使用 Vite 构建，React 框架实现，通过与 Redis API 服务交互，提供直观友好的 UI 界面来操作和监控 Redis 数据库。
# 概览
后端项目gitee(有dockerfile)：https://gitee.com/aylerh/redis-db-url-project

此前端项目github（无dockerfile）：https://github.com/AylerH/redisDbUrlProjectViteFront

## 功能特性

### 基础数据操作（未测试-不建议使用）
- 设置键值对：添加或更新 Redis 中的键值对
- 获取值：根据键名查询对应的值
- 删除键：删除指定的键及其值
- 显示所有键：获取并显示 Redis 中的所有键名

### 数据库管理
- **数据库列表**：查看和管理所有 Redis 数据库
- **数据缓存**：智能缓存数据库列表，减少重复请求
- **手动刷新**：支持强制刷新数据库列表
- **自定义数据库**：允许输入自定义的数据库名称

### GET 操作
- **公司信息查询**：根据ID获取公司详细信息
- **字段查询**：获取特定公司的所有字段和值
- **导出功能**：支持导出数据为格式化JSON或文件

### 模糊匹配
- **ID模糊匹配**：根据相似度查找匹配的公司ID
- **名称模糊匹配**：根据相似度查找匹配的公司名称
- **空格分隔条件匹配**：支持多条件组合搜索
- **相似度调节**：可调整匹配的相似度阈值

### JSON数据导入/导出
- **JSON文件上传**：通过`/upload_json`端点上传JSON文件
- **JSON文本上传**：通过`/load_json_body`端点直接上传JSON数据体
- **数据导出**：将Redis数据导出为JSON格式
- **格式化选项**：支持美化JSON输出
- **文件下载**：支持将导出结果保存为文件

### 用户体验优化
- **错误重试**：上传失败时提供快捷重试选项
- **清晰提示**：详细的错误和成功信息展示
- **格式说明**：提供JSON格式示例和指南
- **响应式设计**：适配不同屏幕尺寸的设备

## 安装方法

### 前提条件

- Node.js (14.x 或更高版本)
- npm 或 yarn 包管理器

### 安装步骤

1. 克隆仓库或解压项目文件

2. 打开终端，进入项目目录
```bash
cd redis-ctl-frontend
```

3. 安装依赖
```bash
npm install
```
或
```bash
yarn
```

## 运行方法

1. 开发环境运行
```bash
npm run dev
```
或
```bash
yarn dev
```

2. 访问应用
在浏览器中打开 [http://localhost:5173](http://localhost:5173) 即可访问应用界面

## 构建项目

如需构建生产环境版本，请执行：

```bash
npm run build
```
查看生产环境：
```
npm run preview
```

或
```bash
yarn build
```

构建后的文件将生成在 `dist` 目录中，可以部署到任何静态网站托管服务。

## API 服务

本应用默认连接到 `https://redis-ctl-api.onrender.com` API 服务。如需更改 API 服务地址，请修改 `src/api/redisApi.ts` 中的 `API_BASE_URL` 常量。

## 技术栈

- React 18
- TypeScript
- Vite
- Axios
- CSS3

## 常见问题

**Q: 应用无法连接到 Redis API?**  
A: 请确保 API 服务正常运行，并检查 API URL 配置是否正确。可使用API端口配置功能更改API端口。

**Q: JSON上传失败出现Network Error?**  
A: 请检查网络连接是否正常，并确认所使用的端点是否正确。对于JSON文本上传请使用`/load_json_body`端点，对于文件上传请使用`/upload_json`端点。

**Q: 数据库列表加载失败?**  
A: 首次加载失败时会使用缓存或模拟数据。点击刷新按钮尝试重新加载，或检查API服务状态。

**Q: 如何在生产环境中使用?**  
A: 构建项目后，将 `dist` 目录部署到静态网站托管服务，如 Netlify、Vercel 或自己的服务器。

# 未来改进方向
## 后端：
- 数据库的fields有个固定的"companies",看看要不要改为动态的；
