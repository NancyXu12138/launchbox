/**
 * 统一的 Action 类型定义
 * 供前后端共享，确保数据结构一致
 * 
 * 设计原则：
 * 1. 每个 Action 都有唯一的 ID 和类型
 * 2. 支持多种执行方式：API调用、代码执行、LLM任务等
 * 3. 参数结构化，便于验证和序列化
 */

/**
 * Action 类型枚举
 * 定义了系统支持的所有 Action 类型
 */
export type ActionType = 
  | 'api_call'          // API 调用（如搜索、数据读取）
  | 'code_execution'    // 代码执行（如计算器、文本处理）
  | 'llm_task'          // LLM 任务（如情感分析、分类）
  | 'image_generation'  // 图像生成
  | 'workflow'          // 工作流（复合任务）
  | 'clarify';          // 信息收集（表单填写）

/**
 * Action 状态
 */
export type ActionStatus = 'enabled' | 'disabled' | 'beta';

/**
 * Action 参数定义
 * 用于定义 Action 需要的输入参数
 */
export interface ActionParameter {
  name: string;           // 参数名
  label: string;          // 显示标签
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
  required: boolean;      // 是否必填
  defaultValue?: any;     // 默认值
  options?: Array<{       // 如果是 select 类型
    value: string;
    label: string;
  }>;
  description?: string;   // 参数说明
}

/**
 * API 调用配置
 */
export interface ApiCallConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  headers?: Record<string, string>;
  authentication?: {
    type: 'API_KEY' | 'BEARER' | 'OAUTH';
    keyName?: string;
    location?: 'header' | 'query';
  };
}

/**
 * 代码执行配置
 */
export interface CodeExecutionConfig {
  language: 'python' | 'javascript' | 'shell';
  code?: string;          // 代码模板
  safeMode: boolean;      // 是否启用安全模式
}

/**
 * LLM 任务配置
 */
export interface LLMTaskConfig {
  systemPrompt: string;   // 系统提示词
  temperature: number;    // 温度参数
  maxTokens: number;      // 最大 token 数
  model?: string;         // 指定模型（可选）
}

/**
 * 图像生成配置
 */
export interface ImageGenConfig {
  model: string;          // 模型名称
  defaultSize: string;    // 默认尺寸
  supportedSizes: string[];
}

/**
 * Clarify 表单配置
 */
export interface ClarifyConfig {
  fields: ActionParameter[];
  submitLabel?: string;
}

/**
 * 统一的 Action 定义
 */
export interface ActionDefinition {
  // 基本信息
  id: string;                    // 唯一标识
  name: string;                  // Action 名称
  type: ActionType;              // Action 类型
  description: string;           // 描述
  status: ActionStatus;          // 状态
  
  // 参数定义
  parameters: ActionParameter[]; // 输入参数
  
  // 类型特定的配置（根据 type 选择其一）
  apiConfig?: ApiCallConfig;
  codeConfig?: CodeExecutionConfig;
  llmConfig?: LLMTaskConfig;
  imageConfig?: ImageGenConfig;
  clarifyConfig?: ClarifyConfig;
  
  // 元数据
  category?: string;             // 分类（用于前端展示）
  tags?: string[];               // 标签
  examples?: string[];           // 使用示例
  
  // 性能信息
  estimatedDuration?: number;    // 预计执行时长（毫秒）
  costEstimate?: string;         // 成本估算
}

/**
 * Action 执行请求
 */
export interface ActionExecutionRequest {
  actionId: string;
  actionName: string;
  actionType: ActionType;
  parameters: Record<string, any>;
}

/**
 * Action 执行结果
 */
export interface ActionExecutionResult {
  success: boolean;
  type?: string;
  data?: any;
  message?: string;
  error?: string;
  executionTime?: number;        // 实际执行时长（毫秒）
  
  // 交互式 Action 的特殊字段
  requiresInput?: boolean;       // 是否需要用户输入
  formConfig?: ClarifyConfig;    // 表单配置
  nextStep?: string;             // 下一步提示
}

/**
 * Action 库（所有可用的 Actions）
 */
export type ActionLibrary = ActionDefinition[];

