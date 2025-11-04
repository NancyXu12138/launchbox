/**
 * 模型配置管理器
 * 根据不同场景选择最合适的模型，优化成本和性能
 */

export interface ModelConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  description?: string;
}

/**
 * 场景化模型配置
 * 基于 compass key 支持的模型列表
 */
export const MODEL_CONFIG = {
  // 意图分类 - 使用 nano 模型（快速+便宜）
  intent_classification: {
    model: 'gpt-4.1-nano',
    temperature: 0.3,
    max_tokens: 500,
    description: '快速意图识别，低成本高效率'
  },
  
  // 普通对话 - 使用 mini 模型（平衡性能和成本）
  general_chat: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 2000,
    description: '日常对话，平衡性能'
  },
  
  // 复杂推理 - 使用 o4-mini（最强推理能力）
  complex_reasoning: {
    model: 'o4-mini',
    temperature: 0.5,
    max_tokens: 4000,
    description: '复杂问题推理，深度思考'
  },
  
  // 工作流规划 - 使用 gpt-4.1
  workflow_planning: {
    model: 'gpt-4.1',
    temperature: 0.4,
    max_tokens: 3000,
    description: '工作流编排和任务规划'
  },
  
  // 活动策划 - 使用 gpt-5（最详细最全面）
  event_planning: {
    model: 'gpt-5',
    temperature: 0.7,
    max_tokens: 16000,
    description: '活动策划详细方案生成'
  },
  
  // Todo生成 - 使用 gpt-4o-mini
  todo_generation: {
    model: 'gpt-4o-mini',
    temperature: 0.4,
    max_tokens: 2000,
    description: '任务步骤拆解'
  }
} as const;

export type TaskType = keyof typeof MODEL_CONFIG;

/**
 * 根据任务类型选择最佳模型配置
 */
export function selectModelForTask(task: TaskType): ModelConfig {
  return MODEL_CONFIG[task] || MODEL_CONFIG.general_chat;
}

/**
 * 获取所有可用模型列表
 */
export function getAvailableModels(): string[] {
  return [
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-5-chat-latest',
    'gpt-4.1',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
    'gpt-4o',
    'gpt-4o-mini',
    'o4-mini'
  ];
}

/**
 * 验证模型是否可用
 */
export function isModelAvailable(model: string): boolean {
  return getAvailableModels().includes(model);
}

export default {
  MODEL_CONFIG,
  selectModelForTask,
  getAvailableModels,
  isModelAvailable
};

