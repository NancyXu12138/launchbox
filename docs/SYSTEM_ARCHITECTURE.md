# 🏗️ 系统架构详解

## 📊 整体架构流程图

```
用户输入 → 意图识别 → 路由分发 → 工具执行 → 结果返回
          ↓            ↓           ↓
      快速检测    LLM分类     TodoList
      (关键词)   (gpt-4.1-nano) Workflow
                              Event Planner
                              Image Gen
                              Text Answer
```

---

## 🧠 **1. 意图识别（Intent Classifier）详解**

### **1.1 双层识别机制**

#### **第一层：快速关键词检测（fallbackIntentDetection）**
- **位置**：`src/services/intentClassifier.ts` (98-193行)
- **触发条件**：`confidence >= 0.8` 时直接使用，不调用LLM
- **使用模型**：❌ 无（纯规则匹配）
- **优点**：速度快、零成本、高准确率（对明显关键词）

**检测规则**：
```typescript
// 活动策划检测
if ((lowerMsg.includes('活动') && lowerMsg.includes('策划')) || 
    (lowerMsg.includes('活动') && lowerMsg.includes('方案')) ||
    lowerMsg.includes('运营活动')) {
  // 排除竞品分析场景
  if (lowerMsg.includes('竞品') || lowerMsg.includes('对手') || lowerMsg.includes('竞争')) {
    return 'need_workflow'; // 竞品分析 → workflow
  }
  return 'event_planning'; // 活动策划
}

// 竞品分析专项检测
if (lowerMsg.includes('竞品') || lowerMsg.includes('竞争对手') || 
    (lowerMsg.includes('市场') && lowerMsg.includes('分析'))) {
  return 'need_workflow';
}

// 复杂任务检测
if ((lowerMsg.includes('帮我') || lowerMsg.includes('请') || lowerMsg.includes('需要')) &&
    (lowerMsg.includes('分析') || lowerMsg.includes('制定') || 
     lowerMsg.includes('生成') || lowerMsg.includes('创建') || lowerMsg.includes('计划')) &&
    message.length > 20) {
  return 'need_workflow';
}
```

---

#### **第二层：LLM智能分类（classifyIntent）**
- **位置**：`src/services/intentClassifier.ts` (30-93行)
- **触发条件**：快速检测 `confidence < 0.8` 时调用
- **使用模型**：**`gpt-4.1-nano`** ✅
- **配置文件**：`src/services/modelConfig.ts` (19-24行)

**模型参数**：
```typescript
{
  model: 'gpt-4.1-nano',      // 最小最快的GPT模型
  temperature: 0.3,            // 低温度 = 更稳定的分类
  max_tokens: 500,             // 只需要返回JSON，不需要长文本
  description: '快速意图识别，低成本高效率'
}
```

**System Prompt**（关键部分）：
```text
你是一个意图分类助手。快速准确地分析用户的输入，判断需要采取什么行动。

可用工具和场景：
1. event_planning - 活动策划
2. image_generation - 图像生成
3. knowledge_search - 知识库检索
4. translation - 翻译
5. code_explanation - 代码解释
6. need_workflow - 多步骤任务（竞品分析、制定计划等）
7. text_answer - 直接文本回答

请以JSON格式返回（只返回JSON，不要其他文字）：
{
  "intent": "工具类型",
  "confidence": 0.95,
  "reasoning": "简短的判断理由"
}
```

---

### **1.2 意图路由逻辑**

**位置**：`src/modules/chat/ChatPage.tsx` (1304-1354行)

**完整流程**：
```typescript
async function handleIntelligentSend(message: string) {
  // 特殊检测：Event Planner 会话状态
  if (eventPlannerSessionId && (
    message.includes('选择方案') || 
    message.includes('重新生成') ||
    message.includes('方案1') || message.includes('方案2') || message.includes('方案3')
  )) {
    await handleEventPlannerSelection(message);
    return;
  }
  
  // 步骤1：意图识别
  let intentResult: IntentResult;
  const quickIntent = quickIntentCheck(message); // 快速检测
  
  if (quickIntent.confidence >= 0.8) {
    intentResult = quickIntent; // 使用快速结果
  } else {
    intentResult = await classifyIntent(message); // 调用LLM
  }
  
  // 步骤2：路由分发
  switch (intentResult.intent) {
    case 'event_planning':
      await handleEventPlanner(message);
      return;
      
    case 'image_generation':
      await handleImageGeneration(message);
      return;
      
    case 'knowledge_search':
      pushMessage({ role: 'agent', text: '🔍 知识库检索功能正在开发中...' });
      return;
      
    case 'translation':
    case 'code_explanation':
    case 'text_answer':
      await handleAIResponse(); // 普通对话
      return;
      
    case 'need_workflow':
      await handleWorkflowTask(message); // TodoList
      return;
      
    default:
      await handleAIResponse();
      return;
  }
}
```

---

## 📝 **2. TodoList 唤起逻辑详解**

### **2.1 触发条件**

**位置**：`src/modules/chat/ChatPage.tsx` (1356-1388行)

```typescript
async function handleWorkflowTask(message: string): Promise<void> {
  // 获取选中的命令模板
  const selectedCommand = selectedCommandId 
    ? commands.find(cmd => cmd.id === selectedCommandId) 
    : null;
  
  // 判断是否需要生成TodoList
  const shouldGenerateTodo = selectedCommand || message.length > 50;
  
  if (shouldGenerateTodo) {
    // ✅ 生成TodoList
    pushMessage({ role: 'agent', text: '📋 正在分析您的任务，制定执行计划...' });
    
    const inputForAnalysis = selectedCommand 
      ? `${selectedCommand.name}: ${selectedCommand.description}` 
      : message;
    
    const todoList = await generateSimpleTodoWithLLM(inputForAnalysis);
    
    if (todoList) {
      // 显示TodoList UI
      upsertConversation(prev => prev.map(c => {
        if (c.id !== activeId) return c;
        return {
          ...c,
          todos: [...(c.todos || []), todoList],
          updatedAt: Date.now()
        };
      }));
      
      pushMessage({
        role: 'agent',
        text: `📋 **任务执行计划已生成**，共${todoList.steps.length}个步骤。请点击"开始执行"按钮来启动任务。`
      });
    }
  } else {
    // ❌ 不生成TodoList，走普通对话
    await handleAIResponse();
  }
}
```

**触发条件总结**：
1. **用户选择了命令模板** → 100%生成TodoList
2. **消息长度 > 50字符** → 生成TodoList
3. **意图识别为 `need_workflow`** → 触发 `handleWorkflowTask`

---

### **2.2 TodoList 生成使用的模型**

#### **生成TodoList步骤**
- **文件**：`src/services/simpleTodoGenerator.ts`
- **使用模型**：**`gpt-4o-mini`** ✅
- **配置**：`src/services/modelConfig.ts` (59-64行)

```typescript
{
  model: 'gpt-4o-mini',
  temperature: 0.4,           // 中等温度，既保证创意又保证结构
  max_tokens: 2000,
  description: '任务步骤拆解'
}
```

**调用代码**：
```typescript
export async function generateSimpleTodoWithLLM(userInput: string): Promise<SimpleTodoList | null> {
  const prompt = generateTodoAnalysisPrompt(userInput);
  const modelConfig = selectModelForTask('todo_generation'); // gpt-4o-mini
  
  const messages = [{ role: 'user' as const, content: prompt }];
  
  const response = await backendApiService.getChatCompletion(
    messages,
    modelConfig.temperature,  // 0.4
    modelConfig.max_tokens,   // 2000
    modelConfig.model         // gpt-4o-mini
  );
  
  // 解析步骤
  const steps = parseStepsFromLLMResponse(response.content);
  return { id, title, steps, status: 'pending', createdAt };
}
```

---

#### **执行TodoList步骤**
- **文件**：`src/services/todoExecutionService.ts`
- **使用模型**：**后端API默认模型** ✅
- **调用方式**：所有LLM调用统一通过 `callLLM()` 辅助方法

```typescript
private async callLLM(prompt: string, maxTokens: number = 2000): Promise<string> {
  const messages = [{ role: 'user' as const, content: prompt }];
  const response = await backendApiService.getChatCompletion(
    messages, 
    0.7,        // 默认温度
    maxTokens
  );
  if (!response.success || !response.content) {
    throw new Error(response.error || '后端API调用失败');
  }
  return response.content;
}
```

**使用场景**（8处替换）：
- `selectActionWithLLM` - 选择合适的动作
- `executeLLMTask` - 执行LLM任务
- `validateUserInputWithLLM` - 验证用户输入
- `executeLLMAction` - 执行LLM动作
- `extractActionParameters` - 提取动作参数

---

## 🎭 **3. 所有场景使用的模型汇总**

| 场景 | 模型 | Temperature | Max Tokens | 说明 |
|------|------|-------------|------------|------|
| 意图识别 | `gpt-4.1-nano` | 0.3 | 500 | 最快最便宜 |
| 普通对话 | `gpt-4o-mini` | 0.7 | 2000 | 平衡性能 |
| 复杂推理 | `o4-mini` | 0.5 | 4000 | 深度思考 |
| 工作流规划 | `gpt-4.1` | 0.4 | 3000 | 任务编排 |
| 活动策划 | `gpt-5` | 0.7 | 16000 | 最详细 |
| Todo生成 | `gpt-4o-mini` | 0.4 | 2000 | 步骤拆解 |
| Todo执行 | 默认(后端配置) | 0.7 | 2000 | 通用任务 |

---

## 🔄 **4. 完整的用户交互流程示例**

### **示例1：竞品分析（触发TodoList）**

```
用户输入：帮我做一个原神的竞品计划

↓ [快速关键词检测]
✅ 检测到："竞品" + "计划"
→ intent = 'need_workflow', confidence = 0.8

↓ [路由分发]
→ handleWorkflowTask(message)

↓ [判断条件]
✅ message.length (15) < 50，但包含"竞品"关键词
→ shouldGenerateTodo = false

❌ 问题：这里应该触发TodoList，但规则有bug！

修复后：
✅ "竞品分析"在快速检测时 confidence=0.8 → need_workflow
✅ need_workflow → handleWorkflowTask
✅ 包含"竞品"关键词 → 应强制生成TodoList
```

---

### **示例2：计算问题（普通对话）**

```
用户输入：帮我计算8*222

↓ [快速关键词检测]
❌ 无匹配关键词
→ intent = 'text_answer', confidence = 0.9

↓ [路由分发]
→ handleAIResponse()

↓ [调用模型]
→ backendApiService.startStreamingChat()
→ 使用 gpt-4o-mini (general_chat)

↓ [返回结果]
✅ "8 * 222 = 1776"
```

---

## ⚠️ **当前发现的Bug**

### **Bug 1：上下文混淆**
- **现象**：问"8*222"却回答了上一个问题
- **原因**：`handleAIResponse()` 会读取整个对话历史，如果上一个问题是竞品分析，LLM可能会继续延续该话题
- **修复方案**：需要在 `handleAIResponse()` 中明确告知LLM"这是一个新问题"

### **Bug 2：Markdown格式直接显示**
- **现象**：AI回复显示 `###` 而不是渲染后的标题
- **原因**：某些消息没有经过 `MarkdownRenderer` 组件渲染
- **修复方案**：确保所有Agent消息都使用 `MarkdownRenderer`

### **Bug 3：无限循环渲染**
- **现象**：`Maximum update depth exceeded`
- **原因**：`upsertConversation` 在 WebSocket `onmessage` 中频繁更新，导致React无限渲染
- **修复方案**：需要添加防抖逻辑

---

## 📚 **相关文件索引**

| 文件 | 功能 | 关键行数 |
|------|------|---------|
| `src/services/intentClassifier.ts` | 意图识别 | 30-93 (LLM), 98-193 (关键词) |
| `src/services/modelConfig.ts` | 模型配置 | 17-65 |
| `src/modules/chat/ChatPage.tsx` | 主聊天逻辑 | 1304-1388 |
| `src/services/simpleTodoGenerator.ts` | Todo生成 | 全文件 |
| `src/services/todoExecutionService.ts` | Todo执行 | 全文件 |
| `src/services/backendApiService.ts` | 后端API | 150-240 |

---

## 🎯 **总结**

**当前系统的优点**：
✅ 双层意图识别（快速+精确）
✅ 动态模型选择（成本优化）
✅ 统一的LLM调用接口
✅ 清晰的路由逻辑

**需要优化的地方**：
⚠️ 修复上下文混淆问题
⚠️ 修复Markdown渲染问题
⚠️ 修复无限循环渲染问题
⚠️ 优化TodoList触发条件（竞品分析等场景）

---

**文档生成时间**: 2025-01-16
**系统版本**: Launchbox v0.1.0

