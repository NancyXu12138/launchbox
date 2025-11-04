# Services 目录文件说明

## 📋 文件列表和状态

| 文件 | 状态 | 重要性 | 说明 |
|-----|------|--------|------|
| `actionExecutor.ts` | ⚠️ 已弃用 | 低 | 本地Action执行（fallback），优先使用后端API |
| `actionExecutorService.ts` | ✅ 核心 | 高 | 调用后端API执行Actions，**必须保留** |
| `actionLibrary.ts` | ⚠️ 迁移中 | 中 | 旧版Action定义，迁移到 `shared/action-library.ts` 后可删除 |
| `backendApiService.ts` | ✅ 核心 | 高 | 后端API通信服务，**必须保留** |
| `commandService.ts` | ✅ 核心 | 高 | 指挥中心服务，**必须保留** |
| `contextualReasoning.ts` | ✅ 核心 | 高 | 上下文推理，Todo执行需要，**必须保留** |
| `embeddingService.ts` | ⚠️ 待验证 | 低 | 文本向量化，知识库功能，暂时保留 |
| `gptImageService.ts` | ✅ 核心 | 中 | 前端图像生成接口，**建议保留** |
| `intentClassifier.ts` | ✅ 核心 | 高 | 意图识别（已重构），**必须保留** |
| `knowledgeBase.ts` | ✅ 核心 | 中 | 知识库服务，**建议保留** |
| `modelConfig.ts` | ✅ 核心 | 高 | 模型配置，**必须保留** |
| `settings.ts` | ✅ 核心 | 高 | 应用设置，**必须保留** |
| `simpleTodoGenerator.ts` | ✅ 核心 | 高 | Todo生成，Workflow核心，**必须保留** |
| `todoExecutionService.ts` | ✅ 核心 | 高 | Todo执行，Workflow核心，**必须保留** |

---

## 📖 详细说明

### ✅ 核心服务（必须保留）

#### 1. `backendApiService.ts`
**职责**：统一管理与后端的通信
- 🔹 流式聊天API
- 🔹 非流式聊天API
- 🔹 WebSocket连接管理
- 🔹 健康检查

**依赖关系**：几乎所有需要LLM的功能都依赖它
```typescript
// 使用示例
const response = await backendApiService.getChatCompletion(messages);
```

---

#### 2. `actionExecutorService.ts`
**职责**：前端Action执行的统一入口
- 🔹 调用后端执行Actions
- 🔹 Event Planner状态管理
- 🔹 处理Action执行结果

**后端对应**：`backend/services/action_executor_service.py`

**依赖关系**：Todo执行、Chat页面都需要它
```typescript
// 使用示例
const result = await actionExecutorService.executeAction({
  action_id: 'calculator',
  action_name: '数学计算器',
  action_type: 'code_execution',
  parameters: { expression: '2+2' }
});
```

---

#### 3. `intentClassifier.ts`（已重构）
**职责**：智能意图识别
- 🔹 快速关键词检测（0ms）
- 🔹 LLM精确分类（200ms）
- 🔹 4种意图类型：text_answer, tool_call, workflow, clarify

**工作流程**：
```
用户输入 → 快速检测 → 高置信度？
                ├─ YES → 直接返回结果
                └─ NO  → LLM分类 → 返回结果
```

**依赖关系**：ChatPage用于路由用户请求

---

#### 4. `commandService.ts`
**职责**：管理指挥中心的Workflow指令
- 🔹 预定义指令模板
- 🔹 用户自定义指令
- 🔹 指令的增删改查

**数据存储**：localStorage

**依赖关系**：指挥中心页面、Todo生成系统

---

#### 5. `simpleTodoGenerator.ts`
**职责**：将用户需求转换为Todo List
- 🔹 调用LLM生成步骤
- 🔹 解析Todo结构
- 🔹 判断是否需要多步骤

**依赖关系**：ChatPage的workflow模式必需

---

#### 6. `todoExecutionService.ts`
**职责**：执行Todo List中的每个步骤
- 🔹 逐步执行Action
- 🔹 上下文推理（前后步骤关联）
- 🔹 错误处理和重试

**依赖关系**：Workflow执行的核心

---

#### 7. `contextualReasoning.ts`
**职责**：Todo执行的上下文推理
- 🔹 分析当前步骤需要的信息
- 🔹 从前置步骤提取相关数据
- 🔹 构建增强的提示词

**依赖关系**：todoExecutionService 依赖它

---

#### 8. `modelConfig.ts`
**职责**：管理不同任务的模型配置
- 🔹 意图识别：gpt-4.1-nano（快速、低成本）
- 🔹 Todo生成：gpt-4（强推理）
- 🔹 创意写作：gpt-4（高温度）

**依赖关系**：所有调用LLM的服务都需要它

---

#### 9. `settings.ts`
**职责**：应用设置管理
- 🔹 后端URL配置
- 🔹 是否使用后端API
- 🔹 Ollama设置（遗留，可清理）

**依赖关系**：全局配置，ChatPage需要

---

### ⚠️ 待处理的服务

#### 10. `actionExecutor.ts`（已弃用）
**状态**：📝 已标记为 `@deprecated`

**原职责**：前端本地执行Actions
- 本地计算器
- 本地文本处理
- 本地JSON处理

**现状**：已被后端API取代

**保留原因**：
- todoExecutionService 可能还在使用（作为fallback）
- 等迁移完成后删除

**建议**：✅ 暂时保留，但不要在新代码中使用

---

#### 11. `actionLibrary.ts`（迁移中）
**状态**：📝 已标记为 `@deprecated`

**原职责**：前端Action库定义

**现状**：正在迁移到 `shared/action-library.ts`

**当前用途**：
- ActionsPage展示
- 旧代码兼容

**迁移计划**：
1. 更新所有引用到 `shared/action-library.ts`
2. 删除此文件

**建议**：⏳ 暂时保留，完成迁移后删除

---

### 🔍 可选服务

#### 12. `knowledgeBase.ts`
**职责**：知识库服务（RAG）
- 🔹 文本向量化
- 🔹 相似度搜索
- 🔹 知识库检索

**使用场景**：
- Todo执行时搜索相关知识
- 增强LLM回答的上下文

**状态**：✅ 已实现，功能完整

**建议**：✅ 保留（提升回答质量）

---

#### 13. `embeddingService.ts`
**职责**：文本向量化服务
- 🔹 调用OpenAI Embeddings API
- 🔹 向量缓存管理

**依赖关系**：knowledgeBase.ts 使用它

**状态**：✅ 已实现

**建议**：✅ 保留（知识库功能需要）

---

#### 14. `gptImageService.ts`
**职责**：前端图像生成接口
- 🔹 调用后端图像生成API
- 🔹 处理base64图像数据

**状态**：✅ 已实现

**依赖关系**：ChatPage的图像生成功能

**建议**：✅ 保留（核心功能）

---

## 🔧 需要清理的问题

### ❌ Ollama 遗留代码

以下文件仍在引用已删除的 `ollama.ts`：

1. **`src/modules/actions/ActionsPage.tsx`**
   ```typescript
   import { streamOllamaChat } from '../../services/ollama';  // ❌ 已删除
   ```

2. **`src/services/contextualReasoning.ts`**
   ```typescript
   import { streamOllamaChat } from './ollama';  // ❌ 已删除
   ```

3. **`src/services/settings.ts`**
   - 包含 Ollama 相关配置（遗留）

**建议**：
- ✅ 更新这些文件，移除 ollama 引用
- ✅ 统一使用 `backendApiService`

---

## 📊 清理建议总结

### 立即可以删除
```
✅ archive/fix_ollama.py  （临时脚本，已完成任务）
```

### 需要更新（移除ollama引用）
```
⚠️ src/modules/actions/ActionsPage.tsx
⚠️ src/services/contextualReasoning.ts
⚠️ src/services/settings.ts
```

### 计划迁移后删除
```
⏳ src/services/actionLibrary.ts  （迁移到 shared/ 后删除）
⏳ src/services/actionExecutor.ts  （确认无依赖后删除）
```

### 必须保留（9个核心服务）
```
✅ backendApiService.ts
✅ actionExecutorService.ts
✅ intentClassifier.ts
✅ commandService.ts
✅ simpleTodoGenerator.ts
✅ todoExecutionService.ts
✅ contextualReasoning.ts
✅ modelConfig.ts
✅ settings.ts
```

### 建议保留（3个可选服务）
```
✅ knowledgeBase.ts  （RAG功能）
✅ embeddingService.ts  （向量化）
✅ gptImageService.ts  （图像生成）
```

---

## 🎯 优先级行动清单

### P0（立即执行）
1. ✅ 删除 `archive/fix_ollama.py`
2. ✅ 更新 ActionsPage 移除 ollama 引用
3. ✅ 更新 contextualReasoning 移除 ollama 引用
4. ✅ 清理 settings.ts 的 ollama 配置

### P1（短期）
1. ⏳ 完成 actionLibrary 迁移到 shared/
2. ⏳ 验证 actionExecutor 是否还在使用
3. ⏳ 添加单元测试

### P2（中期）
1. 📝 为每个service添加详细的JSDoc注释
2. 📝 统一错误处理机制
3. 📝 添加日志系统

---

**文档版本**: 1.0  
**最后更新**: 2025-10-17  
**维护者**: Development Team

