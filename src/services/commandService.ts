/**
 * 指挥中心服务
 * 
 * 职责：
 * 1. 管理预定义的Workflow指令
 * 2. 为用户提供常用任务模板
 * 3. 支持自定义和共享指令
 * 
 * 指令分类：
 * - personal: 个人工作流（简单任务、测试用例）
 * - public: 团队共享工作流（复杂业务流程）
 * 
 * 数据存储：
 * - localStorage中存储用户自定义指令
 * - 默认指令在代码中定义（DEFAULT_COMMANDS）
 * 
 * 工作原理：
 * 1. 用户选择指令 → 生成Todo List
 * 2. Todo系统逐步执行 → 调用相应的Actions
 * 3. 完成所有步骤 → 返回最终结果
 * 
 * 相关文件：
 * - simpleTodoGenerator.ts: 生成Todo
 * - todoExecutionService.ts: 执行Todo
 */

export type CommandItem = {
  id: string;
  name: string;
  description: string;
  todoList: string; // 文本形式的todolist
  category: 'personal' | 'public'; // 指令分类
  enabled: boolean; // 启用状态
};

const COMMANDS_STORAGE_KEY = 'launchbox_commands_v1';

/**
 * 默认指令数据
 * 
 * 设计原则：
 * 1. 每个指令都应该是可测试和可执行的
 * 2. 步骤应该明确，便于 Todo 系统解析
 * 3. 优先使用已实现的 Action
 * 4. 每个步骤都要通过AI智能处理，实现动态数据传递
 * 
 * 步骤设计规范：
 * - 不需要指定具体的tool ID，由AI智能匹配
 * - 描述清晰，让AI能理解需要做什么
 * - 支持步骤间的数据依赖和传递
 * 
 * 指令类别：
 * - personal: 个人工作流（测试和简单任务）
 * - public: 团队共享工作流（复杂业务流程）
 */
const DEFAULT_COMMANDS: CommandItem[] = [
  // ==========================================
  // 测试和简单任务（Personal）
  // ==========================================
  {
    id: 'simple_calc',
    name: '📊 数学计算助手',
    description: '执行数学计算并提供详细步骤解释',
    todoList: `1. 提取用户输入的数学表达式
2. 使用计算器工具计算结果
3. 生成包含详细步骤的计算报告`,
    category: 'personal',
    enabled: true
  },
  {
    id: 'text_analysis',
    name: '📝 文本分析工作流',
    description: '对输入文本进行全面分析（字数、情感、分类）',
    todoList: `1. 使用文本处理工具统计文本信息（字数、字符数）
2. 分析文本的情感倾向（正面/负面/中性）
3. 汇总分析结果并生成完整报告`,
    category: 'personal',
    enabled: true
  },
  {
    id: 'time_report',
    name: '⏰ 时间数据报告',
    description: '获取当前时间并生成格式化报告',
    todoList: `1. 使用日期时间工具获取当前时间
2. 分析时间数据（星期、季度、工作日等）
3. 生成格式化的时间报告`,
    category: 'personal',
    enabled: true
  },
  {
    id: 'json_data_process',
    name: '🔧 JSON数据处理',
    description: '处理和美化JSON数据',
    todoList: `1. 解析用户提供的JSON数据
2. 验证JSON格式并美化输出
3. 提取关键信息并生成数据摘要`,
    category: 'personal',
    enabled: true
  },
  
  // ==========================================
  // 业务工作流（Public）
  // ==========================================
  {
    id: 'competitor_analysis',
    name: '🎯 竞品分析工作流',
    description: '搜索竞品信息并生成分析报告',
    todoList: `1. 使用搜索工具查找竞品的最新信息
2. 分析竞品的核心特色和定位
3. 评估竞品的市场表现和用户反馈
4. 生成竞品对比分析报告`,
    category: 'public',
    enabled: true
  },
  {
    id: 'user_feedback_analysis',
    name: '💬 用户反馈情感分析',
    description: '分析多条用户评论的情感倾向',
    todoList: `1. 收集和整理用户评论列表
2. 对每条评论进行情感分析（正面/负面/中性）
3. 统计各类情感的占比
4. 提取关键意见和改进建议
5. 生成用户反馈分析报告`,
    category: 'public',
    enabled: true
  },
  {
    id: 'content_creation',
    name: '✍️ 内容创作助手',
    description: '从主题到成品的智能内容创作',
    todoList: `1. 分析内容主题和目标受众
2. 生成结构化的内容大纲
3. 基于大纲撰写完整内容
4. 优化和润色文本表达
5. 生成配图建议（可选：使用图像生成）`,
    category: 'public',
    enabled: true
  },
  {
    id: 'game_classification',
    name: '🎮 游戏分类与标签',
    description: '分析游戏描述并生成分类标签',
    todoList: `1. 提取游戏的核心信息
2. 使用游戏分类工具生成类型标签
3. 分析游戏特色和卖点
4. 生成完整的游戏分类报告`,
    category: 'public',
    enabled: true
  }
];

// 获取所有指令
export function getCommands(): CommandItem[] {
  try {
    const stored = localStorage.getItem(COMMANDS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load commands:', error);
  }
  return DEFAULT_COMMANDS;
}

// 保存指令
export function saveCommands(commands: CommandItem[]): void {
  try {
    localStorage.setItem(COMMANDS_STORAGE_KEY, JSON.stringify(commands));
  } catch (error) {
    console.error('Failed to save commands:', error);
  }
}

// 根据分类获取指令
export function getCommandsByCategory(category: 'personal' | 'public'): CommandItem[] {
  return getCommands().filter(cmd => cmd.category === category);
}

// 获取指令的todoList用于LLM
export function getCommandTodoList(commandId: string): string | null {
  const commands = getCommands();
  const command = commands.find(cmd => cmd.id === commandId);
  return command ? command.todoList : null;
}
