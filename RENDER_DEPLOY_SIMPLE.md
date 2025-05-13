# 简化版 Render 部署指南

本文档提供在 Render 平台上部署 Redis 控制台前端应用的简化指南。

## 特点

- **无需环境变量配置**：所有配置都已经内置在代码中
- **测试环境与生产环境一致**：确保行为一致性
- **简单部署流程**：只需两个命令即可部署

## 部署步骤

### 1. 准备工作

1. 确保您有一个 [Render](https://render.com) 账户
2. 将项目代码推送到 GitHub 或 GitLab 仓库

### 2. 在 Render 上创建 Web 服务

1. 登录 Render 控制台
2. 点击 "New +" 按钮，选择 "Web Service"
3. 连接您的 GitHub/GitLab 账户并选择项目仓库
4. 填写以下信息：
   - **Name**: redis-ctl-frontend (或您喜欢的任何名称)
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. 点击 "Create Web Service" 按钮

### 3. 使用 Blueprint (可选)

如果您想使用 Blueprint 方式部署，可以：

1. 确保项目根目录包含 `render.yaml` 文件
2. 在 Render 控制台点击 "Blueprints" > "New Blueprint Instance"
3. 选择项目仓库，Render 将自动配置服务

## 验证部署

1. 部署完成后，Render 将提供一个可访问的URL
2. 访问该URL并验证应用是否正常工作
3. 测试各项功能，特别是数据库查询功能

## 故障排查

如果遇到问题：

1. 查看 Render 日志：在 Web 服务页面点击 "Logs" 查看详细日志
2. 检查浏览器控制台：查看是否有任何 API 请求错误

## 其他说明

- 我们已经将后端 API 地址硬编码为 `https://redis-ctl-api.onrender.com`
- 所有 API 请求都使用相对路径，并由服务器代理转发
- 测试环境和生产环境使用相同的配置，确保行为一致 