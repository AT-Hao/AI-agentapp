# AgentApp

这是一个基于大语言模型的智能对话应用。它旨在提供一个功能丰富、交互友好的聊天界面，并支持多会话管理、多角色扮演、实时流式响应、网络搜索增强以及思维链的可视化展示。系统采用前后端分离架构，前端基于 Modern.js (React) 构建，后端基于 Node.js (Express) 和 LangGraph 框架构建，并利用 MongoDB 进行数据持久化。

<img width="1599" height="838" alt="image" src="https://github.com/user-attachments/assets/e7740d30-1ac6-4640-87d4-1ec33daf9eeb" />



## 功能特点

- 多会话管理
- 响应式设计，支持移动端和桌面端
- 集成主流大模型 API
- 使用 LangGraph 构建智能代理
- 使用MongoDB数据库缓存对话数据

## 环境变量配置

在项目根目录创建 `.env` 文件，并配置以下环境变量：

```env
API_KEY=your_doubao_api_key_here
MODEL=doubao-lite-4k
```

- `API_KEY`: 你的 API 密钥
- `MODEL`: 要使用的模型名称

## 安装依赖

```bash
pnpm install
```

## 启动前端服务器

```bash
pnpm run dev
```



## 启动后端服务器

```bash
cd ./server
pnpm start
```
