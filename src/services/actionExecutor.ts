/**
 * 前端本地 Action 执行服务（已弃用，仅作为fallback）
 * 
 * ⚠️ 注意：此文件已被后端 ActionExecutorService 取代
 * 当前仅用于：
 * 1. Todo执行系统的本地计算功能
 * 2. 作为后端不可用时的降级方案
 * 
 * 新功能应该在后端实现：
 * - backend/services/action_executor_service.py
 * 
 * @deprecated 优先使用后端API执行Actions
 */

export interface ActionExecutionResult {
  success: boolean;
  result: any;
  error?: string;
  executionTime: number;
}

// 数学计算器
export function executeCalculator(expression: string): ActionExecutionResult {
  const startTime = Date.now();
  
  try {
    // 安全的数学表达式计算
    // 只允许数字、基本运算符和括号
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    if (!sanitized.trim()) {
      return {
        success: false,
        error: '无效的数学表达式',
        result: null,
        executionTime: Date.now() - startTime
      };
    }
    
    // 使用Function构造器安全计算（避免eval）
    const result = new Function('return ' + sanitized)();
    
    if (typeof result !== 'number' || !isFinite(result)) {
      return {
        success: false,
        error: '计算结果无效',
        result: null,
        executionTime: Date.now() - startTime
      };
    }
    
    return {
      success: true,
      result: {
        expression: expression,
        sanitized: sanitized,
        answer: result,
        type: 'calculation'
      },
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: `计算错误: ${(error as Error).message}`,
      result: null,
      executionTime: Date.now() - startTime
    };
  }
}

// 文本处理工具
export function executeTextProcessor(text: string, operation: string): ActionExecutionResult {
  const startTime = Date.now();
  
  try {
    let result: any;
    
    switch (operation.toLowerCase()) {
      case 'uppercase':
      case '转大写':
        result = {
          original: text,
          processed: text.toUpperCase(),
          operation: '转换为大写',
          length: text.length
        };
        break;
        
      case 'lowercase':
      case '转小写':
        result = {
          original: text,
          processed: text.toLowerCase(),
          operation: '转换为小写',
          length: text.length
        };
        break;
        
      case 'wordcount':
      case '字数统计':
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;
        
        result = {
          original: text,
          wordCount: words.length,
          characterCount: characters,
          characterCountNoSpaces: charactersNoSpaces,
          operation: '文本统计'
        };
        break;
        
      case 'reverse':
      case '反转':
        result = {
          original: text,
          processed: text.split('').reverse().join(''),
          operation: '文本反转',
          length: text.length
        };
        break;
        
      default:
        return {
          success: false,
          error: `不支持的操作: ${operation}`,
          result: null,
          executionTime: Date.now() - startTime
        };
    }
    
    return {
      success: true,
      result: result,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: `文本处理错误: ${(error as Error).message}`,
      result: null,
      executionTime: Date.now() - startTime
    };
  }
}

// JSON数据处理
export function executeJsonProcessor(jsonString: string, operation: string): ActionExecutionResult {
  const startTime = Date.now();
  
  try {
    const data = JSON.parse(jsonString);
    let result: any;
    
    switch (operation.toLowerCase()) {
      case 'format':
      case '格式化':
        result = {
          original: jsonString,
          formatted: JSON.stringify(data, null, 2),
          operation: 'JSON格式化',
          valid: true
        };
        break;
        
      case 'minify':
      case '压缩':
        result = {
          original: jsonString,
          minified: JSON.stringify(data),
          operation: 'JSON压缩',
          sizeBefore: jsonString.length,
          sizeAfter: JSON.stringify(data).length
        };
        break;
        
      case 'keys':
      case '提取键':
        const keys = Object.keys(data);
        result = {
          original: jsonString,
          keys: keys,
          keyCount: keys.length,
          operation: '提取JSON键'
        };
        break;
        
      default:
        return {
          success: false,
          error: `不支持的JSON操作: ${operation}`,
          result: null,
          executionTime: Date.now() - startTime
        };
    }
    
    return {
      success: true,
      result: result,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: `JSON处理错误: ${(error as Error).message}`,
      result: null,
      executionTime: Date.now() - startTime
    };
  }
}

// 日期时间处理
export function executeDateTimeProcessor(input: string, operation: string): ActionExecutionResult {
  const startTime = Date.now();
  
  try {
    let result: any;
    const now = new Date();
    
    switch (operation.toLowerCase()) {
      case 'now':
      case '当前时间':
        result = {
          timestamp: now.getTime(),
          iso: now.toISOString(),
          local: now.toLocaleString('zh-CN'),
          date: now.toLocaleDateString('zh-CN'),
          time: now.toLocaleTimeString('zh-CN'),
          operation: '获取当前时间'
        };
        break;
        
      case 'parse':
      case '解析时间':
        const parsedDate = new Date(input);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('无效的日期格式');
        }
        result = {
          input: input,
          timestamp: parsedDate.getTime(),
          iso: parsedDate.toISOString(),
          local: parsedDate.toLocaleString('zh-CN'),
          operation: '解析日期时间'
        };
        break;
        
      case 'format':
      case '格式化':
        const date = input ? new Date(input) : now;
        if (isNaN(date.getTime())) {
          throw new Error('无效的日期格式');
        }
        result = {
          input: input || '当前时间',
          formatted: {
            'YYYY-MM-DD': date.toISOString().split('T')[0],
            'YYYY/MM/DD': date.toLocaleDateString('zh-CN'),
            'MM/DD/YYYY': date.toLocaleDateString('en-US'),
            'HH:mm:ss': date.toLocaleTimeString('zh-CN', { hour12: false }),
            '完整': date.toLocaleString('zh-CN')
          },
          operation: '日期格式化'
        };
        break;
        
      default:
        return {
          success: false,
          error: `不支持的日期操作: ${operation}`,
          result: null,
          executionTime: Date.now() - startTime
        };
    }
    
    return {
      success: true,
      result: result,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      error: `日期处理错误: ${(error as Error).message}`,
      result: null,
      executionTime: Date.now() - startTime
    };
  }
}

// 统一的动作执行入口
export function executeAction(actionName: string, input: string, params?: any): ActionExecutionResult {
  const normalizedName = actionName.toLowerCase();
  
  // 根据动作名称路由到对应的执行函数
  if (normalizedName.includes('计算') || normalizedName.includes('calculator')) {
    return executeCalculator(input);
  } else if (normalizedName.includes('文本') || normalizedName.includes('text')) {
    const operation = params?.operation || '字数统计';
    return executeTextProcessor(input, operation);
  } else if (normalizedName.includes('json') || normalizedName.includes('数据')) {
    const operation = params?.operation || '格式化';
    return executeJsonProcessor(input, operation);
  } else if (normalizedName.includes('日期') || normalizedName.includes('时间') || normalizedName.includes('date')) {
    const operation = params?.operation || '当前时间';
    return executeDateTimeProcessor(input, operation);
  } else {
    return {
      success: false,
      error: `未知的动作类型: ${actionName}`,
      result: null,
      executionTime: 0
    };
  }
}

// 解析自然语言输入为动作参数
export function parseNaturalLanguageInput(naturalInput: string): { actionName: string; input: string; params?: any } {
  const lowerInput = naturalInput.toLowerCase();
  
  // 数学计算模式
  if (lowerInput.includes('计算') || /[\d+\-*/().\s]+/.test(naturalInput)) {
    const mathExpression = naturalInput.replace(/计算|等于|=|？|\?/g, '').trim();
    return {
      actionName: '数学计算器',
      input: mathExpression
    };
  }
  
  // 文本处理模式
  if (lowerInput.includes('文本') || lowerInput.includes('字数') || lowerInput.includes('大写') || lowerInput.includes('小写')) {
    let operation = '字数统计';
    if (lowerInput.includes('大写')) operation = '转大写';
    else if (lowerInput.includes('小写')) operation = '转小写';
    else if (lowerInput.includes('反转')) operation = '反转';
    
    return {
      actionName: '文本处理工具',
      input: naturalInput.replace(/(统计|转|反转|大写|小写|文本|字数)/g, '').trim(),
      params: { operation }
    };
  }
  
  // JSON处理模式
  if (lowerInput.includes('json') || naturalInput.includes('{')) {
    let operation = '格式化';
    if (lowerInput.includes('压缩')) operation = '压缩';
    else if (lowerInput.includes('键') || lowerInput.includes('key')) operation = '提取键';
    
    return {
      actionName: 'JSON数据处理',
      input: naturalInput,
      params: { operation }
    };
  }
  
  // 日期时间处理模式
  if (lowerInput.includes('时间') || lowerInput.includes('日期')) {
    let operation = '当前时间';
    if (lowerInput.includes('格式化') || lowerInput.includes('format')) operation = '格式化';
    else if (lowerInput.includes('解析') || lowerInput.includes('parse')) operation = '解析时间';
    
    return {
      actionName: '日期时间处理',
      input: naturalInput.replace(/(时间|日期|格式化|解析|当前)/g, '').trim(),
      params: { operation }
    };
  }
  
  // 默认作为计算处理
  return {
    actionName: '数学计算器',
    input: naturalInput
  };
}
