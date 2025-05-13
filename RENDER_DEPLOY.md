# Render 部署指南

本文档提供在 Render 平台上部署 Redis 控制台前端应用的详细指南。

## 准备工作

1. 确保您有一个 [Render](https://render.com) 账户
2. 项目必须已经推送到 GitHub 或 GitLab 仓库

## 部署步骤

### 1. 通过 Git 部署

1. 登录 Render 控制台
2. 点击 "New +" 按钮，选择 "Web Service"
3. 连接您的 GitHub/GitLab 账户并选择项目仓库
4. 填写以下信息：
   - **Name**: redis-ctl-frontend (或您喜欢的任何名称)
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run render-start`

### 2. 使用 render.yaml 部署 (推荐)

1. 确保项目根目录包含 `render.yaml` 文件
2. 登录 Render 控制台
3. 点击 "New +" 按钮，选择 "Blueprint"
4. 连接您的 GitHub/GitLab 账户并选择项目仓库
5. Render 将自动检测 `render.yaml` 并配置服务

### 3. 环境变量配置

确保以下环境变量在 Render 中正确配置：

- `NODE_ENV`: 设置为 `production`
- `PORT`: 设置为 `10000` (或任何您喜欢的端口)
- `BACKEND_URL`: 设置为 `https://redis-ctl-api.onrender.com` (或您的实际 API URL)

您可以在 Render 控制台的 "Environment" 部分设置这些变量。

## 应用排错

如果部署后遇到问题，请检查以下可能的原因：

### 1. 查看 Render 日志

1. 在 Render 控制台，进入您的 Web 服务
2. 点击 "Logs" 查看服务日志
3. 查找任何错误或警告信息

### 2. 常见问题与解决方案

#### API 请求失败

症状：页面加载，但无法获取数据

解决方案：
- 检查代理设置是否正确配置
- 确认 BACKEND_URL 环境变量设置正确
- 在浏览器控制台中查看网络请求，检查错误状态

#### 应用无法启动

症状：Render 显示部署失败或服务健康检查失败

解决方案：
- 检查 `start.js` 和 `server.cjs` 文件中的任何语法错误
- 确保所有依赖都在 package.json 中列出
- 可能需要检查 Render 的 Node.js 版本兼容性

#### CORS 问题

症状：浏览器控制台显示 CORS 错误

解决方案：
- 确认 server.cjs 中的 CORS 配置正确
- 验证 API 服务器是否允许来自 Render 域的请求

## 持续集成/部署

Render 自动提供持续部署：

1. 当您推送更改到连接的 Git 仓库时，Render 会自动重新部署
2. 您可以在 Render 控制台的 "Settings" > "Build & Deploy" 部分配置自动部署选项

## 额外资源

- [Render Node.js 服务文档](https://render.com/docs/web-services)
- [Render 环境变量文档](https://render.com/docs/environment-variables)
- [Render Blueprint 文档](https://render.com/docs/infrastructure-as-code)

如需更多帮助，请查看完整的 [Render 文档](https://render.com/docs) 或联系 Render 支持。 