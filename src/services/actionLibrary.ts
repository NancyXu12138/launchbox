// 动作库服务 - 提供可用动作的信息

export type ActionItem = {
  id: string;
  name: string;
  type: 'API调用' | '提示工程' | '执行代码' | '图像生成' | '活动策划';
  description: string;
  pythonCode?: string;
  apiConfig?: {
    method: string;
    endpoint: string;
    headers: Record<string, string>;
    params?: Record<string, string>;
    body?: string;
    authentication: {
      type: 'API_KEY' | 'OAUTH' | 'BEARER';
      keyName?: string;
      location?: 'header' | 'query';
    };
  };
  imageGenConfig?: {
    model: string;
    defaultSize: string;
    supportedSizes: string[];
  };
  eventPlannerConfig?: {
    step: 'form' | 'overview' | 'full_plan' | 'ui_mockup';
    formFields?: Array<{
      name: string;
      label: string;
      type: 'text' | 'textarea' | 'select';
      required: boolean;
      options?: Array<{ value: string; label: string; }>;
    }>;
  };
};

// 动作库数据
export const ACTION_LIBRARY: ActionItem[] = [
  // API调用
  { 
    id: '1', 
    name: 'Google 搜索竞品信息', 
    type: 'API调用', 
    description: '搜索竞品游戏的最新资讯和用户反馈',
    apiConfig: {
      method: 'GET',
      endpoint: 'https://www.googleapis.com/customsearch/v1',
      headers: { 'Content-Type': 'application/json' },
      params: { 'cx': 'YOUR_SEARCH_ENGINE_ID', 'q': '{search_query}' },
      authentication: { type: 'API_KEY', keyName: 'key', location: 'query' }
    }
  },
  { 
    id: '2', 
    name: 'Google Sheets 数据读取', 
    type: 'API调用', 
    description: '读取游戏数据分析表格中的KPI指标',
    apiConfig: {
      method: 'GET',
      endpoint: 'https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}',
      headers: { 'Content-Type': 'application/json' },
      authentication: { type: 'API_KEY', keyName: 'key', location: 'query' }
    }
  },
  { 
    id: '3', 
    name: 'Steam API 游戏数据', 
    type: 'API调用', 
    description: '获取Steam平台游戏评价和销售数据',
    apiConfig: {
      method: 'GET',
      endpoint: 'https://store.steampowered.com/api/appdetails',
      headers: { 'Content-Type': 'application/json' },
      params: { 'appids': '{game_id}', 'l': 'schinese' },
      authentication: { type: 'API_KEY', keyName: 'key', location: 'query' }
    }
  },
  
  // 图像生成
  {
    id: '4',
    name: 'GPT图像生成',
    type: '图像生成',
    description: '使用GPT模型生成高质量图像，支持多种尺寸和风格',
    imageGenConfig: {
      model: 'gpt-image-1',
      defaultSize: '1536x1024',
      supportedSizes: ['1024x1024', '1536x1024', '1024x1536']
    }
  },
  
  // 提示工程
  { 
    id: '6', 
    name: '用户评论情感分析', 
    type: '提示工程', 
    description: '分析用户评论的情感倾向：正面/负面/中性' 
  },
  { 
    id: '7', 
    name: '游戏标签分类', 
    type: '提示工程', 
    description: '根据游戏描述自动分类游戏类型标签' 
  },
  
  // 执行代码
  {
    id: '8',
    name: '数学计算器',
    type: '执行代码',
    description: '执行数学运算：加减乘除、幂运算、三角函数等',
    pythonCode: `def calculator(expression):
    """安全的数学计算器"""
    import math
    import re
    
    # 只允许安全的数学运算
    allowed_chars = set('0123456789+-*/.() ')
    allowed_funcs = {'sin', 'cos', 'tan', 'sqrt', 'log', 'abs', 'pow'}
    
    if not all(c in allowed_chars or c.isalpha() for c in expression):
        return {"error": "包含不安全字符"}
    
    try:
        result = eval(expression, {"__builtins__": {}}, math.__dict__)
        return {"result": result, "expression": expression}
    except Exception as e:
        return {"error": str(e)}`
  },
  {
    id: '9',
    name: '文本处理工具',
    type: '执行代码',
    description: '文本分析：字数统计、大小写转换、关键词提取等',
    pythonCode: `def text_processor(text, operation="analyze"):
    """文本处理工具"""
    import re
    
    if operation == "analyze":
        words = len(text.split())
        chars = len(text)
        lines = len(text.split('\\n'))
        return {
            "word_count": words,
            "char_count": chars,
            "line_count": lines,
            "analysis": f"包含{words}个单词，{chars}个字符，{lines}行"
        }
    elif operation == "uppercase":
        return {"result": text.upper()}
    elif operation == "lowercase":
        return {"result": text.lower()}
    else:
        return {"error": "不支持的操作"}`
  },
  {
    id: '10',
    name: 'JSON数据处理',
    type: '执行代码',
    description: 'JSON解析、格式化、数据提取和转换',
    pythonCode: `def json_processor(json_string, operation="format"):
    """JSON数据处理"""
    import json
    
    try:
        data = json.loads(json_string)
        
        if operation == "format":
            return {"result": json.dumps(data, indent=2, ensure_ascii=False)}
        elif operation == "keys":
            return {"keys": list(data.keys()) if isinstance(data, dict) else "不是对象"}
        elif operation == "count":
            count = len(data) if isinstance(data, (dict, list)) else 1
            return {"count": count}
        else:
            return {"error": "不支持的操作"}
    except json.JSONDecodeError as e:
        return {"error": f"JSON解析错误: {e}"}`
  },
  {
    id: '11',
    name: '日期时间处理',
    type: '执行代码',
    description: '日期格式化、时间计算、时区转换等',
    pythonCode: `def datetime_processor(date_input="", operation="now"):
    """日期时间处理"""
    from datetime import datetime, timedelta
    import time
    
    if operation == "now":
        now = datetime.now()
        return {
            "current_time": now.strftime("%Y-%m-%d %H:%M:%S"),
            "timestamp": int(time.time()),
            "iso_format": now.isoformat()
        }
    elif operation == "parse":
        try:
            parsed = datetime.fromisoformat(date_input.replace('Z', '+00:00'))
            return {
                "parsed": parsed.strftime("%Y-%m-%d %H:%M:%S"),
                "weekday": parsed.strftime("%A"),
                "timestamp": int(parsed.timestamp())
            }
        except ValueError as e:
            return {"error": f"日期解析错误: {e}"}
    else:
        return {"error": "不支持的操作"}`
  },
  
  // 活动策划
  {
    id: '12',
    name: 'Event Planner - 活动策划助手',
    type: '活动策划',
    description: '完整的游戏活动策划流程，从需求收集到方案生成再到UI设计',
    eventPlannerConfig: {
      step: 'form',
      formFields: [
        {
          name: 'theme',
          label: '活动主题',
          type: 'text',
          required: true
        },
        {
          name: 'overview',
          label: '活动概要',
          type: 'textarea',
          required: true
        },
        {
          name: 'businessGoal',
          label: '业务目标',
          type: 'select',
          required: true,
          options: [
            { value: 'retention_battle', label: '留存活动 - 对战类活动' },
            { value: 'retention_signin', label: '留存活动 - 登录天数活动' },
            { value: 'retention_dau', label: '留存活动 - 冲高类活动' },
            { value: 'acquisition_return', label: '拉人活动 - 回流活动' },
            { value: 'acquisition_new', label: '拉人活动 - 拉新活动' },
            { value: 'monetization_payment', label: '商业化 - 付费率活动' },
            { value: 'monetization_arppu', label: '商业化 - ARPPU活动' }
          ]
        },
        {
          name: 'targetPlayer',
          label: '目标玩家',
          type: 'select',
          required: true,
          options: [
            { value: 'active_low', label: '活跃玩家 - 低活' },
            { value: 'active_medium', label: '活跃玩家 - 中活' },
            { value: 'active_high', label: '活跃玩家 - 高活' },
            { value: 'returning', label: '回流玩家' },
            { value: 'new', label: '新玩家' },
            { value: 'monetization_big_r', label: '商业化 - 大R' },
            { value: 'monetization_medium_r', label: '商业化 - 中R' },
            { value: 'monetization_small_r', label: '商业化 - 小R' },
            { value: 'monetization_non_paying', label: '商业化 - 未付费玩家' }
          ]
        },
        {
          name: 'targetRegion',
          label: '目标区域',
          type: 'text',
          required: true
        }
      ]
    }
  }
];

// 根据用户输入选择最合适的动作
export function selectBestAction(userInput: string): ActionItem | null {
  const input = userInput.toLowerCase();
  
  // 图像生成 - 优先检测，避免被其他规则误匹配
  if (input.includes('生图') || input.includes('画图') || 
      input.includes('生成图片') || input.includes('生成图像') || 
      input.includes('画一个') || input.includes('画一张') ||
      input.includes('生成一张图') || input.includes('生成一幅图') || 
      input.includes('画出') || input.includes('绘制') || 
      input.includes('创建图片') || input.includes('generate image') || 
      input.includes('create image') || input.includes('draw') ||
      input.includes('mockup') || input.includes('原型图') ||
      input.includes('界面') || input.includes('ui') ||
      input.includes('设计') || input.includes('图像')) {
    console.log('图像生成关键词匹配成功:', input);
    return ACTION_LIBRARY.find(action => action.name === 'GPT图像生成') || null;
  }
  
  // 数学计算关键词 - 移到图像生成之后，避免误匹配包含符号的图像生成请求
  if (/[0-9+\-*/()=]/.test(input) && 
      (input.includes('计算') || input.includes('算') || 
       input.includes('加') || input.includes('减') || 
       input.includes('乘') || input.includes('除'))) {
    return ACTION_LIBRARY.find(action => action.name === '数学计算器') || null;
  }
  
  // 文本处理关键词
  if (input.includes('文本') || input.includes('字数') || 
      input.includes('大写') || input.includes('小写') ||
      input.includes('分析文字') || input.includes('处理文字')) {
    return ACTION_LIBRARY.find(action => action.name === '文本处理工具') || null;
  }
  
  // JSON处理关键词
  if (input.includes('json') || input.includes('{') || 
      input.includes('格式化') || input.includes('解析数据')) {
    return ACTION_LIBRARY.find(action => action.name === 'JSON数据处理') || null;
  }
  
  // 日期时间关键词
  if (input.includes('时间') || input.includes('日期') || 
      input.includes('现在') || input.includes('当前')) {
    return ACTION_LIBRARY.find(action => action.name === '日期时间处理') || null;
  }
  
  // 搜索相关
  if (input.includes('搜索') || input.includes('查找') || 
      input.includes('竞品') || input.includes('google')) {
    return ACTION_LIBRARY.find(action => action.name === 'Google 搜索竞品信息') || null;
  }
  
  // 表格数据相关
  if (input.includes('表格') || input.includes('数据') || 
      input.includes('sheets') || input.includes('读取')) {
    return ACTION_LIBRARY.find(action => action.name === 'Google Sheets 数据读取') || null;
  }
  
  // 情感分析
  if (input.includes('情感') || input.includes('评论') || 
      input.includes('分析评价') || input.includes('用户反馈')) {
    return ACTION_LIBRARY.find(action => action.name === '用户评论情感分析') || null;
  }
  
  // 游戏分类
  if (input.includes('分类') || input.includes('标签') || 
      input.includes('游戏类型')) {
    return ACTION_LIBRARY.find(action => action.name === '游戏标签分类') || null;
  }
  
  // Event Planner 活动策划
  if (input.includes('event planner') || input.includes('活动策划') ||
      input.includes('活动方案') || input.includes('活动设计') ||
      input.includes('策划案') || input.includes('活动运营') ||
      input.includes('游戏活动') || input.includes('活动助手') ||
      input.includes('方案策划') || input.includes('策划方案') ||
      input.includes('活动规划') || input.includes('策划活动')) {
    console.log('Event Planner关键词匹配成功:', input);
    console.log('ACTION_LIBRARY长度:', ACTION_LIBRARY.length);
    console.log('ACTION_LIBRARY中的所有action名称:', ACTION_LIBRARY.map(a => a.name));
    const foundAction = ACTION_LIBRARY.find(action => action.name === 'Event Planner - 活动策划助手');
    console.log('找到的Event Planner Action:', foundAction);
    return foundAction || null;
  }
  
  return null;
}

// 获取所有可用动作
export function getAllActions(): ActionItem[] {
  return ACTION_LIBRARY;
}

// 根据类型获取动作
export function getActionsByType(type: ActionItem['type']): ActionItem[] {
  return ACTION_LIBRARY.filter(action => action.type === type);
}

// 根据ID获取动作
export function getActionById(id: string): ActionItem | null {
  return ACTION_LIBRARY.find(action => action.id === id) || null;
}
