/**
 * 统一的 Action 库定义
 * 
 * 这是系统中所有可用 Actions 的单一数据源（Single Source of Truth）
 * 前端和后端都从这里读取 Action 定义，确保完全一致
 * 
 * 维护说明：
 * 1. 添加新 Action 时，在这里添加定义
 * 2. 修改 Action 时，只需修改这里
 * 3. 前后端会自动同步更新
 */

import type { ActionDefinition, ActionLibrary } from './action-types';

/**
 * 系统 Action 库
 * 按类别组织，便于管理和查找
 */
export const ACTION_LIBRARY: ActionLibrary = [
  // ==========================================
  // 代码执行类 Actions
  // ==========================================
  {
    id: 'calculator',
    name: '数学计算器',
    type: 'code_execution',
    description: '执行数学运算：加减乘除、幂运算、三角函数等',
    status: 'enabled',
    category: '工具',
    parameters: [
      {
        name: 'expression',
        label: '数学表达式',
        type: 'string',
        required: true,
        description: '例如：2 + 2、sqrt(16)、sin(3.14)'
      }
    ],
    codeConfig: {
      language: 'python',
      safeMode: true
    },
    estimatedDuration: 100,
    examples: [
      '计算 2 + 2',
      '计算 sqrt(16)',
      '10 的 3 次方是多少'
    ]
  },
  
  {
    id: 'text_processor',
    name: '文本处理工具',
    type: 'code_execution',
    description: '文本分析：字数统计、大小写转换、关键词提取等',
    status: 'enabled',
    category: '工具',
    parameters: [
      {
        name: 'text',
        label: '文本内容',
        type: 'textarea',
        required: true
      },
      {
        name: 'operation',
        label: '操作类型',
        type: 'select',
        required: true,
        defaultValue: 'analyze',
        options: [
          { value: 'analyze', label: '分析统计' },
          { value: 'uppercase', label: '转大写' },
          { value: 'lowercase', label: '转小写' },
          { value: 'word_count', label: '字数统计' }
        ]
      }
    ],
    codeConfig: {
      language: 'python',
      safeMode: true
    },
    estimatedDuration: 150
  },
  
  {
    id: 'json_processor',
    name: 'JSON数据处理',
    type: 'code_execution',
    description: 'JSON解析、格式化、数据提取和转换',
    status: 'enabled',
    category: '工具',
    parameters: [
      {
        name: 'json_string',
        label: 'JSON字符串',
        type: 'textarea',
        required: true
      },
      {
        name: 'operation',
        label: '操作类型',
        type: 'select',
        required: true,
        defaultValue: 'format',
        options: [
          { value: 'format', label: '格式化' },
          { value: 'keys', label: '提取键名' },
          { value: 'count', label: '统计数量' },
          { value: 'validate', label: '验证格式' }
        ]
      }
    ],
    codeConfig: {
      language: 'python',
      safeMode: true
    },
    estimatedDuration: 100
  },
  
  {
    id: 'datetime_processor',
    name: '日期时间处理',
    type: 'code_execution',
    description: '日期格式化、时间计算、时区转换等',
    status: 'enabled',
    category: '工具',
    parameters: [
      {
        name: 'operation',
        label: '操作类型',
        type: 'select',
        required: true,
        defaultValue: 'now',
        options: [
          { value: 'now', label: '获取当前时间' },
          { value: 'parse', label: '解析日期' },
          { value: 'format', label: '格式化日期' },
          { value: 'diff', label: '计算时间差' }
        ]
      },
      {
        name: 'date_input',
        label: '日期输入（可选）',
        type: 'string',
        required: false,
        description: '例如：2024-01-01、2024-01-01 12:00:00'
      }
    ],
    codeConfig: {
      language: 'python',
      safeMode: true
    },
    estimatedDuration: 100
  },
  
  // ==========================================
  // API 调用类 Actions
  // ==========================================
  {
    id: 'google_search',
    name: 'Google 搜索',
    type: 'api_call',
    description: '搜索竞品游戏的最新资讯和用户反馈',
    status: 'beta',
    category: 'API',
    parameters: [
      {
        name: 'query',
        label: '搜索关键词',
        type: 'string',
        required: true
      },
      {
        name: 'max_results',
        label: '最大结果数',
        type: 'number',
        required: false,
        defaultValue: 10
      }
    ],
    apiConfig: {
      method: 'GET',
      endpoint: 'https://www.googleapis.com/customsearch/v1',
      authentication: {
        type: 'API_KEY',
        keyName: 'key',
        location: 'query'
      }
    },
    estimatedDuration: 2000,
    examples: [
      '搜索 王者荣耀 新版本',
      '查找 原神 用户评价'
    ]
  },
  
  // ==========================================
  // 图像生成类 Actions
  // ==========================================
  {
    id: 'gpt_image_gen',
    name: 'GPT图像生成',
    type: 'image_generation',
    description: '使用GPT模型生成高质量图像，支持多种尺寸和风格',
    status: 'enabled',
    category: '创意',
    parameters: [
      {
        name: 'prompt',
        label: '图像描述',
        type: 'textarea',
        required: true,
        description: '详细描述你想生成的图像内容'
      },
      {
        name: 'width',
        label: '宽度',
        type: 'number',
        required: false,
        defaultValue: 1536
      },
      {
        name: 'height',
        label: '高度',
        type: 'number',
        required: false,
        defaultValue: 1024
      }
    ],
    imageConfig: {
      model: 'gpt-image-1',
      defaultSize: '1536x1024',
      supportedSizes: ['1024x1024', '1536x1024', '1024x1536', '1792x1024', '1024x1792']
    },
    estimatedDuration: 15000,
    costEstimate: '中等',
    examples: [
      '生成一个卡通风格的游戏角色',
      '画一个赛博朋克风格的城市场景'
    ]
  },
  
  // ==========================================
  // LLM 任务类 Actions
  // ==========================================
  {
    id: 'sentiment_analysis',
    name: '用户评论情感分析',
    type: 'llm_task',
    description: '分析用户评论的情感倾向：正面/负面/中性',
    status: 'enabled',
    category: '分析',
    parameters: [
      {
        name: 'text',
        label: '评论内容',
        type: 'textarea',
        required: true
      }
    ],
    llmConfig: {
      systemPrompt: '你是一个专业的情感分析专家。分析用户评论，判断情感倾向（正面/负面/中性），并给出理由。',
      temperature: 0.3,
      maxTokens: 500
    },
    estimatedDuration: 3000,
    examples: [
      '分析这条评论：这个游戏太好玩了！',
      '帮我看看用户的反馈是正面还是负面'
    ]
  },
  
  {
    id: 'game_classification',
    name: '游戏标签分类',
    type: 'llm_task',
    description: '根据游戏描述自动分类游戏类型标签',
    status: 'enabled',
    category: '分析',
    parameters: [
      {
        name: 'description',
        label: '游戏描述',
        type: 'textarea',
        required: true
      }
    ],
    llmConfig: {
      systemPrompt: '你是游戏分类专家。根据游戏描述，提取游戏类型标签（如：RPG、射击、策略等）。',
      temperature: 0.4,
      maxTokens: 300
    },
    estimatedDuration: 2500
  },
  
  // ==========================================
  // Clarify 类 Actions（信息收集）
  // ==========================================
  {
    id: 'event_planning',
    name: 'Event Planner - 活动策划助手',
    type: 'clarify',
    description: '完整的游戏活动策划流程，从需求收集到方案生成再到UI设计',
    status: 'enabled',
    category: '策划',
    parameters: [],
    clarifyConfig: {
      fields: [
        {
          name: 'theme',
          label: '活动主题',
          type: 'string',
          required: true,
          description: '例如：春节活动、周年庆典'
        },
        {
          name: 'overview',
          label: '活动概要',
          type: 'textarea',
          required: true,
          description: '简要描述活动的核心内容和玩法'
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
          type: 'string',
          required: true,
          description: '例如：中国、东南亚、全球'
        }
      ],
      submitLabel: '生成活动策划案'
    },
    estimatedDuration: 30000,
    costEstimate: '高'
  }
];

/**
 * 根据 ID 查找 Action
 */
export function getActionById(id: string): ActionDefinition | null {
  return ACTION_LIBRARY.find(action => action.id === id) || null;
}

/**
 * 根据类型获取 Actions
 */
export function getActionsByType(type: string): ActionDefinition[] {
  return ACTION_LIBRARY.filter(action => action.type === type);
}

/**
 * 根据分类获取 Actions
 */
export function getActionsByCategory(category: string): ActionDefinition[] {
  return ACTION_LIBRARY.filter(action => action.category === category);
}

/**
 * 根据状态获取 Actions
 */
export function getActionsByStatus(status: string): ActionDefinition[] {
  return ACTION_LIBRARY.filter(action => action.status === status);
}

/**
 * 获取所有启用的 Actions
 */
export function getEnabledActions(): ActionDefinition[] {
  return ACTION_LIBRARY.filter(action => action.status === 'enabled' || action.status === 'beta');
}

/**
 * 搜索 Actions（根据名称或描述）
 */
export function searchActions(query: string): ActionDefinition[] {
  const lowerQuery = query.toLowerCase();
  return ACTION_LIBRARY.filter(action => 
    action.name.toLowerCase().includes(lowerQuery) ||
    action.description.toLowerCase().includes(lowerQuery) ||
    action.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 智能选择最佳 Action
 * 
 * 根据用户输入，通过关键词匹配选择最合适的 Action。
 * 用于快速意图识别和工具调用。
 * 
 * @param userInput - 用户输入的文本
 * @returns 匹配的 Action，如果没有匹配则返回 null
 * 
 * @example
 * ```typescript
 * const action = selectBestAction("计算2+2");
 * // 返回：数学计算器 Action
 * 
 * const action = selectBestAction("生成一张游戏角色图片");
 * // 返回：GPT图像生成 Action
 * ```
 */
export function selectBestAction(userInput: string): ActionDefinition | null {
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
    return ACTION_LIBRARY.find(action => action.id === 'gpt_image_gen') || null;
  }
  
  // 数学计算关键词 - 移到图像生成之后，避免误匹配包含符号的图像生成请求
  if (/[0-9+\-*/()=]/.test(input) && 
      (input.includes('计算') || input.includes('算') || 
       input.includes('加') || input.includes('减') || 
       input.includes('乘') || input.includes('除'))) {
    return ACTION_LIBRARY.find(action => action.id === 'calculator') || null;
  }
  
  // 文本处理关键词
  if (input.includes('文本') || input.includes('字数') || 
      input.includes('大写') || input.includes('小写') ||
      input.includes('分析文字') || input.includes('处理文字')) {
    return ACTION_LIBRARY.find(action => action.id === 'text_processor') || null;
  }
  
  // JSON处理关键词
  if (input.includes('json') || input.includes('{') || 
      input.includes('格式化') || input.includes('解析数据')) {
    return ACTION_LIBRARY.find(action => action.id === 'json_processor') || null;
  }
  
  // 日期时间关键词
  if (input.includes('时间') || input.includes('日期') || 
      input.includes('现在') || input.includes('当前')) {
    return ACTION_LIBRARY.find(action => action.id === 'datetime_processor') || null;
  }
  
  // 搜索相关
  if (input.includes('搜索') || input.includes('查找') || 
      input.includes('竞品') || input.includes('google')) {
    return ACTION_LIBRARY.find(action => action.id === 'google_search') || null;
  }
  
  // 情感分析
  if (input.includes('情感') || input.includes('评论') || 
      input.includes('分析评价') || input.includes('用户反馈')) {
    return ACTION_LIBRARY.find(action => action.id === 'sentiment_analysis') || null;
  }
  
  // 游戏分类
  if (input.includes('分类') || input.includes('标签') || 
      input.includes('游戏类型')) {
    return ACTION_LIBRARY.find(action => action.id === 'game_classification') || null;
  }
  
  // Event Planner 活动策划
  if (input.includes('活动策划') || input.includes('策划方案') ||
      input.includes('event plan') || input.includes('活动方案')) {
    return ACTION_LIBRARY.find(action => action.id === 'event_planning') || null;
  }
  
  return null;
}

