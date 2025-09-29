// AI动作执行器 - 让AI选择动作并执行

import { ActionItem, selectBestAction, getActionById } from './actionLibrary';
import { executeAction, ActionExecutionResult } from './actionExecutor';

export interface AIActionResult {
  success: boolean;
  selectedAction?: ActionItem;
  executionResult?: ActionExecutionResult;
  error?: string;
  reasoning?: string;
}

// AI选择并执行动作的主要流程
export async function executeActionWithAI(userInput: string): Promise<AIActionResult> {
  try {
    // 步骤1: AI判断要使用哪个动作
    const selectedAction = selectBestAction(userInput);
    
    if (!selectedAction) {
      return {
        success: false,
        error: '无法找到合适的动作来处理您的请求',
        reasoning: '输入内容不匹配任何可用的动作类型'
      };
    }
    
    // 步骤2: 根据动作类型和用户输入，提取执行参数
    const { extractedInput, params } = extractActionParameters(userInput, selectedAction);
    
    // 步骤3: 执行动作
    const executionResult = executeAction(selectedAction.name, extractedInput, params);
    
    return {
      success: executionResult.success,
      selectedAction,
      executionResult,
      reasoning: `选择了动作"${selectedAction.name}"，因为输入内容匹配${selectedAction.type}类型`
    };
    
  } catch (error) {
    return {
      success: false,
      error: `执行过程出错: ${(error as Error).message}`
    };
  }
}

// 从用户输入中提取动作执行参数
function extractActionParameters(userInput: string, action: ActionItem): { extractedInput: string; params?: any } {
  const input = userInput.toLowerCase();
  
  switch (action.type) {
    case '执行代码':
      if (action.name === '数学计算器') {
        // 提取数学表达式
        const mathExpression = userInput.replace(/计算|等于|=|？|\?|多少/g, '').trim();
        return { extractedInput: mathExpression };
      } else if (action.name === '文本处理工具') {
        // 确定文本处理操作
        let operation = 'analyze';
        if (input.includes('大写')) operation = 'uppercase';
        else if (input.includes('小写')) operation = 'lowercase';
        
        const text = userInput.replace(/(分析|处理|转换|大写|小写|文本|字数|统计)/g, '').trim();
        return { extractedInput: text, params: { operation } };
      } else if (action.name === 'JSON数据处理') {
        // 确定JSON操作
        let operation = 'format';
        if (input.includes('键') || input.includes('key')) operation = 'keys';
        else if (input.includes('计数') || input.includes('数量')) operation = 'count';
        
        return { extractedInput: userInput, params: { operation } };
      } else if (action.name === '日期时间处理') {
        // 确定日期时间操作
        let operation = 'now';
        if (input.includes('解析') || input.includes('parse')) operation = 'parse';
        
        const dateInput = userInput.replace(/(时间|日期|现在|当前|解析|格式化)/g, '').trim();
        return { extractedInput: dateInput, params: { operation } };
      }
      break;
      
    case 'API调用':
      // 对于API调用，需要提取查询参数
      if (action.name === 'Google 搜索竞品信息') {
        const searchQuery = userInput.replace(/(搜索|查找|竞品|信息)/g, '').trim();
        return { extractedInput: searchQuery, params: { search_query: searchQuery } };
      } else if (action.name === 'Google Sheets 数据读取') {
        // 尝试从输入中提取表格ID或范围
        return { extractedInput: userInput, params: { range: 'A1:Z100' } };
      }
      break;
      
    case '提示工程':
      // 对于提示工程，直接使用用户输入作为要处理的内容
      return { extractedInput: userInput };
  }
  
  return { extractedInput: userInput };
}

// 格式化AI动作执行结果
export function formatAIActionResult(result: AIActionResult): string {
  if (!result.success) {
    return `❌ 执行失败: ${result.error}`;
  }
  
  if (!result.selectedAction || !result.executionResult) {
    return '❌ 执行结果异常';
  }
  
  const action = result.selectedAction;
  const execResult = result.executionResult;
  
  let output = `✅ 动作执行完成\n\n`;
  output += `📋 选择的动作: ${action.name}\n`;
  output += `🔧 动作类型: ${action.type}\n`;
  output += `⏱️ 执行耗时: ${execResult.executionTime}ms\n\n`;
  
  // 根据动作类型格式化结果
  if (action.type === '执行代码') {
    if (action.name === '数学计算器') {
      const data = execResult.result;
      output += `📊 计算结果:\n`;
      output += `• 表达式: ${data.expression}\n`;
      output += `• 结果: ${data.answer}\n`;
    } else if (action.name === '文本处理工具') {
      const data = execResult.result;
      if (data.analysis) {
        output += `📝 文本分析结果:\n${data.analysis}`;
      } else if (data.processed) {
        output += `📝 处理结果:\n${data.processed}`;
      } else {
        output += `📝 统计结果:\n`;
        output += `• 字数: ${data.wordCount}\n`;
        output += `• 字符数: ${data.characterCount}`;
      }
    } else if (action.name === 'JSON数据处理') {
      const data = execResult.result;
      if (data.formatted) {
        output += `🔧 格式化结果:\n\`\`\`json\n${data.formatted}\n\`\`\``;
      } else if (data.keys) {
        output += `🔑 JSON键: ${data.keys.join(', ')}`;
      }
    } else if (action.name === '日期时间处理') {
      const data = execResult.result;
      if (data.current_time) {
        output += `🕐 当前时间: ${data.current_time}`;
      } else if (data.formatted) {
        output += `📅 格式化时间:\n`;
        Object.entries(data.formatted).forEach(([format, value]) => {
          output += `• ${format}: ${value}\n`;
        });
      }
    }
  } else if (action.type === 'API调用') {
    output += `🌐 API调用结果:\n`;
    output += `• 接口: ${action.apiConfig?.endpoint}\n`;
    output += `• 方法: ${action.apiConfig?.method}\n`;
    output += `• 状态: 模拟成功`;
  } else if (action.type === '提示工程') {
    output += `🤖 提示工程结果:\n`;
    output += `• 分析完成，结果已生成`;
  }
  
  return output;
}
