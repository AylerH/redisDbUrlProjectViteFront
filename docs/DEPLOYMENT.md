# Redis 控制台 - 部署指南

本文档提供将Redis控制台前端应用部署到生产环境的步骤说明。

## 先决条件

- Node.js 16.x 或更高版本
- npm 或 yarn 包管理器
- 一个可以静态托管网站的服务器或平台

## 部署步骤

### 1. 构建项目

首先，构建生产环境的应用：

```bash
npm run build
```

这将在 `dist` 目录中生成可部署的静态文件。

### 2. 安装生产依赖

确保安装了生产环境所需的依赖：

```bash
npm install express http-proxy-middleware --save
```

### 3. 启动生产服务器

使用提供的Express服务器启动应用：

```bash
node server.cjs
```

应用将在 http://localhost:3000 运行（如果您想更改端口，可以设置 PORT 环境变量）。

### 4. 使用PM2进行进程管理（推荐）

为了确保应用持久运行，建议使用PM2进程管理器：

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start server.cjs --name redis-control-frontend

# 配置开机自启
pm2 startup
pm2 save
```

## 部署到云服务

### Render.com

1. 创建新的Web Service
2. 连接到您的GitHub仓库
3. 构建命令：`npm install && npm run build`
4. 启动命令：`node server.cjs`
5. 添加环境变量：`PORT=10000`（如有需要）

### Vercel

对于Vercel部署，需要创建一个简单的`vercel.json`配置文件处理API请求：

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://redis-ctl-api.onrender.com/$1" },
    { "source": "/db_redis/(.*)", "destination": "https://redis-ctl-api.onrender.com/db_redis/$1" }
  ]
}
```

然后按照Vercel的标准部署流程即可。

## 故障排除

### 无法连接到API服务

检查`server.cjs`中的API代理配置，确保`target`设置为正确的后端API地址。

### 页面加载但没有数据

打开浏览器控制台，检查是否有网络请求错误。可能需要调整CORS设置或API代理配置。

## 自定义配置

如果您需要更改后端API的URL，请修改`server.cjs`文件中的`target`值：

```javascript
const apiProxy = createProxyMiddleware({
  target: 'https://your-new-api-url.com',
  // 其他配置...
});
``` 