/**
 * 参数提取服务
 * 
 * 职责：从用户的自然语言输入中，提取工具调用所需的结构化参数
 * 
 * 工作流程：
 * 1. 用户输入自然语言："帮我计算8*8*9*123+567-1232/890 的结果"
 * 2. 意图识别：tool_call + calculator
 * 3. 参数提取：从自然语言中提取 {"expression": "8*8*9*123+567-1232/890"}
 * 4. 工具调用：执行calculator(expression)
 * 5. 返回结果
 */

import { backendApiService } from './backendApiService';
import { ACTION_LIBRARY } from '../../shared/action-library';

/**
 * 从自然语言中提取工具参数
 * 
 * @param toolId 工具ID (如 'calculator', 'text_processor')
 * @param userInput 用户的自然语言输入
 * @returns 结构化的参数对象
 */
export async function extractParameters(
  toolId: string,
  userInput: string
): Promise<Record<string, any>> {
  
  // 查找工具定义
  const action = ACTION_LIBRARY.find(a => a.id === toolId);
  if (!action) {
    console.error(`工具 ${toolId} 不存在`);
    return {};
  }

  // 构建LLM提示词
  const systemPrompt = `你是一个参数提取专家。你的任务是从用户的自然语言输入中，提取特定工具所需的参数。

工具信息：
- 工具ID: ${action.id}
- 工具名称: ${action.name}
- 工具描述: ${action.description}

参数定义：
${action.parameters.map(p => `- ${p.name} (${p.type}): ${p.description}${p.required ? ' [必需]' : ' [可选]'}`).join('\n')}

要求：
1. 仔细分析用户输入，提取所有需要的参数
2. 对于calculator：只提取纯数学表达式（数字和运算符）
3. 对于text_processor：提取要处理的文本内容
4. 返回JSON格式的参数对象
5. 如果无法提取某个必需参数，返回null

返回格式：
\`\`\`json
{
  "parameter1": "value1",
  "parameter2": "value2"
}
\`\`\``;

  const userPrompt = `用户输入：${userInput}

请提取参数，只返回JSON，不要其他说明文字。`;

  try {
    // 调用LLM提取参数
    const response = await backendApiService.getChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 0.3, 500);
    
    // 修复：response是对象，需要提取content
    const responseText = typeof response === 'string' ? response : 
                        response.content || JSON.stringify(response);
    
    // 解析JSON
    let jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      jsonMatch = responseText.match(/```\s*([\s\S]*?)\s*```/);
    }
    
    const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
    const parameters = JSON.parse(jsonStr.trim());
    
    return parameters;
    
  } catch (error) {
    console.error('参数提取失败:', error);
    
    // 降级方案：使用正则提取（仅适用于简单情况）
    return fallbackExtraction(toolId, userInput);
  }
}

/**
 * 降级方案：使用正则表达式提取参数
 */
function fallbackExtraction(toolId: string, userInput: string): Record<string, any> {
  
  switch (toolId) {
    case 'calculator': {
      // 提取数学表达式
      const matches = userInput.match(/[\d+\-*/(). ]+/g);
      const expression = matches ? matches.join('').trim() : '';
      return expression ? { expression } : {};
    }
    
    case 'text_processor': {
      // 移除常见的指令词，保留文本内容
      const text = userInput
        .replace(/统计|字数|分析|处理|文本|大写|小写/g, '')
        .trim();
      return text ? { text, operation: 'count' } : {};
    }
    
    case 'json_processor': {
      // 提取JSON字符串
      const jsonMatch = userInput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return { json_string: jsonMatch[0], operation: 'format' };
      }
      return {};
    }
    
    case 'datetime_processor': {
      // 简单判断操作类型
      if (userInput.includes('当前') || userInput.includes('现在')) {
        return { operation: 'current_time' };
      }
      return {};
    }
    
    case 'sentiment_analysis': {
      // 提取评论文本
      const text = userInput
        .replace(/情感|分析|评论|评价/g, '')
        .trim();
      return text ? { text } : {};
    }
    
    default:
      // 默认：直接使用原始输入
      return { text: userInput };
  }
}

/**
 * 快速参数提取（不使用LLM，适用于简单场景）
 */
export function quickExtractParameters(
  toolId: string,
  userInput: string
): Record<string, any> | null {
  
  // 对于简单的纯表达式输入，直接提取
  if (toolId === 'calculator') {
    // 如果输入只包含数字和运算符，直接使用
    if (/^[\d+\-*/(). ]+$/.test(userInput.trim())) {
      return { expression: userInput.trim() };
    }
  }
  
  // 其他情况返回null，表示需要用LLM提取
  return null;
}

