// 简单Todo生成器 - 使用LLM智能分析用户输入

import { streamOllamaChat, OllamaChatMessage } from './ollama';
import { SimpleTodoList, SimpleTodoItem, TodoTaskType } from '../components/BottomTodoPanel';
import { selectBestAction } from './actionLibrary';

// 生成唯一ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 检测是否为多步骤任务
export function isMultiStepTask(userInput: string): boolean {
  const multiStepKeywords = [
    '先.*再', '先.*然后', '首先.*然后', '第一.*第二',
    '然后', '接着', '最后', '之后',
    '步骤', '流程', '计划', '方案',
    '分析.*生成', '搜索.*分析', '查找.*处理',
    '并且', '同时', '以及.*和',
    '多个', '几个', '一系列'
  ];
  
  const input = userInput.toLowerCase();
  return multiStepKeywords.some(keyword => {
    const regex = new RegExp(keyword.replace('.*', '.*?'), 'i');
    return regex.test(input);
  }) || userInput.length > 30; // 长输入也可能是多步骤
}

// 生成LLM提示词用于Todo分析
function generateTodoAnalysisPrompt(userInput: string): string {
  return `
你是一个任务分析专家。用户说了一句话，请你分析这句话是否包含多个步骤的任务，如果是，请将其分解为简单的步骤列表，并为每个步骤分类任务类型。

任务类型说明：
- ACTION: 可以通过动作库工具完成（如数学计算、文本处理、JSON处理、日期时间、API调用等）
- LLM: 需要大语言模型处理的文本任务（如内容分析、文本生成、总结、翻译等）
- USER_INPUT: 需要用户提供信息才能完成（如获取用户偏好、确认选择、提供具体数据等）

用户输入: "${userInput}"

请按照以下格式输出，如果不是多步骤任务就输出"NO_STEPS"：

如果是多步骤任务，请输出：
STEPS:
1. [ACTION/LLM/USER_INPUT] [第一步的简短描述，一句话]
2. [ACTION/LLM/USER_INPUT] [第二步的简短描述，一句话]  
3. [ACTION/LLM/USER_INPUT] [第三步的简短描述，一句话]
...

要求：
- 每个步骤用一句话概括，不超过20个字
- 按照逻辑顺序排列
- 正确分类任务类型
- 如果只有一个步骤或不是任务类型，输出"NO_STEPS"

示例：
用户输入: "先计算我的年龄，然后分析我适合什么游戏类型，最后询问我的游戏偏好"
输出:
STEPS:
1. [USER_INPUT] 获取用户出生日期
2. [ACTION] 计算用户年龄
3. [LLM] 分析适合的游戏类型
4. [USER_INPUT] 询问游戏偏好
`;
}

// 解析LLM返回的步骤
function parseStepsFromLLMResponse(response: string): Array<{text: string, taskType: TodoTaskType, userPrompt?: string}> {
  const lines = response.split('\n').map(line => line.trim()).filter(line => line);
  
  // 检查是否返回NO_STEPS
  if (response.includes('NO_STEPS')) {
    return [];
  }
  
  const steps: Array<{text: string, taskType: TodoTaskType, userPrompt?: string}> = [];
  let inStepsSection = false;
  
  for (const line of lines) {
    if (line.startsWith('STEPS:')) {
      inStepsSection = true;
      continue;
    }
    
    if (inStepsSection) {
      // 匹配 "数字. [TYPE] 内容" 格式
      const match = line.match(/^\d+\.\s*\[(\w+)\]\s*(.+)$/);
      if (match) {
        const typeStr = match[1].toUpperCase();
        const text = match[2].trim();
        
        let taskType: TodoTaskType = 'action';
        let userPrompt: string | undefined;
        
        switch (typeStr) {
          case 'ACTION':
            taskType = 'action';
            break;
          case 'LLM':
            taskType = 'llm';
            break;
          case 'USER_INPUT':
            taskType = 'user_input';
            userPrompt = `请提供以下信息：${text}`;
            break;
          default:
            // 如果没有明确类型，尝试智能判断
            taskType = classifyTaskType(text);
        }
        
        steps.push({ text, taskType, userPrompt });
      }
    }
  }
  
  return steps;
}

// 智能分类任务类型
function classifyTaskType(stepText: string): TodoTaskType {
  const text = stepText.toLowerCase();
  
  // 检查是否可以用动作库处理
  if (selectBestAction(stepText)) {
    return 'action';
  }
  
  // 检查是否需要用户输入
  const userInputKeywords = [
    '询问', '获取', '确认', '选择', '输入', '提供', 
    '告诉我', '你的', '用户的', '偏好', '需求'
  ];
  
  if (userInputKeywords.some(keyword => text.includes(keyword))) {
    return 'user_input';
  }
  
  // 默认为LLM处理
  return 'llm';
}

// 使用LLM生成简单Todo列表
export async function generateSimpleTodoWithLLM(userInput: string): Promise<SimpleTodoList | null> {
  try {
    // 生成分析提示词
    const prompt = generateTodoAnalysisPrompt(userInput);
    
    // 调用LLM
    const messages: OllamaChatMessage[] = [
      { role: 'user', content: prompt }
    ];
    
    let llmResponse = '';
    const stream = streamOllamaChat(messages);
    
    for await (const chunk of stream) {
      llmResponse += chunk;
    }
    
    // 解析LLM返回的步骤
    const steps = parseStepsFromLLMResponse(llmResponse);
    
    if (steps.length === 0) {
      return null; // 不是多步骤任务
    }
    
    // 创建SimpleTodoList
    const todoItems: SimpleTodoItem[] = steps.map((step, index) => ({
      id: generateId(),
      text: step.text,
      status: 'pending' as const,
      order: index + 1,
      taskType: step.taskType,
      userPrompt: step.userPrompt
    }));
    
    const todoList: SimpleTodoList = {
      id: generateId(),
      title: '任务执行计划',
      items: todoItems,
      status: 'draft',
      currentStep: 0,
      totalSteps: todoItems.length
    };
    
    return todoList;
    
  } catch (error) {
    console.error('生成Todo列表失败:', error);
    return null;
  }
}

// 更新Todo项状态
export function updateTodoItemStatus(
  todoList: SimpleTodoList, 
  itemId: string, 
  newStatus: SimpleTodoItem['status']
): SimpleTodoList {
  const updatedItems = todoList.items.map(item => 
    item.id === itemId ? { ...item, status: newStatus } : item
  );
  
  // 计算当前步骤
  const completedCount = updatedItems.filter(item => item.status === 'completed').length;
  const runningCount = updatedItems.filter(item => item.status === 'running').length;
  const waitingCount = updatedItems.filter(item => item.status === 'waiting_user').length;
  
  // 更新整体状态 - 保持原有状态，除非需要明确改变
  let status: SimpleTodoList['status'] = todoList.status;
  if (completedCount === updatedItems.length) {
    status = 'completed';
  } else if (runningCount > 0 || completedCount > 0 || waitingCount > 0) {
    // 只要有运行中、已完成或等待用户的任务，且原状态不是paused，就设为running
    if (todoList.status !== 'paused') {
      status = 'running';
    }
  }
  
  // 调试日志
  console.log('updateTodoItemStatus:', {
    itemId,
    newStatus,
    originalStatus: todoList.status,
    finalStatus: status,
    completedCount,
    runningCount,
    waitingCount
  });
  
  return {
    ...todoList,
    items: updatedItems,
    status,
    currentStep: completedCount
  };
}

// 获取下一个待执行的Todo项
export function getNextPendingTodo(todoList: SimpleTodoList): SimpleTodoItem | null {
  return todoList.items.find(item => item.status === 'pending') || null;
}

// 开始执行Todo列表
export function startTodoExecution(todoList: SimpleTodoList): SimpleTodoList {
  // 将第一个待执行的项目设为运行中
  const nextTodo = getNextPendingTodo(todoList);
  if (nextTodo) {
    return updateTodoItemStatus(todoList, nextTodo.id, 'running');
  }
  return todoList;
}

// 完成当前步骤并开始下一步
export function completeCurrentAndStartNext(todoList: SimpleTodoList): SimpleTodoList {
  // 找到当前运行中的项目
  const runningItem = todoList.items.find(item => item.status === 'running');
  if (!runningItem) return todoList;
  
  // 完成当前项目
  let updatedList = updateTodoItemStatus(todoList, runningItem.id, 'completed');
  
  // 开始下一个项目
  const nextTodo = getNextPendingTodo(updatedList);
  if (nextTodo) {
    updatedList = updateTodoItemStatus(updatedList, nextTodo.id, 'running');
  }
  
  return updatedList;
}
