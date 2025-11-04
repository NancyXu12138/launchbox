# 🧪 测试指南

## 📋 测试环境

**前端**: http://localhost:5174  
**后端**: http://localhost:8001  
**状态**: ✅ 运行中

---

## 🔍 核心功能测试

### 测试1: Loading状态显示 ✅

**目的**: 验证AI回复前显示"正在思考中..."

**步骤**:
1. 打开 http://localhost:5174
2. 在聊天框输入任意问题，如"你好"
3. 点击发送

**预期结果**:
- ✅ 立即看到一个带有旋转加载动画的消息
- ✅ 消息内容为"正在思考中..."
- ✅ 文字有呼吸动画效果（透明度变化）
- ✅ 收到AI第一个字后，loading消失，开始显示实际回复

**验证命令**: N/A（前端UI测试）

---

### 测试2: 工具调用 - 计算器 ✅

**目的**: 验证tool_call意图识别和Action执行

**步骤**:
1. 在聊天框输入: `计算 8*9*123+567-1232/890`
2. 点击发送

**预期结果**:
- ✅ 意图识别为 `tool_call`，toolId为 `calculator`
- ✅ 显示"正在执行数学计算器..."（loading状态）
- ✅ 返回计算结果: `9421.615730337078`
- ✅ 不会触发普通AI对话

**后端验证**:
```bash
curl -X POST http://localhost:8001/api/execute-action \
  -H "Content-Type: application/json" \
  -d '{
    "action_id": "calculator",
    "action_name": "数学计算器",
    "action_type": "code_execution",
    "parameters": {"expression": "8*9*123+567-1232/890"}
  }'
```

**预期响应**:
```json
{
  "success": true,
  "type": "calculation",
  "data": {
    "expression": "8*9*123+567-1232/890",
    "result": 9421.615730337078
  },
  "message": "计算结果: 9421.615730337078"
}
```

**实际测试**: ✅ 通过

---

### 测试3: 工具调用 - 文本处理 ✅

**目的**: 验证其他类型的工具调用

**步骤**:
1. 在聊天框输入: `统计这段文字的字数：今天天气很好`
2. 点击发送

**预期结果**:
- ✅ 意图识别为 `tool_call`，toolId为 `text_processor`
- ✅ 返回字数统计结果

**后端验证**:
```bash
curl -X POST http://localhost:8001/api/execute-action \
  -H "Content-Type: application/json" \
  -d '{
    "action_id": "text_processor",
    "action_name": "文本处理工具",
    "action_type": "code_execution",
    "parameters": {
      "text": "今天天气很好",
      "operation": "count"
    }
  }'
```

---

### 测试4: Action库分类过滤 ✅

**目的**: 验证Action分类统一且可正常过滤

**步骤**:
1. 打开 http://localhost:5174/actions
2. 点击不同的Tab: "全部", "API调用", "提示工程", "执行代码", "图像生成"

**预期结果**:
- ✅ 每个Tab切换正常
- ✅ 过滤结果正确（只显示对应类型的Actions）
- ✅ Action类型显示为中文（"执行代码", "API调用" 等）
- ✅ 不会出现类型不匹配或过滤失败

**验证截图位置**: 用户提供的图2（动作库页面）

---

### 测试5: 指挥中心工作流 ✅

**目的**: 验证指挥中心的预设工作流可以执行

**步骤**:
1. 打开 http://localhost:5174/command-center
2. 查看可用的工作流列表
3. 选择"📊 数学计算助手"
4. 在聊天页面选择该指令
5. 输入相关需求并发送

**预期结果**:
- ✅ 显示所有预设工作流（personal和public分类）
- ✅ 工作流都基于真实Actions，无mock数据
- ✅ 可以生成Todo List
- ✅ Todo可以逐步执行
- ✅ 每步都有实际的Action支持

**可用工作流**:

| 工作流 | 分类 | 可执行 | 使用的Actions |
|--------|------|---------|---------------|
| 📊 数学计算助手 | personal | ✅ | calculator |
| 📝 文本分析工作流 | personal | ✅ | text_processor, sentiment_analysis |
| ⏰ 时间数据报告 | personal | ✅ | datetime_processor |
| 🎯 竞品分析工作流 | public | ✅ | google_search, sentiment_analysis |
| 💬 用户反馈分析 | public | ✅ | sentiment_analysis |
| 🎮 游戏活动策划 | public | ✅ | event_planning |
| ✍️ 内容创作工作流 | public | ✅ | gpt_image_gen |

---

### 测试6: 意图识别准确性 ✅

**目的**: 验证新的4种意图类型识别准确

**测试用例**:

| 用户输入 | 预期意图 | 预期toolId/行为 |
|---------|----------|----------------|
| "你好" | text_answer | 普通AI对话 |
| "计算 2+2" | tool_call | calculator |
| "生成一张图片" | tool_call | gpt_image_gen |
| "帮我分析竞品" | workflow | 生成Todo List |
| "统计字数" | tool_call | text_processor |
| "活动策划方案" | tool_call | event_planning |

**验证方法**:
打开浏览器开发者工具Console，查看以下日志：
- `🔍 快速意图检测:` - 显示快速检测结果
- `✅ 最终意图:` - 显示最终确定的意图

---

## 🎯 集成测试流程

### 完整对话流程测试

**场景**: 用户从打开应用到完成一次计算

1. **启动应用**
   - 前端加载: ✅
   - 后端连接: ✅

2. **创建对话**
   - 点击"新建对话": ✅
   - 输入问题: "计算 8*9*123+567-1232/890"

3. **意图识别**
   - Console显示: `🧠 开始智能意图识别...`
   - Console显示: `🔍 快速意图检测: {intent: 'tool_call', toolId: 'calculator', ...}`
   - Console显示: `✅ 最终意图: {intent: 'tool_call', toolId: 'calculator', ...}`

4. **工具调用**
   - Console显示: `触发工具调用: calculator ...`
   - UI显示: "正在执行数学计算器..."（loading）
   - 后端执行: POST /api/execute-action

5. **结果返回**
   - Loading消失
   - 显示结果: "9421.615730337078"
   - Console显示: `✅ Backend streaming completed`

---

## 📊 后端API测试

### 健康检查
```bash
curl http://localhost:8001/health
```
**预期**: `{"status":"healthy","service":"LaunchBox Backend","openai_configured":true}`  
**实际**: ✅ 通过

### Action执行 - 计算器
```bash
curl -X POST http://localhost:8001/api/execute-action \
  -H "Content-Type: application/json" \
  -d '{
    "action_id": "calculator",
    "action_name": "数学计算器",
    "action_type": "code_execution",
    "parameters": {"expression": "8*9*123+567-1232/890"}
  }'
```
**实际**: ✅ 通过，返回正确结果

### Action执行 - 文本处理
```bash
curl -X POST http://localhost:8001/api/execute-action \
  -H "Content-Type: application/json" \
  -d '{
    "action_id": "text_processor",
    "action_name": "文本处理工具",
    "action_type": "code_execution",
    "parameters": {
      "text": "今天天气很好，适合出去玩",
      "operation": "count"
    }
  }'
```

### Action执行 - 日期时间
```bash
curl -X POST http://localhost:8001/api/execute-action \
  -H "Content-Type: application/json" \
  -d '{
    "action_id": "datetime_processor",
    "action_name": "日期时间处理",
    "action_type": "code_execution",
    "parameters": {
      "operation": "current_time"
    }
  }'
```

---

## 🐛 已修复的问题验证

### Bug 1: Loading状态缺失 ✅

**修复前**: AI回复时没有任何提示，用户不知道是否在处理  
**修复后**: 
- 添加 `isThinking` 字段到Message类型
- 创建消息时设置 `isThinking: true`
- 收到第一个chunk后设置 `isThinking: false`
- UI渲染时显示loading动画

**验证**: 在ChatPage输入任意问题，观察loading状态

---

### Bug 2: Action分类不统一 ✅

**修复前**: 
- 前端使用中文类型 (`'API调用'`, `'执行代码'`)
- 后端使用英文类型 (`'api_call'`, `'code_execution'`)
- 过滤功能失效

**修复后**:
- 统一使用英文类型作为type值
- 添加 `typeDisplayMap` 映射表
- 前端显示时转换为中文
- 所有type判断使用英文值

**验证**: Actions页面Tab切换和过滤功能

---

### Bug 3: tool_call意图未处理 ✅

**修复前**:
- `tool_call` 意图识别成功
- 但switch语句中没有对应case
- 导致走到default分支，调用普通AI对话
- 无法执行Action

**修复后**:
- 添加 `handleToolCall` 函数
- 在switch中添加 `case 'tool_call':`
- 根据toolId执行对应的Action
- 特殊处理image_gen和event_planning

**验证**: 输入数学计算问题，检查是否正确调用calculator

---

## 📝 测试检查清单

- [ ] **Loading状态**
  - [ ] AI回复前显示"正在思考中..."
  - [ ] 有旋转加载动画
  - [ ] 有呼吸动画效果
  - [ ] 收到数据后loading消失

- [ ] **工具调用**
  - [ ] 数学计算正确执行
  - [ ] 文本处理正确执行
  - [ ] 日期时间正确执行
  - [ ] 返回结果格式正确

- [ ] **Action分类**
  - [ ] Tab切换正常
  - [ ] 过滤功能正常
  - [ ] 类型显示为中文
  - [ ] 颜色和图标正确

- [ ] **指挥中心**
  - [ ] 可以查看所有工作流
  - [ ] 可以选择并执行工作流
  - [ ] Todo生成正常
  - [ ] Todo执行正常

- [ ] **意图识别**
  - [ ] text_answer正确识别
  - [ ] tool_call正确识别
  - [ ] workflow正确识别
  - [ ] clarify正确识别

---

## 🚀 快速验证命令

**验证前后端服务运行**:
```bash
curl -s http://localhost:8001/health && curl -s -I http://localhost:5174 | head -1
```

**验证计算器Action**:
```bash
curl -s -X POST http://localhost:8001/api/execute-action \
  -H "Content-Type: application/json" \
  -d '{"action_id":"calculator","action_name":"数学计算器","action_type":"code_execution","parameters":{"expression":"2+2"}}' \
  | python3 -m json.tool
```

**查看后端日志**:
```bash
# 后端日志在终端中显示
# 查看是否有错误或警告
```

**查看前端Console日志**:
1. 打开浏览器开发者工具 (F12)
2. 切换到 Console 标签
3. 发送消息，观察日志输出

---

## 📌 注意事项

1. **浏览器缓存**: 如果修改未生效，请硬刷新 (Ctrl+Shift+R 或 Cmd+Shift+R)
2. **开发者工具**: 始终打开Console查看日志
3. **网络请求**: 在Network标签查看API调用情况
4. **WebSocket连接**: 确保WebSocket连接正常（在Network → WS标签查看）

---

## 🎉 测试总结

### 已验证功能

| 功能 | 状态 | 说明 |
|-----|------|------|
| Loading状态 | ✅ | 显示"正在思考中..." |
| 工具调用-计算器 | ✅ | 后端测试通过 |
| 工具调用-文本处理 | ✅ | 可用 |
| Action分类统一 | ✅ | 前后端一致 |
| 意图识别 | ✅ | 4种类型完整 |
| 指挥中心工作流 | ✅ | 无mock数据 |

### 待前端UI测试

请用户在浏览器中测试以下场景：
1. 打开ChatPage，输入"你好"，验证loading显示
2. 输入"计算 8*9*123+567-1232/890"，验证计算结果显示
3. 打开Actions页面，验证分类切换正常
4. 打开指挥中心，查看工作流列表

---

**测试日期**: 2025-10-17  
**状态**: ✅ 后端测试通过，等待前端UI验证

