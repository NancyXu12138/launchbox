/**
 * 智能意图分类器 - 重构版本
 * 
 * 设计原则：
 * 1. 简化意图分类，只保留4种核心类型
 * 2. 双层识别机制：快速关键词检测 + LLM精确分类
 * 3. 高置信度结果直接使用，避免不必要的LLM调用
 * 
 * 架构图：
 * ┌─────────────────┐
 * │  用户输入        │
 * └────────┬────────┘
 *          │
 *          ▼
 * ┌─────────────────────┐
 * │ 快速关键词检测       │ (0ms, 零成本)
 * │ confidence >= 0.8?  │
 * └─────┬─────────┬─────┘
 *      YES       NO
 *       │         │
 *       │         ▼
 *       │  ┌──────────────┐
 *       │  │ LLM精确分类  │ (200ms, 低成本)
 *       │  │ gpt-4.1-nano│
 *       │  └──────┬───────┘
 *       │         │
 *       ▼         ▼
 * ┌──────────────────┐
 * │   返回意图结果    │
 * └──────────────────┘
 */

import { backendApiService } from './backendApiService';
import { selectModelForTask } from './modelConfig';

/**
 * 统一的意图类型（简化为4种）
 * 
 * - text_answer: 直接文本回答（包含简单对话、翻译、代码解释等）
 * - tool_call: 单工具调用（需要调用特定工具完成任务）
 * - workflow: 多步骤工作流（复杂任务需要多个步骤）
 * - clarify: 信息补齐（需要用户提供更多信息）
 */
export type IntentType = 
  | 'text_answer'      // 直接文本回答
  | 'tool_call'        // 单工具调用
  | 'workflow'         // 多步骤工作流
  | 'clarify';         // 信息补齐

/**
 * 意图识别结果
 */
export interface IntentResult {
  intent: IntentType;           // 意图类型
  confidence: number;           // 置信度 (0-1)
  
  // 如果是 tool_call，指定工具ID
  toolId?: string;              // 例如：'calculator', 'image_gen'
  
  // 如果是 clarify，指定缺失的字段
  missingFields?: string[];     
  
  // LLM 的推理过程
  reasoning?: string;
  
  // 是否需要调用LLM处理（tool_call类型的某些工具不需要LLM）
  shouldUseLLM: boolean;
}

/**
 * 使用小模型快速分类用户意图
 * 
 * @param userMessage 用户输入的消息
 * @param conversationHistory 对话历史（可选，用于上下文理解）
 * @returns 意图识别结果
 */
export async function classifyIntent(
  userMessage: string,
  conversationHistory: string[] = []
): Promise<IntentResult> {
  
  const modelConfig = selectModelForTask('intent_classification');
  
  const systemPrompt = `你是一个意图分类助手。快速准确地分析用户的输入，判断需要采取什么行动。

## 意图类型说明：

### 1. text_answer（直接文本回答）
适用场景：
- 一般对话、闲聊
- 解释概念、回答问题
- 翻译（中译英、英译中）
- 代码解释
- 简单建议

### 2. tool_call（单工具调用）
适用场景：
- 数学计算：计算 2+2、求平方根等
- 文本处理：统计字数、转换大小写
- JSON处理：格式化JSON、提取键名
- 日期时间：查询当前时间、解析日期
- 图像生成：生成图片、画图、UI设计
- 活动策划：Event Planner（需要填写表单）

可用工具ID：
- calculator（数学计算器）
- text_processor（文本处理）
- json_processor（JSON处理）
- datetime_processor（日期时间）
- gpt_image_gen（图像生成）
- event_planning（活动策划）
- sentiment_analysis（情感分析）
- game_classification（游戏分类）

### 3. workflow（多步骤工作流）
适用场景：
- 竞品分析报告（需要搜索→分析→生成报告）
- 市场调研（需要多个步骤）
- 数据同步流程
- 复杂的多步骤任务

### 4. clarify（信息补齐）
适用场景：
- 用户需求不明确
- 缺少必要参数
- 需要用户选择或确认

## 返回格式：
请以JSON格式返回（只返回JSON，不要其他文字）：
{
  "intent": "text_answer|tool_call|workflow|clarify",
  "toolId": "如果是tool_call，指定工具ID（如calculator）",
  "confidence": 0.95,
  "reasoning": "简短的判断理由"
}

## 示例：
用户："计算 2+2"
返回：{"intent": "tool_call", "toolId": "calculator", "confidence": 0.95, "reasoning": "明确的数学计算需求"}

用户："帮我分析竞品"
返回：{"intent": "workflow", "confidence": 0.9, "reasoning": "竞品分析需要多个步骤"}

用户："你好"
返回：{"intent": "text_answer", "confidence": 0.95, "reasoning": "一般对话"}`;

  try {
    const response = await backendApiService.getChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], modelConfig.temperature, modelConfig.max_tokens);

    if (response.success && response.content) {
      // 提取JSON
      const jsonMatch = response.content.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          const intent = result.intent || 'text_answer';
          const toolId = result.toolId;
          
          return {
            intent: intent as IntentType,
            toolId,
            confidence: result.confidence || 0.5,
            reasoning: result.reasoning,
            // 工具调用中，某些工具不需要额外的LLM处理（如计算器、时间查询）
            shouldUseLLM: intent === 'text_answer' || intent === 'workflow' ||
                         (intent === 'tool_call' && ['sentiment_analysis', 'game_classification'].includes(toolId))
          };
        } catch (parseError) {
          console.error('❌ JSON解析失败:', parseError);
        }
      }
    }
  } catch (error) {
    console.error('❌ 意图分类失败:', error);
  }

  // 降级到关键词匹配
  console.log('🔄 降级到关键词匹配');
  return fallbackIntentDetection(userMessage);
}

/**
 * 降级方案：基于关键词的意图检测
 * 当 LLM 调用失败时使用，通过关键词匹配快速判断意图
 * 
 * @param message 用户消息
 * @returns 意图识别结果
 */
function fallbackIntentDetection(message: string): IntentResult {
  const lowerMsg = message.toLowerCase();
  
  // ==========================================
  // 1. tool_call 检测
  // ==========================================
  
  // 数学计算检测
  if (/[0-9+\-*/()=]/.test(message) && 
      (lowerMsg.includes('计算') || lowerMsg.includes('等于') || 
       lowerMsg.includes('是多少') || lowerMsg.includes('求'))) {
    return { 
      intent: 'tool_call',
      toolId: 'calculator',
      confidence: 0.9,
      shouldUseLLM: false,
      reasoning: '关键词匹配：数学计算'
    };
  }
  
  // 图像生成检测
  if (lowerMsg.includes('生成图') || lowerMsg.includes('画图') || 
      lowerMsg.includes('生图') || lowerMsg.includes('画一个') ||
      lowerMsg.includes('mockup') || lowerMsg.includes('ui设计') ||
      lowerMsg.includes('原型图')) {
    return { 
      intent: 'tool_call',
      toolId: 'gpt_image_gen',
      confidence: 0.85,
      shouldUseLLM: false,
      reasoning: '关键词匹配：图像生成'
    };
  }
  
  // 活动策划检测（排除竞品分析场景）
  if ((lowerMsg.includes('活动') && lowerMsg.includes('策划')) || 
      (lowerMsg.includes('活动') && lowerMsg.includes('方案')) ||
      lowerMsg.includes('运营活动')) {
    // 如果包含竞品关键词，则归类为 workflow
    if (lowerMsg.includes('竞品') || lowerMsg.includes('对手') || lowerMsg.includes('竞争')) {
      return { 
        intent: 'workflow', 
        confidence: 0.75,
        shouldUseLLM: true,
        reasoning: '竞品分析任务，需要工作流'
      };
    }
    return { 
      intent: 'tool_call',
      toolId: 'event_planning',
      confidence: 0.85,
      shouldUseLLM: false,
      reasoning: '关键词匹配：活动策划'
    };
  }
  
  // 文本处理检测
  if (lowerMsg.includes('字数') || lowerMsg.includes('统计文本') || 
      lowerMsg.includes('大写') || lowerMsg.includes('小写')) {
    return { 
      intent: 'tool_call',
      toolId: 'text_processor',
      confidence: 0.8,
      shouldUseLLM: false,
      reasoning: '关键词匹配：文本处理'
    };
  }
  
  // JSON处理检测
  if (lowerMsg.includes('json') || message.includes('{') || 
      lowerMsg.includes('格式化数据')) {
    return { 
      intent: 'tool_call',
      toolId: 'json_processor',
      confidence: 0.8,
      shouldUseLLM: false,
      reasoning: '关键词匹配：JSON处理'
    };
  }
  
  // 日期时间检测
  if (lowerMsg.includes('现在几点') || lowerMsg.includes('当前时间') || 
      lowerMsg.includes('今天日期') || lowerMsg.includes('时间戳')) {
    return { 
      intent: 'tool_call',
      toolId: 'datetime_processor',
      confidence: 0.9,
      shouldUseLLM: false,
      reasoning: '关键词匹配：日期时间'
    };
  }
  
  // 情感分析检测
  if (lowerMsg.includes('情感分析') || lowerMsg.includes('分析评论') ||
      (lowerMsg.includes('分析') && lowerMsg.includes('评价'))) {
    return { 
      intent: 'tool_call',
      toolId: 'sentiment_analysis',
      confidence: 0.8,
      shouldUseLLM: true,  // 需要LLM处理
      reasoning: '关键词匹配：情感分析'
    };
  }
  
  // ==========================================
  // 2. workflow 检测（多步骤任务）
  // ==========================================
  
  // 竞品分析、市场调研等专业任务
  if (lowerMsg.includes('竞品分析') || lowerMsg.includes('竞争对手') || 
      lowerMsg.includes('市场调研') || lowerMsg.includes('数据同步')) {
    return { 
      intent: 'workflow', 
      confidence: 0.85,
      shouldUseLLM: true,
      reasoning: '专业分析任务，需要工作流'
    };
  }
  
  // 复杂的多步骤请求
  if ((lowerMsg.includes('帮我') || lowerMsg.includes('请')) &&
      (lowerMsg.includes('分析') || lowerMsg.includes('制定') || 
       lowerMsg.includes('创建') || lowerMsg.includes('计划')) &&
      message.length > 30) {
    return { 
      intent: 'workflow', 
      confidence: 0.7,
      shouldUseLLM: true,
      reasoning: '复杂任务，可能需要多步骤'
    };
  }
  
  // ==========================================
  // 3. text_answer 检测（默认）
  // ==========================================
  
  // 翻译请求（使用LLM直接处理）
  if (lowerMsg.includes('翻译') || lowerMsg.includes('translate') ||
      lowerMsg.includes('中译英') || lowerMsg.includes('英译中')) {
    return { 
      intent: 'text_answer',
      confidence: 0.9,
      shouldUseLLM: true,
      reasoning: '翻译请求，使用LLM直接处理'
    };
  }
  
  // 代码解释（使用LLM直接处理）
  if ((lowerMsg.includes('代码') || lowerMsg.includes('code')) &&
      (lowerMsg.includes('解释') || lowerMsg.includes('explain'))) {
    return { 
      intent: 'text_answer',
      confidence: 0.85,
      shouldUseLLM: true,
      reasoning: '代码解释，使用LLM直接处理'
    };
  }
  
  // 默认：一般对话
  return { 
    intent: 'text_answer', 
    confidence: 0.9,
    shouldUseLLM: true,
    reasoning: '一般对话或问答'
  };
}

/**
 * 快速判断是否需要工具（不调用LLM）
 */
export function quickIntentCheck(message: string): IntentResult {
  return fallbackIntentDetection(message);
}

export default {
  classifyIntent,
  quickIntentCheck
};

