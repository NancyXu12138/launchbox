/**
 * 上下文推理服务 (Contextual Reasoning Service)
 * 
 * 📋 功能说明：
 * 在执行多步骤工作流（Todo List）时，智能分析前后步骤的关系。
 * 帮助LLM理解当前步骤需要用到哪些前置步骤的结果。
 * 
 * 🎯 核心能力：
 * 1. 📊 收集前置步骤的执行结果
 * 2. 🔍 分析当前步骤需要的信息
 * 3. ⚠️ 识别缺失的关键信息
 * 4. 🧠 生成上下文推理分析
 * 5. ✨ 构建增强的提示词
 * 
 * 💡 使用场景：
 * 
 * 假设用户要执行以下工作流：
 * ```
 * 步骤1: 搜索竞品游戏 → 找到3个游戏
 * 步骤2: 分析竞品特点 → 需要用到步骤1的结果
 * 步骤3: 生成对比报告 → 需要用到步骤1和2的结果
 * ```
 * 
 * 当执行步骤2时，contextualReasoning会：
 * - 收集步骤1的结果："找到3个游戏：A、B、C"
 * - 分析步骤2需要这些信息
 * - 构建增强提示词：
 *   ```
 *   请分析竞品特点。
 *   
 *   前置步骤结果：
 *   1. 搜索竞品游戏
 *      执行结果：找到3个游戏：A、B、C
 *   
 *   请基于以上信息完成分析。
 *   ```
 * 
 * 🔧 技术实现：
 * - 简化版推理：不调用额外LLM，基于规则快速推理
 * - 数据收集：从前置步骤提取关键结果
 * - 提示词增强：自动整合上下文信息
 * 
 * @module contextualReasoning
 */

import { SimpleTodoItem, SimpleTodoList } from '../components/BottomTodoPanel';
import { TodoStepResult } from './todoExecutionService';

/**
 * 上下文信息类型
 * 
 * 包含执行推理后生成的所有上下文数据
 */
export interface ContextualInfo {
  /** 前置步骤的数量 */
  previousResultsCount: number;
  
  /** 当前要执行的步骤 */
  currentStep: SimpleTodoItem;
  
  /** 从前置步骤提取的相关数据 */
  relevantData: string[];
  
  /** 识别出的缺失信息 */
  missingInfo: string[];
  
  /** 推理分析说明 */
  reasoning: string;
  
  /** 增强后的提示词（包含上下文） */
  enhancedPrompt: string;
}

/**
 * 推理结果类型
 * 
 * 包含是否应该继续执行的判断和上下文信息
 */
export interface ReasoningResult {
  /** 是否应该继续执行当前步骤 */
  shouldProceed: boolean;
  
  /** 详细的上下文信息 */
  contextualInfo: ContextualInfo;
  
  /** 如果需要等待数据，说明等待什么 */
  waitingForData?: string;
  
  /** 推理过程的说明 */
  reasoning: string;
}

/**
 * 执行上下文推理（主函数）
 * 
 * 在执行LLM任务前，分析前面步骤的结果，识别需要传递给LLM的信息。
 * 
 * 工作流程：
 * 1. 收集前面步骤的执行结果
 * 2. 分析当前任务需要什么信息（简化版，基于规则）
 * 3. 识别缺失的信息
 * 4. 生成推理分析
 * 5. 构建增强的提示词
 * 6. 决定是否应该继续执行
 * 
 * @param currentStep - 当前要执行的步骤
 * @param previousResults - 前面所有步骤的执行结果
 * @param todoList - 完整的Todo List（用于上下文理解）
 * @returns Promise<ReasoningResult> - 推理结果
 * 
 * @example
 * ```typescript
 * const result = await performContextualReasoning(
 *   currentStep,
 *   previousResults,
 *   todoList
 * );
 * 
 * if (result.shouldProceed) {
 *   // 使用增强的提示词执行LLM任务
 *   const response = await callLLM(result.contextualInfo.enhancedPrompt);
 * } else {
 *   // 等待更多信息
 *   console.log('等待数据:', result.waitingForData);
 * }
 * ```
 */
export async function performContextualReasoning(
  currentStep: SimpleTodoItem,
  previousResults: TodoStepResult[],
  todoList: SimpleTodoList,
  userOriginalInput?: string
): Promise<ReasoningResult> {
  
  try {
    console.log('🔍 推理步骤1: 收集前面步骤数据...');
    // 1. 收集前面步骤的执行结果
    const collectedData = collectPreviousStepData(previousResults);
    console.log('✅ 收集到数据:', collectedData.length, '个步骤结果');
    
    console.log('🔍 推理步骤2: 分析信息需求...');
    // 2. 分析当前任务需要什么信息 - 简化版，不调用额外LLM
    const requiredInfo: string[] = []; // 暂时跳过复杂分析
    console.log('✅ 分析完成，需求信息数量:', requiredInfo.length);
    
    console.log('🔍 推理步骤3: 识别缺失信息...');
    // 3. 识别缺失的信息
    const missingInfo = identifyMissingInformation(requiredInfo, collectedData);
    console.log('✅ 缺失信息:', missingInfo);
    
    console.log('🔍 推理步骤4: 生成推理分析...');
    // 4. 生成推理分析 - 简化版，基于规则
    const reasoning = `简化推理：当前任务"${currentStep.text}"，已有${collectedData.length}个前置结果，可以直接执行。`;
    console.log('✅ 推理完成:', reasoning);
    
    console.log('🔍 推理步骤5: 构建增强提示词...');
    // 5. 构建增强的提示词（核心功能）
    const enhancedPrompt = buildEnhancedPrompt(currentStep, collectedData, reasoning, userOriginalInput);
    console.log('✅ 提示词构建完成，长度:', enhancedPrompt.length);
    
    // 构建上下文信息对象
    const contextualInfo: ContextualInfo = {
      previousResultsCount: previousResults.length,
      currentStep,
      relevantData: collectedData.map(d => d.summary),
      missingInfo,
      reasoning,
      enhancedPrompt
    };
    
    console.log('🔍 推理步骤6: 决定是否继续执行...');
    // 6. 决定是否应该继续执行 - 简化版，总是继续
    const shouldProceed = true;
    console.log('✅ 决定结果: shouldProceed =', shouldProceed);
    
    return {
      shouldProceed,
      contextualInfo,
      waitingForData: missingInfo.length > 0 ? missingInfo.join(', ') : undefined,
      reasoning
    };
    
  } catch (error) {
    console.error('❌ 上下文推理失败:', error);
    
    // 如果推理失败，使用基础的上下文信息（降级方案）
    return {
      shouldProceed: true,
      contextualInfo: {
        previousResultsCount: previousResults.length,
        currentStep,
        relevantData: [],
        missingInfo: [],
        reasoning: '推理过程出错，使用基础执行模式',
        enhancedPrompt: `请完成以下任务：${currentStep.text}`
      },
      reasoning: '推理过程出错，将直接执行任务'
    };
  }
}

/**
 * 收集前面步骤的执行数据
 * 
 * 从前置步骤的执行结果中提取关键信息，生成摘要。
 * 
 * @param previousResults - 前置步骤的执行结果数组
 * @returns 结构化的数据摘要数组
 */
function collectPreviousStepData(previousResults: TodoStepResult[]): Array<{
  stepText: string;
  result: any;
  summary: string;
  dataType: string;
}> {
  return previousResults
    .filter(result => result.success && result.executionResult)
    .map(result => {
      const execResult = result.executionResult;
      let summary = '';
      let dataType = 'unknown';
      
      if (execResult?.result) {
        // 根据执行结果类型生成摘要
        if (execResult.result.isLLMTask) {
          // LLM任务结果
          summary = `LLM分析结果：${execResult.result.response?.substring(0, 200)}...`;
          dataType = 'llm_analysis';
        } else if (execResult.result.response) {
          // Action执行结果
          summary = `执行结果：${execResult.result.response?.substring(0, 200)}...`;
          dataType = 'action_result';
        } else if (execResult.result.data) {
          // 结构化数据结果
          summary = `数据结果：${JSON.stringify(execResult.result.data).substring(0, 200)}...`;
          dataType = 'structured_data';
        } else {
          // 其他类型
          summary = `任务完成：${result.stepText}`;
          dataType = 'completion';
        }
      } else {
        summary = `任务完成：${result.stepText}`;
        dataType = 'completion';
      }
      
      return {
        stepText: result.stepText,
        result: execResult?.result,
        summary,
        dataType
      };
    });
}

/**
 * 识别缺失的信息
 * 
 * 对比需求信息和已有数据，找出缺失的部分。
 * 
 * @param requiredInfo - 需要的信息列表
 * @param availableData - 已有的数据
 * @returns 缺失的信息列表
 */
function identifyMissingInformation(
  requiredInfo: string[],
  availableData: Array<{ summary: string; dataType: string }>
): string[] {
  
  if (requiredInfo.length === 0) {
    return [];
  }
  
  // 简单的匹配逻辑，检查是否有对应的数据类型
  const missing: string[] = [];
  
  for (const requirement of requiredInfo) {
    const hasMatchingData = availableData.some(data => {
      // 检查是否有匹配的数据类型或内容
      return data.summary.toLowerCase().includes(requirement.toLowerCase().split('：')[0]) ||
             data.dataType === getDataTypeFromRequirement(requirement);
    });
    
    if (!hasMatchingData) {
      missing.push(requirement);
    }
  }
  
  return missing;
}

/**
 * 从需求描述中推断数据类型
 * 
 * 基于关键词匹配推断数据类型。
 * 
 * @param requirement - 需求描述
 * @returns 推断的数据类型
 */
function getDataTypeFromRequirement(requirement: string): string {
  const req = requirement.toLowerCase();
  
  if (req.includes('分析') || req.includes('结果')) return 'llm_analysis';
  if (req.includes('计算') || req.includes('数据')) return 'structured_data';
  if (req.includes('执行') || req.includes('操作')) return 'action_result';
  if (req.includes('输入') || req.includes('用户')) return 'user_input';
  
  return 'unknown';
}

/**
 * 构建增强的提示词（核心功能）
 * 
 * 将当前任务、前置步骤结果、推理分析整合成一个完整的提示词。
 * 这个提示词会传递给LLM，帮助它更好地理解上下文。
 * 
 * 生成的提示词格式：
 * ```
 * 请完成以下任务：[当前任务]
 * 
 * 前置步骤的执行结果：
 * 1. [步骤1]
 *    执行结果：[结果摘要]
 *    详细内容：[完整结果]
 * 
 * 2. [步骤2]
 *    执行结果：[结果摘要]
 *    详细内容：[完整结果]
 * 
 * 执行分析：[推理说明]
 * 
 * 要求：
 * - 充分利用上述前置步骤的执行结果
 * - 确保任务执行的连贯性和逻辑性
 * - ...
 * ```
 * 
 * @param currentStep - 当前步骤
 * @param collectedData - 收集的前置数据
 * @param reasoning - 推理分析
 * @returns 增强后的提示词
 */
function buildEnhancedPrompt(
  currentStep: SimpleTodoItem,
  collectedData: Array<{ stepText: string; result: any; summary: string }>,
  reasoning: string,
  userOriginalInput?: string
): string {
  
  let prompt = `你是一个智能助手，正在执行多步骤任务的其中一步。\n\n`;
  
  if (userOriginalInput) {
    prompt += `【用户的原始请求】\n${userOriginalInput}\n\n`;
  }
  
  prompt += `【当前任务】\n${currentStep.text}\n\n`;
  
  // 如果有前置步骤的结果，添加到提示词中
  if (collectedData.length > 0) {
    prompt += `【前置步骤的执行结果】\n`;
    collectedData.forEach((data, index) => {
      prompt += `步骤${index + 1}: ${data.stepText}\n`;
      
      if (data.result) {
        if (typeof data.result === 'object') {
          if ('result' in data.result) {
            prompt += `结果: ${data.result.result}\n`;
          } else if ('response' in data.result) {
            prompt += `结果: ${data.result.response}\n`;
          } else if ('answer' in data.result) {
            prompt += `结果: ${data.result.answer}\n`;
          } else if ('data' in data.result) {
            prompt += `结果: ${JSON.stringify(data.result.data)}\n`;
          } else {
            prompt += `结果: ${data.summary}\n`;
          }
        } else {
          prompt += `结果: ${data.result}\n`;
        }
      }
      prompt += `\n`;
    });
  }
  
  prompt += `【重要提示】
1. 如果前置步骤提供了数据，请务必使用这些真实数据
2. 如果用户原始请求包含了所需信息，请从中提取
3. 不要编造或假设数据，只使用已提供的真实信息
4. 如果是生成报告/总结，请基于前置步骤的真实结果
5. 【格式要求】使用纯文本和自然语言回答，不要使用LaTeX格式（如\\times、\\frac、\\approx等）
6. 【格式要求】数学符号使用：乘号用×或*，除号用÷或/，约等于用≈，分数直接写如"1232÷890"
7. 【格式要求】如果提取数学表达式，保持原样，不要修改运算符\n\n`;
  
  prompt += `请完成当前任务：`;

  return prompt;
}
