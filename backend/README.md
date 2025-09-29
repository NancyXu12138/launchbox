# LaunchBox Backend

基于FastAPI的后端服务，提供OpenAI API集成和安全的API Key管理。

## 🔧 安装和启动

### 1. 安装Python依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 启动后端服务

```bash
python run.py
```

服务将启动在: `http://localhost:8000`

### 3. 验证服务

访问以下端点验证服务状态：

- 健康检查: `http://localhost:8000/health`
- OpenAI测试: `http://localhost:8000/api/test-openai`
- API文档: `http://localhost:8000/docs`

## 🔑 API Key 配置

**重要**: API Key已安全配置在后端，前端不包含任何敏感信息。

当前配置的API Key: `245272a341f7615b103ead37708c5f2fc206b340087df732b47ed8a34fab015d`
使用模型: `gpt-4`

## 📡 API 端点

### WebSocket
- `ws://localhost:8000/ws/chat` - 流式聊天

### REST API
- `POST /api/chat` - 非流式聊天完成
- `GET /api/test-openai` - 测试OpenAI连接
- `GET /health` - 健康检查

## 🔒 安全特性

- API Key只存储在后端配置中
- CORS配置只允许前端域名访问
- WebSocket连接安全管理
- 错误处理和日志记录

## 🚀 生产部署建议

1. 使用环境变量管理API Key
2. 配置HTTPS
3. 设置防火墙规则
4. 使用反向代理（Nginx）
5. 配置日志轮转
