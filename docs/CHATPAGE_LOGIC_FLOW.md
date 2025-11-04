# 💬 ChatPage 完整功能逻辑说明

## 📋 概览

ChatPage是整个系统的核心交互界面，负责处理用户输入、意图识别、工具调用、LLM对话等所有功能。

**文件位置**: `/Users/xunanxi/Desktop/GameAgent/src/modules/chat/ChatPage.tsx`

---

## 🎯 核心流程图

```
用户输入
    ↓
[1] 意图识别 (quickIntentCheck / classifyIntent)
    ↓
    ├─→ text_answer → [2] LLM对话 (handleAIResponse)
    ├─→ tool_call → [3] 工具调用 (handleToolCall)
    │                     ↓
    │                 [3.1] 参数提取 (extractParameters)
    │                     ↓
    │                 [3.2] 执行工具
    │                     ↓
    │                 [3.3] 返回结果
    │
    ├─→ workflow → [4] 工作流处理 (handleWorkflowTask)
    │                     ↓
    │                 [4.1] 生成Todo List
    │                     ↓
    │                 [4.2] 用户确认执行
    │                     ↓
    │                 [4.3] 逐步执行Todo
    │
    └─→ clarify → [5] 请求补充信息
```

---

## 📝 详细功能模块

### 1. 用户输入处理

#### 入口函数: `handleSend()`

**位置**: ChatPage.tsx:1257

**功能**:
1. 获取用户输入
2. 创建用户消息
3. 添加到对话历史
4. 清空输入框
5. 调用 `handleUserMessage()` 处理消息

**代码逻辑**:
```typescript
async function handleSend(): Promise<void> {
  const message = input.trim();
  if (!message && !selectedCommandId) return;
  
  // 处理待处理的用户输入
  const pendingStepId = checkForPendingUserInput();
  if (pendingStepId) {
    await handleUserInputResponse(pendingStepId, message);
    setInput('');
    return;
  }
  
  // 正常发送消息
  pushMessage({ role: 'user', text: message });
  setInput('');
  
  // 处理用户消息
  await handleUserMessage(message);
}
```

---

### 2. 意图识别系统 🧠

#### 核心函数: `handleUserMessage()`

**位置**: ChatPage.tsx:1315

**功能**: 智能识别用户意图并路由到对应处理器

#### 2.1 快速意图检测 (关键词匹配)

**函数**: `quickIntentCheck(message)`
**文件**: `src/services/intentClassifier.ts`

**优势**: 快速、不消耗API
**适用**: 明确的关键词匹配场景

**关键词规则**:
- **数学计算**: `[0-9+\-*/()]` + "计算|等于|是多少"
- **图像生成**: "生成图|画图|生图|画一个"
- **活动策划**: "活动" + "策划" (排除竞品分析)
- **文本处理**: "字数|统计文本|大写|小写"
- **JSON处理**: "json|{|格式化数据"
- **日期时间**: "现在几点|当前时间|今天日期"
- **情感分析**: "情感分析|分析评论"
- **工作流**: "竞品分析|用户反馈|活动策划方案"

**返回结构**:
```typescript
{
  intent: 'tool_call',
  toolId: 'calculator',
  confidence: 0.9,
  shouldUseLLM: false,
  reasoning: '关键词匹配：数学计算'
}
```

#### 2.2 LLM意图分类 (AI理解)

**函数**: `classifyIntent(message)`
**文件**: `src/services/intentClassifier.ts`

**触发条件**: 快速检测置信度 < 0.8

**LLM提示词**:
```
你是一个意图分类专家...

## 意图类型：
1. text_answer（直接文本回答）
2. tool_call（单工具调用）
3. workflow（多步骤工作流）
4. clarify（信息补齐）
```

**返回JSON**:
```json
{
  "intent": "tool_call",
  "toolId": "calculator",
  "confidence": 0.95,
  "reasoning": "明确的数学计算需求"
}
```

#### 2.3 意图路由 (Switch分发)

**位置**: ChatPage.tsx:1341

```typescript
switch (intentResult.intent) {
  case 'tool_call':
    await handleToolCall(intentResult.toolId, message);
    return;
  
  case 'workflow':
    await handleWorkflowTask(message);
    return;
  
  case 'clarify':
    pushMessage({ role: 'agent', text: '请提供更多信息...' });
    return;
  
  case 'text_answer':
  default:
    await handleAIResponse();
    return;
}
```

---

### 3. 工具调用系统 🛠️

#### 核心函数: `handleToolCall(toolId, message)`

**位置**: ChatPage.tsx:1372

#### 3.1 智能降级判断

**触发条件**: 用户要求详细解释

```typescript
const needsExplanation = message.includes('步骤') || 
                         message.includes('过程') || 
                         message.includes('解释') || 
                         message.includes('详细');

if (needsExplanation) {
  console.log('🤖 用户需要详细解释，切换到LLM处理');
  await handleAIResponse();
  return;
}
```

**示例**:
- ❌ 工具调用: "计算 2+2"
- ✅ LLM处理: "计算 2+2 并给我详细步骤"

#### 3.2 参数提取系统 ⚡

**新增功能** (刚刚实现)

**文件**: `src/services/parameterExtractor.ts`

**两层提取策略**:

##### 第一层：快速提取 (正则匹配)
```typescript
quickExtractParameters(toolId, message)
```

**适用场景**: 简单、明确的输入

**示例**:
```typescript
// 输入: "2+2"
// 输出: {expression: "2+2"}

// 输入: "8*9*123+567"
// 输出: {expression: "8*9*123+567"}
```

##### 第二层：LLM智能提取
```typescript
extractParameters(toolId, message)
```

**适用场景**: 复杂的自然语言输入

**流程**:
1. 读取工具的参数定义
2. 构建提取提示词
3. 调用LLM理解并提取
4. 解析返回的JSON参数

**示例**:
```typescript
// 输入: "帮我计算8*8*9*123+567-1232/890的结果"
// LLM理解后提取:
// 输出: {expression: "8*8*9*123+567-1232/890"}
```

**LLM提示词结构**:
```
你是一个参数提取专家...

工具信息：
- 工具ID: calculator
- 工具名称: 数学计算器
- 工具描述: 执行数学运算...

参数定义：
- expression (string): 数学表达式 [必需]

要求：
1. 仔细分析用户输入
2. 对于calculator：只提取纯数学表达式
3. 返回JSON格式

用户输入：帮我计算8*8*9*123+567-1232/890的结果
```

**LLM返回**:
```json
{
  "expression": "8*8*9*123+567-1232/890"
}
```

#### 3.3 工具执行

**函数**: `actionExecutorService.executeAction()`

**参数**:
```typescript
{
  action_id: 'calculator',
  action_name: '数学计算器',
  action_type: 'code_execution',
  parameters: {expression: "8*8*9*123+567-1232/890"}
}
```

**后端API**: `POST /api/execute-action`

**返回**:
```json
{
  "success": true,
  "type": "calculation",
  "data": {
    "expression": "8*8*9*123+567-1232/890",
    "result": 71353.615730337078
  },
  "message": "计算结果: 71353.615730337078"
}
```

#### 3.4 结果显示

```typescript
if (result.success) {
  if (toolId === 'calculator') {
    displayText = `计算结果：${result.data?.result}\n\n表达式：${parameters.expression}`;
  } else {
    displayText = result.data?.result || result.data?.response;
  }
} else {
  // 失败时自动降级到LLM处理
  await handleAIResponse();
}
```

#### 3.5 特殊工具处理

**图像生成** (`gpt_image_gen`):
```typescript
if (toolId === 'gpt_image_gen') {
  await handleImageGeneration(message);
  return;
}
```

**Event Planner** (`event_planning`):
```typescript
if (toolId === 'event_planning') {
  await handleEventPlanner(message);
  return;
}
```

---

### 4. LLM对话系统 🤖

#### 核心函数: `handleAIResponse()`

**位置**: ChatPage.tsx:1044

#### 4.1 RAG知识库增强

**可选功能**: 根据设置启用/禁用

**流程**:
```typescript
if (ragSettings.enabled) {
  const knowledgeSources = getKnowledgeSources();
  if (knowledgeSources.some(source => source.status === 'active')) {
    const searchResults = await searchKnowledgeBase(
      lastUserMessage, 
      ragSettings.maxResults
    );
    if (searchResults.length > 0) {
      const context = formatSearchResultsAsContext(searchResults);
      contextualPrompt = `${context}\n\n${lastUserMessage}`;
    }
  }
}
```

**效果**: 将知识库中的相关内容添加到提示词中

#### 4.2 历史对话管理

**内存优化**:
```typescript
const isSimpleQuery = lastUserMessage.length < 30 || 
                     /^\d+[\+\-\*\/\%]\d+/.test(lastUserMessage);

const contextMessages = isSimpleQuery 
  ? trimmedMessages.slice(-6)  // 简单问题：保留3轮
  : trimmedMessages;           // 复杂问题：保留完整上下文
```

#### 4.3 流式响应处理

**WebSocket连接**: `ws://localhost:8001/ws/chat`

**流程**:
1. 创建助手消息（`isThinking: true`）
2. 显示"正在思考中..."loading动画
3. 接收流式chunk
4. 节流更新UI（50ms/次）
5. 完成后清除loading状态

**代码**:
```typescript
await backendApiService.startStreamingChat(
  backendMessages,
  (chunk: string) => {
    streamBuffer += chunk;
    const now = Date.now();
    
    if (now - lastUpdateTime < UPDATE_THROTTLE) {
      return; // 节流
    }
    
    lastUpdateTime = now;
    upsertConversation(prev => prev.map(c => {
      if (c.id !== activeId) return c;
      const nextMessages = c.messages.map(m => {
        if (m.id !== assistantId) return m;
        const merged = m.text + streamBuffer;
        const { visible, thinking } = splitThinking(merged);
        return { 
          ...m, 
          text: visible, 
          thinking,
          isThinking: false // 收到数据后清除loading
        };
      });
      streamBuffer = '';
      return { ...c, messages: nextMessages, updatedAt: now };
    }));
  },
  () => console.log('✅ Backend streaming completed'),
  (error) => console.error('❌ Backend streaming error:', error)
);
```

---

### 5. 工作流系统 (Todo) 📋

#### 核心函数: `handleWorkflowTask(message)`

**位置**: ChatPage.tsx:1503

#### 5.1 判断是否需要Todo

**条件**:
- 用户选择了指令模板（Command Center）
- 或者消息长度 > 50字符

```typescript
const selectedCommand = selectedCommandId 
  ? commands.find(cmd => cmd.id === selectedCommandId) 
  : null;

const shouldGenerateTodo = selectedCommand || message.length > 50;
```

#### 5.2 生成Todo List

**函数**: `generateSimpleTodoWithLLM(enhancedMessage)`

**增强消息**:
```typescript
if (selectedCommand?.name && selectedCommand?.todoList) {
  enhancedMessage = `请按照以下指令模板制定详细的执行计划：

指令模板：${selectedCommand.name}
任务步骤：
${selectedCommand.todoList}

用户需求：${message}

请根据用户的具体需求，参考上述模板步骤，制定详细的执行计划。`;
}
```

**生成的Todo结构**:
```typescript
{
  title: "竞品分析任务",
  description: "分析XX游戏的竞品情况",
  totalSteps: 4,
  steps: [
    {
      id: "step-1",
      text: "搜索竞品信息",
      status: "pending"
    },
    {
      id: "step-2",
      text: "分析竞品特点",
      status: "pending"
    },
    // ...
  ]
}
```

#### 5.3 用户确认执行

**UI**: 底部Todo面板（BottomTodoPanel）

**操作**:
- 查看Todo列表
- 点击"开始执行"按钮
- 系统逐步执行每个步骤

#### 5.4 Todo执行引擎

**文件**: `src/services/todoExecutionService.ts`

**核心类**: `TodoExecutor`

**执行流程**:
```
foreach step in todoList:
  1. 标记step为"执行中"
  2. 识别step类型（Action调用 or LLM任务）
  3. 执行step
  4. 收集执行结果
  5. 标记step为"完成"
  6. 传递结果到下一步（上下文连续性）
```

**上下文推理**: `performContextualReasoning()`
- 分析前面步骤的结果
- 识别当前步骤所需信息
- 构建增强的提示词

---

### 6. Event Planner 系统 🎮

#### 核心函数: `handleEventPlanner(message)`

**位置**: ChatPage.tsx:661

#### 6.1 启动流程

```typescript
const sessionId = `${activeId}_${Date.now()}`;
const result = await actionExecutorService.startEventPlanner(sessionId);
```

#### 6.2 显示表单

**类型**: `event_planner_form`

**表单字段**:
- 活动主题 (theme)
- 活动概述 (overview)
- 业务目标 (businessGoal)
- 目标玩家 (targetPlayer)
- 目标区域 (targetRegion)

#### 6.3 提交表单

**函数**: `handleEventPlannerFormSubmit(sessionId, formData)`

**后端API**: `POST /api/generate-event-plan`

**返回**:
- 低保真原型图 (wireframeImage)
- 高保真设计图 (designImage)
- 完整策划案文本

---

### 7. 图像生成系统 🎨

#### 核心函数: `handleImageGeneration(message)`

**位置**: ChatPage.tsx:573

#### 7.1 提取提示词

**简单提取**: 移除"生成|图片|图像|画"等关键词

#### 7.2 调用图像生成

```typescript
const result = await actionExecutorService.executeImageGeneration(
  prompt, 
  1536,  // width
  1024   // height
);
```

#### 7.3 显示图像

**缓存**: `imageCache.set(messageId, image_base64)`

**UI**: 在消息中显示base64图像
- 点击放大查看
- 支持下载保存

---

## 🎯 完整示例：计算器流程

### 用户输入
```
"帮我计算8*8*9*123+567-1232/890 的结果"
```

### 处理流程

#### 步骤1: 意图识别
```typescript
quickIntentCheck("帮我计算8*8*9*123+567-1232/890 的结果")
// 返回:
{
  intent: 'tool_call',
  toolId: 'calculator',
  confidence: 0.9,
  shouldUseLLM: false,
  reasoning: '关键词匹配：数学计算'
}
```

#### 步骤2: 路由到工具调用
```typescript
switch (intentResult.intent) {
  case 'tool_call':
    await handleToolCall('calculator', message);
}
```

#### 步骤3: 参数提取
```typescript
// 尝试快速提取
quickExtractParameters('calculator', message)
// 返回 null（包含中文，无法快速提取）

// 使用LLM提取
extractParameters('calculator', message)
// LLM理解后返回:
{
  expression: "8*8*9*123+567-1232/890"
}
```

#### 步骤4: 执行工具
```typescript
actionExecutorService.executeAction({
  action_id: 'calculator',
  action_name: '数学计算器',
  action_type: 'code_execution',
  parameters: {expression: "8*8*9*123+567-1232/890"}
})

// 后端执行Python:
// result = eval("8*8*9*123+567-1232/890")

// 返回:
{
  success: true,
  data: {
    expression: "8*8*9*123+567-1232/890",
    result: 71353.615730337078
  }
}
```

#### 步骤5: 显示结果
```typescript
displayText = `计算结果：71353.615730337078

表达式：8*8*9*123+567-1232/890`
```

---

## 🔄 特殊情况处理

### 情况1: 用户要求详细步骤

**输入**: "帮我计算8*8*9 并给我完整计算步骤"

**处理**:
```typescript
const needsExplanation = message.includes('步骤');
// needsExplanation = true

if (needsExplanation) {
  await handleAIResponse(); // 切换到LLM处理
  return;
}
```

**效果**: LLM会生成详细的计算步骤说明

### 情况2: 参数提取失败

**输入**: "帮我算一下"（没有具体表达式）

**处理**:
```typescript
parameters = await extractParameters('calculator', message);
// parameters = {} (空对象)

if (!parameters || Object.keys(parameters).length === 0) {
  await handleAIResponse(); // 切换到LLM处理
  return;
}
```

### 情况3: 工具执行失败

**原因**: 后端报错、网络问题等

**处理**:
```typescript
if (!result.success) {
  console.log('🤖 工具执行失败，切换到LLM处理');
  await handleAIResponse();
  return;
}
```

---

## 📊 状态管理

### 对话状态
```typescript
conversations: Conversation[]  // 所有对话
activeId: string | null        // 当前活跃对话ID
```

### 消息结构
```typescript
type Message = {
  id: string;
  role: 'user' | 'agent';
  text: string;
  createdAt: number;
  isThinking?: boolean;         // 🆕 Loading状态
  thinking?: string;            // 思考过程
  executionResults?: TodoStepResult[]; // Todo执行结果
  imageBase64?: string;         // 生成的图像
  wireframeImage?: string;      // Event Planner原型图
  designImage?: string;         // Event Planner设计图
}
```

### Todo状态
```typescript
currentTodo: SimpleTodoList | null  // 当前Todo
todoExecutors: Record<string, TodoExecutor> // Todo执行器
```

---

## 🎨 UI交互

### Loading状态
```tsx
{m.isThinking ? (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <CircularProgress size={16} />
    <Typography sx={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      正在思考中...
    </Typography>
  </Box>
) : (
  <MarkdownRenderer content={m.text} />
)}
```

### 思考过程展开
```tsx
{m.thinking && (
  <Button onClick={() => setExpandedThinking(prev => ({
    ...prev, 
    [m.id]: !prev[m.id]
  }))}>
    {expandedThinking[m.id] ? '收起思考' : '展开思考'}
  </Button>
)}
```

---

## 📌 关键配置

### 内存设置
```typescript
maxRounds: 10  // 保留最近10轮对话
```

### RAG设置
```typescript
enabled: true,      // 是否启用知识库
maxResults: 3       // 最多返回3个相关结果
```

### 节流配置
```typescript
UPDATE_THROTTLE = 50 // 50ms更新一次UI
```

---

## 🚀 优势特性

### 1. 智能降级
- 工具失败 → 自动切换LLM
- 参数提取失败 → LLM处理
- 需要解释 → LLM回答

### 2. 多层参数提取
- 快速提取（正则）
- LLM智能提取
- 降级方案兜底

### 3. 流式响应
- 实时显示
- 节流优化
- Loading状态

### 4. 上下文连续性
- Todo步骤间传递结果
- RAG知识增强
- 历史对话管理

### 5. 用户体验
- Loading动画
- 思考过程展示
- 错误友好提示

---

## 📝 总结

ChatPage是一个高度集成的智能对话系统，具备：

- ✅ 智能意图识别（关键词 + LLM）
- ✅ 多工具调用（calculator, text_processor, etc.）
- ✅ 参数智能提取（快速 + LLM）
- ✅ LLM对话（流式响应 + RAG增强）
- ✅ 工作流系统（Todo生成和执行）
- ✅ 特殊功能（Event Planner, 图像生成）
- ✅ 智能降级（多层容错）
- ✅ 优秀体验（Loading, 动画, 错误处理）

**核心优势**: 无论用户怎么问，系统都能智能识别并给出合适的回答或执行相应的操作。

---

**文档版本**: 1.0  
**更新日期**: 2025-10-17  
**状态**: ✅ 完整且最新

