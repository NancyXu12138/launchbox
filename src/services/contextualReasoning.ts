import { SimpleTodoItem, SimpleTodoList } from '../components/BottomTodoPanel';
import { TodoStepResult } from './todoExecutionService';
import { streamOllamaChat, OllamaChatMessage } from './ollama';

// 上下文信息类型
export interface ContextualInfo {
  previousResultsCount: number; // 改为数量而不是完整对象，避免循环引用
  currentStep: SimpleTodoItem;
  relevantData: string[];
  missingInfo: string[];
  reasoning: string;
  enhancedPrompt: string;
}

// 推理结果类型
export interface ReasoningResult {
  shouldProceed: boolean;
  contextualInfo: ContextualInfo;
  waitingForData?: string;
  reasoning: string;
}

/**
 * 在执行LLM任务前进行上下文推理
 * 分析前面步骤的结果，识别需要传递给LLM的信息
 */
export async function performContextualReasoning(
  currentStep: SimpleTodoItem,
  previousResults: TodoStepResult[],
  todoList: SimpleTodoList
): Promise<ReasoningResult> {
  
  try {
    console.log('🔍 推理步骤1: 收集前面步骤数据...');
    // 1. 收集前面步骤的执行结果
    const collectedData = collectPreviousStepData(previousResults);
    console.log('✅ 收集到数据:', collectedData.length, '个步骤结果');
    
    console.log('🔍 推理步骤2: 分析信息需求...');
    // 2. 分析当前任务需要什么信息 - 先简化，不调用LLM
    const requiredInfo: string[] = []; // 暂时跳过LLM分析
    console.log('✅ 分析完成，需求信息数量:', requiredInfo.length);
    
    console.log('🔍 推理步骤3: 识别缺失信息...');
    // 3. 识别缺失的信息
    const missingInfo = identifyMissingInformation(requiredInfo, collectedData);
    console.log('✅ 缺失信息:', missingInfo);
    
    console.log('🔍 推理步骤4: 生成推理分析...');
    // 4. 生成推理分析 - 简化，不调用LLM
    const reasoning = `简化推理：当前任务"${currentStep.text}"，已有${collectedData.length}个前置结果，可以直接执行。`;
    console.log('✅ 推理完成:', reasoning);
    
    console.log('🔍 推理步骤5: 构建增强提示词...');
    // 5. 构建增强的提示词
    const enhancedPrompt = buildEnhancedPrompt(currentStep, collectedData, reasoning);
    console.log('✅ 提示词构建完成，长度:', enhancedPrompt.length);
    
    const contextualInfo: ContextualInfo = {
      previousResultsCount: previousResults.length,
      currentStep,
      relevantData: collectedData.map(d => d.summary),
      missingInfo,
      reasoning,
      enhancedPrompt
    };
    
    console.log('🔍 推理步骤6: 决定是否继续执行...');
    // 6. 决定是否应该继续执行 - 简化判断
    const shouldProceed = true; // 暂时总是继续
    console.log('✅ 决定结果: shouldProceed =', shouldProceed);
    
    return {
      shouldProceed,
      contextualInfo,
      waitingForData: missingInfo.length > 0 ? missingInfo.join(', ') : undefined,
      reasoning
    };
    
  } catch (error) {
    console.error('上下文推理失败:', error);
    
    // 如果推理失败，使用基础的上下文信息
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
          summary = `LLM分析结果：${execResult.result.response?.substring(0, 200)}...`;
          dataType = 'llm_analysis';
        } else if (execResult.result.response) {
          summary = `执行结果：${execResult.result.response?.substring(0, 200)}...`;
          dataType = 'action_result';
        } else if (execResult.result.data) {
          summary = `数据结果：${JSON.stringify(execResult.result.data).substring(0, 200)}...`;
          dataType = 'structured_data';
        } else {
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
 * 分析当前任务需要什么信息
 */
async function analyzeRequiredInformation(
  currentStep: SimpleTodoItem,
  todoList: SimpleTodoList
): Promise<string[]> {
  
  try {
    const prompt = `
分析以下任务需要什么信息才能正确执行：

当前任务：${currentStep.text}

完整任务列表上下文：
${todoList.items.map((item, index) => 
  `${index + 1}. ${item.text} ${item.id === currentStep.id ? '← 当前任务' : ''}`
).join('\n')}

请分析当前任务可能需要以下类型的信息：
1. 前面步骤的执行结果
2. 用户输入的数据
3. 计算结果或分析数据
4. 文件内容或数据源
5. 配置信息或参数

请列出具体需要的信息类型，每行一个，格式：
- 信息类型：具体描述

只列出明确需要的信息，不要猜测。
`;

    const messages: OllamaChatMessage[] = [
      { role: 'user', content: prompt }
    ];

    let response = '';
    const stream = streamOllamaChat(messages);
    for await (const chunk of stream) {
      response += chunk;
    }

    // 解析返回的信息需求
    const lines = response.split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0);

    return lines;
    
  } catch (error) {
    console.error('分析信息需求失败:', error);
    return [];
  }
}

/**
 * 识别缺失的信息
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
 * 生成推理分析
 */
async function generateReasoning(
  currentStep: SimpleTodoItem,
  collectedData: Array<{ stepText: string; summary: string; dataType: string }>,
  requiredInfo: string[],
  missingInfo: string[]
): Promise<string> {
  
  try {
    const prompt = `
请分析以下任务执行情况并生成推理：

当前任务：${currentStep.text}

已有的执行结果：
${collectedData.map((data, index) => 
  `${index + 1}. ${data.stepText}\n   结果：${data.summary}`
).join('\n\n')}

任务需要的信息：
${requiredInfo.map(info => `- ${info}`).join('\n')}

缺失的信息：
${missingInfo.map(info => `- ${info}`).join('\n')}

请分析：
1. 当前任务是否有足够的信息来执行
2. 已有的执行结果中哪些与当前任务相关
3. 如何最好地利用现有信息
4. 是否需要等待更多信息

请提供简洁的推理分析（100-200字）：
`;

    const messages: OllamaChatMessage[] = [
      { role: 'user', content: prompt }
    ];

    let response = '';
    const stream = streamOllamaChat(messages);
    for await (const chunk of stream) {
      response += chunk;
    }

    return response.trim();
    
  } catch (error) {
    console.error('生成推理失败:', error);
    return `推理分析：当前任务"${currentStep.text}"准备执行。已收集${collectedData.length}个前置步骤的结果。${missingInfo.length > 0 ? `缺失信息：${missingInfo.join(', ')}` : '信息充足，可以执行。'}`;
  }
}

/**
 * 构建增强的提示词
 */
function buildEnhancedPrompt(
  currentStep: SimpleTodoItem,
  collectedData: Array<{ stepText: string; result: any; summary: string }>,
  reasoning: string
): string {
  
  let prompt = `请完成以下任务：${currentStep.text}\n\n`;
  
  if (collectedData.length > 0) {
    prompt += `前置步骤的执行结果：\n`;
    collectedData.forEach((data, index) => {
      prompt += `${index + 1}. ${data.stepText}\n`;
      prompt += `   执行结果：${data.summary}\n`;
      
      // 如果有详细的结果数据，也包含进来
      if (data.result && data.result.response) {
        prompt += `   详细内容：${data.result.response.substring(0, 500)}...\n`;
      }
      prompt += `\n`;
    });
  }
  
  prompt += `执行分析：${reasoning}\n\n`;
  
  prompt += `要求：
- 充分利用上述前置步骤的执行结果
- 确保任务执行的连贯性和逻辑性
- 提供详细和有用的回答
- 如果前置结果中有相关数据，请明确引用和使用
- 保持回答的专业性和准确性`;

  return prompt;
}

/**
 * 判断是否可以在缺失信息的情况下继续执行
 */
async function canProceedWithoutMissingInfo(
  missingInfo: string[],
  reasoning: string
): Promise<boolean> {
  
  // 如果缺失的信息都是可选的或可以推断的，则可以继续
  const optionalKeywords = ['可选', '建议', '最好', '推荐', '如果有'];
  const criticalKeywords = ['必须', '需要', '要求', '依赖'];
  
  const hasCriticalMissing = missingInfo.some(info => 
    criticalKeywords.some(keyword => info.includes(keyword))
  );
  
  const hasOptionalMissing = missingInfo.some(info => 
    optionalKeywords.some(keyword => info.includes(keyword))
  );
  
  // 如果只是缺失可选信息，可以继续
  if (hasOptionalMissing && !hasCriticalMissing) {
    return true;
  }
  
  // 如果推理中提到可以继续，也可以执行
  if (reasoning.includes('可以执行') || reasoning.includes('足够') || reasoning.includes('继续')) {
    return true;
  }
  
  return missingInfo.length <= 1; // 如果只缺失一个信息项，也可以尝试执行
}
