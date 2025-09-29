export type CommandItem = {
  id: string;
  name: string;
  description: string;
  todoList: string; // 文本形式的todolist
  category: 'personal' | 'public'; // 指令分类
  enabled: boolean; // 启用状态
};

const COMMANDS_STORAGE_KEY = 'launchbox_commands_v1';

// 默认指令数据
const DEFAULT_COMMANDS: CommandItem[] = [
  {
    id: '1',
    name: '竞品分析报告',
    description: '输入竞品游戏名称，输出完整的竞品分析报告和团队通知',
    todoList: `1. 搜索竞品游戏的最新资讯和数据
2. 分析竞品的核心玩法和特色功能
3. 收集用户对竞品的评价和反馈
4. 对比我们产品与竞品的优劣势
5. 生成详细的竞品分析报告
6. 将分析结果发送给团队成员`,
    category: 'personal',
    enabled: true
  },
  {
    id: '2', 
    name: '数据同步流程',
    description: '自动获取游戏数据并同步到分析表格，完成后发送更新通知',
    todoList: `1. 从Steam API获取最新的游戏数据
2. 清理和格式化获取的数据
3. 将数据写入到Google Sheets分析表格
4. 验证数据同步的完整性和准确性
5. 生成数据同步报告
6. 发送更新通知给相关人员`,
    category: 'personal',
    enabled: true
  },
  {
    id: '3',
    name: '用户反馈处理',
    description: '收集和分析用户反馈，生成改进建议',
    todoList: `1. 收集各渠道的用户反馈信息
2. 对反馈进行分类和优先级排序
3. 分析反馈中的共性问题
4. 生成问题解决方案
5. 制定产品改进计划
6. 跟进反馈处理结果`,
    category: 'public',
    enabled: true
  },
  {
    id: '4',
    name: '市场调研分析',
    description: '进行市场调研并生成分析报告',
    todoList: `1. 确定调研目标和范围
2. 设计调研问卷和方案
3. 收集市场数据和用户信息
4. 分析市场趋势和用户需求
5. 生成市场调研报告
6. 提出市场策略建议`,
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
