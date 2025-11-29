# AgentApp

这是一个基于 React 和 TypeScript 构建的聊天应用，集成了大模型 API 和 LangGraph 框架。

## 功能特点

- 多会话管理
- 响应式设计，支持移动端和桌面端
- 集成豆包大模型 API
- 使用 LangGraph 构建智能代理

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

## 启动开发服务器

```bash
pnpm dev
```

## 构建生产版本

```bash
pnpm build
```

## 预览生产构建

```bash
pnpm serve
```
