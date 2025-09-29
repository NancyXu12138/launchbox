API key：app-hH1FffISrV0a9IUiatA2Z5aa

工作流编排对话型应用 API
对话应用支持会话持久化，可将之前的聊天记录作为上下文进行回答，可适用于聊天/客服 AI 等。

基础 URL
Code
http://dify.garenanow.com/v1

Copy
Copied!
鉴权
Service API 使用 API-Key 进行鉴权。 强烈建议开发者把 API-Key 放在后端存储，而非分享或者放在客户端存储，以免 API-Key 泄露，导致财产损失。 所有 API 请求都应在 Authorization HTTP Header 中包含您的 API-Key，如下所示：

Code
  Authorization: Bearer {API_KEY}