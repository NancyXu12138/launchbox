// Todo执行服务 - 真实调用动作库工具

import { SimpleTodoList, SimpleTodoItem } from '../components/BottomTodoPanel';
import { selectBestAction, getActionById } from '../../shared/action-library';
import type { ActionDefinition } from '../../shared/action-types';
import { executeAction, ActionExecutionResult } from './actionExecutor';
import { backendApiService } from './backendApiService';
import { searchKnowledgeBase } from './knowledgeBase';
import { performContextualReasoning, ReasoningResult } from './contextualReasoning';

// Todo步骤执行结果
export interface TodoStepResult {
  success: boolean;
  stepId: string;
  stepText: string;
  actionUsed?: ActionDefinition;
  executionResult?: ActionExecutionResult;
  error?: string;
  executionTime: number;
  reasoning?: ReasoningResult; // 添加推理结果
  waitingForContext?: boolean; // 是否在等待上下文信息
}

// Todo执行器类
export class TodoExecutor {
  private todoList: SimpleTodoList;
  private onProgress: (result: TodoStepResult) => void;
  private onComplete: (allResults: TodoStepResult[]) => void;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private results: TodoStepResult[] = [];
  private userOriginalInput: string = ''; // 🆕 存储用户的原始输入，用于参数提取

  constructor(
    todoList: SimpleTodoList,
    onProgress: (result: TodoStepResult) => void,
    onComplete: (allResults: TodoStepResult[]) => void,
    userInput?: string  // 🆕 可选的用户输入参数
  ) {
    this.todoList = todoList;
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.userOriginalInput = userInput || '';
    console.log('🏗️ TodoExecutor构造函数，用户输入:', this.userOriginalInput);
  }

  // 辅助方法：调用后端API获取LLM响应
  private async callLLM(prompt: string, maxTokens: number = 2000): Promise<string> {
    const messages = [{ role: 'user' as const, content: prompt }];
    const response = await backendApiService.getChatCompletion(messages, 0.7, maxTokens);
    
    if (!response.success || !response.content) {
      throw new Error(response.error || '后端API调用失败');
    }
    
    return response.content;
  }

  // 开始执行Todo列表
  async start(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.results = [];

    // 按顺序执行每个步骤
    for (const item of this.todoList.items) {
      if (this.isPaused) break;
      
      const result = await this.executeStep(item);
      this.results.push(result);
      this.onProgress(result);
      
      // 如果遇到需要用户输入的步骤，暂停执行
      if (!result.success && result.error === 'WAITING_FOR_USER_INPUT') {
        console.log('遇到用户输入任务，暂停执行器:', { stepId: result.stepId, stepText: result.stepText });
        this.isPaused = true;
        break;
      }
      
      // 如果等待上下文信息，暂停执行
      if (!result.success && result.error === 'WAITING_FOR_CONTEXT') {
        console.log('🧠 LLM任务等待上下文信息，暂停执行器:', { 
          stepId: result.stepId, 
          stepText: result.stepText,
          missingInfo: result.reasoning?.waitingForData,
          reasoning: result.reasoning?.reasoning 
        });
        this.isPaused = true;
        break;
      }
      
      // 如果执行失败（非等待状态），暂停执行等待用户决定
      if (!result.success && 
          result.error !== 'WAITING_FOR_USER_INPUT' && 
          result.error !== 'WAITING_FOR_CONTEXT') {
        console.log('任务执行失败，暂停执行器等待用户决定:', { stepId: result.stepId, stepText: result.stepText, error: result.error });
        this.isPaused = true;
        break;
      }
    }

    // 只有在没有暂停且所有任务都成功完成的情况下才标记为完成
    const allCompleted = this.todoList.items.every(item => 
      this.results.some(r => r.stepId === item.id && r.success)
    );
    
    if (!this.isPaused && allCompleted) {
      this.isRunning = false;
      this.onComplete(this.results);
    }
  }

  // 暂停执行
  pause(): void {
    this.isPaused = true;
  }

  // 强制继续执行（忽略上下文缺失）
  async forceNextStep(): Promise<void> {
    if (!this.isPaused) return;
    
    const currentIndex = this.results.length;
    if (currentIndex >= this.todoList.items.length) return;
    
    const currentStep = this.todoList.items[currentIndex];
    
    // 如果当前步骤是等待上下文的LLM任务，尝试使用基础模式执行
    if (currentStep.taskType === 'llm') {
      console.log('🔄 强制执行LLM任务（基础模式）');
      const result = await this.executeLLMTaskBasic(currentStep, Date.now());
      this.results.push(result);
      this.onProgress(result);
    }
    
    // 继续执行后续步骤
    this.isPaused = false;
    await this.start();
  }

  // 基础LLM任务执行（不进行上下文推理）
  private async executeLLMTaskBasic(step: SimpleTodoItem, startTime: number): Promise<TodoStepResult> {
    try {
      // 简单的知识库搜索
      const knowledgeResults = await searchKnowledgeBase(step.text, 3);
      
      let context = '';
      if (knowledgeResults.length > 0) {
        context = '\n\n相关知识库信息：\n' + 
          knowledgeResults.map(r => `- ${r.content}`).join('\n');
      }

      const prompt = `请完成以下任务：${step.text}${context}

要求：
- 提供详细和有用的回答
- 如果是分析任务，请给出具体的分析结果
- 如果是生成任务，请生成完整的内容
- 保持回答的专业性和准确性
- 如果需要前置信息但未提供，请明确说明需要什么信息`;
      
      const response = await this.callLLM(prompt, 2000);

      const executionResult = {
        success: true,
        result: {
          task: step.text,
          response: response.trim(),
          method: 'LLM处理(基础模式)',
          knowledgeUsed: knowledgeResults.length > 0,
          knowledgeCount: knowledgeResults.length,
          llmResponse: response.trim(),
          isLLMTask: true,
          forcedExecution: true // 标记为强制执行
        },
        executionTime: Date.now() - startTime
      };

      return {
        success: true,
        stepId: step.id,
        stepText: step.text,
        executionResult,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        stepId: step.id,
        stepText: step.text,
        error: (error as Error).message,
        executionTime: Date.now() - startTime
      };
    }
  }

  // 恢复执行
  resume(): void {
    this.isPaused = false;
    this.isRunning = true; // 重新设置为运行状态
    
    // 继续执行剩余的步骤
    this.continueExecution().catch(error => {
      console.error('继续执行Todo失败:', error);
    });
  }
  
  // 继续执行剩余步骤
  private async continueExecution(): Promise<void> {
    console.log('continueExecution 被调用', { isPaused: this.isPaused, isRunning: this.isRunning });
    
    if (this.isPaused || !this.isRunning) {
      console.log('执行被暂停或未运行，退出');
      return;
    }
    
    // 找到下一个未完成的步骤
    const completedStepIds = this.results.filter(r => r.success).map(r => r.stepId);
    const remainingSteps = this.todoList.items.filter(item => !completedStepIds.includes(item.id));
    
    console.log('继续执行状态:', { 
      completedStepIds, 
      remainingSteps: remainingSteps.map(s => ({ id: s.id, text: s.text })),
      totalResults: this.results.length 
    });
    
    for (const step of remainingSteps) {
      if (this.isPaused) break;
      
      const result = await this.executeStep(step);
      this.results.push(result);
      this.onProgress(result);
      
      // 如果遇到需要用户输入的步骤，暂停执行
      if (!result.success && result.error === 'WAITING_FOR_USER_INPUT') {
        this.isPaused = true;
        break;
      }
      
      // 如果执行失败（非用户输入等待），暂停执行等待用户决定
      if (!result.success && result.error !== 'WAITING_FOR_USER_INPUT') {
        console.log('continueExecution: 任务执行失败，暂停执行器:', { stepId: result.stepId, stepText: result.stepText, error: result.error });
        this.isPaused = true;
        break;
      }
    }
    
    // 检查是否所有步骤都完成了
    const allCompleted = this.todoList.items.every(item => 
      this.results.some(r => r.stepId === item.id && r.success)
    );

    // 检查是否所有步骤都完成了
    if (allCompleted) {
      this.isRunning = false;
      this.onComplete(this.results);
    } else if (this.isPaused) {
      // 如果暂停了但还有未完成的步骤，保持运行状态但不调用完成回调
      console.log('执行暂停，等待用户输入');
    }
  }

  // 处理用户输入响应
  async handleUserInput(stepId: string, userResponse: string): Promise<void> {
    console.log('TodoExecutor.handleUserInput 被调用:', { stepId, userResponse });
    
    // 找到对应的步骤
    const stepIndex = this.todoList.items.findIndex(item => item.id === stepId);
    if (stepIndex === -1) {
      console.error('未找到对应的步骤:', { stepId, availableSteps: this.todoList.items.map(i => i.id) });
      return;
    }

    const step = this.todoList.items[stepIndex];
    console.log('找到对应的步骤:', step);
    
    try {
      // 使用LLM判断用户回复是否满足要求并提取有用信息
      console.log('开始验证用户回复...');
      const validationResult = await this.validateUserResponse(step, userResponse);
      console.log('验证结果:', validationResult);
      
      if (!validationResult.isValid) {
        console.log('用户回复不满足要求，生成追问');
        // 如果不满足要求，生成新的询问
        const followUpResult: TodoStepResult = {
          success: false,
          stepId: step.id,
          stepText: step.text,
          executionResult: {
            success: true,
            result: {
              task: step.text,
              askMessage: validationResult.followUpQuestion,
              method: '用户输入询问',
              waitingForInput: true,
              partialSuccess: true,
              previousResponse: userResponse
            },
            executionTime: validationResult.processingTime
          },
          error: 'WAITING_FOR_USER_INPUT',
          executionTime: validationResult.processingTime
        };
        
        this.onProgress(followUpResult);
        return;
      }
      
      // 如果满足要求，创建成功的执行结果
      console.log('用户回复满足要求，创建成功结果');
      const result: TodoStepResult = {
        success: true,
        stepId: step.id,
        stepText: step.text,
        executionResult: {
          success: true,
          result: {
            task: step.text,
            userInput: userResponse,
            extractedInfo: validationResult.extractedInfo,
            method: '用户输入',
            prompt: step.userPrompt || step.text
          },
          executionTime: validationResult.processingTime
        },
        executionTime: validationResult.processingTime
      };

      // 记录结果并继续执行
      console.log('记录结果并触发进度回调');
      this.results.push(result);
      this.onProgress(result);

      // 继续执行后续步骤
      console.log('调用resume继续执行');
      this.resume();

    } catch (error) {
      // 如果LLM验证失败，降级处理：直接接受用户输入
      const result: TodoStepResult = {
        success: true,
        stepId: step.id,
        stepText: step.text,
        executionResult: {
          success: true,
          result: {
            task: step.text,
            userInput: userResponse,
            method: '用户输入',
            prompt: step.userPrompt || step.text,
            note: 'LLM验证失败，直接接受用户输入'
          },
          executionTime: 100
        },
        executionTime: 100
      };

      this.results.push(result);
      this.onProgress(result);
      this.resume();
    }
  }
  
  // 验证用户回复是否满足要求
  private async validateUserResponse(step: SimpleTodoItem, userResponse: string): Promise<{
    isValid: boolean;
    extractedInfo?: any;
    followUpQuestion?: string;
    processingTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      const prompt = `你是一个智能助手，需要验证用户的回复是否满足任务要求。

任务步骤: ${step.text}
原始询问: ${step.userPrompt || step.text}
用户回复: "${userResponse}"

请分析用户的回复：
1. 是否提供了所需的信息？
2. 信息是否足够完整和准确？
3. 如果不满足要求，应该如何进一步询问？

请以JSON格式回复：
{
  "isValid": true/false,
  "extractedInfo": "提取的有用信息（如果有效）",
  "followUpQuestion": "进一步询问的问题（如果无效）",
  "reason": "判断理由"
}

要求：
- 如果用户提供了基本信息（如生日、年龄、偏好等），通常应该接受
- 只有在信息明显不完整或不相关时才要求补充
- followUpQuestion应该友好、具体，指出需要什么信息`;

      const response = await this.callLLM(prompt, 2000);

      // 解析LLM响应
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isValid: parsed.isValid,
          extractedInfo: parsed.extractedInfo,
          followUpQuestion: parsed.followUpQuestion,
          processingTime: Date.now() - startTime
        };
      }
      
      // 如果解析失败，默认接受用户输入
      return {
        isValid: true,
        extractedInfo: userResponse,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('用户回复验证失败:', error);
      // 降级处理：默认接受用户输入
      return {
        isValid: true,
        extractedInfo: userResponse,
        processingTime: Date.now() - startTime
      };
    }
  }

  // 执行单个步骤
  private async executeStep(step: SimpleTodoItem): Promise<TodoStepResult> {
    const startTime = Date.now();
    
    try {
      // 根据任务类型选择执行方式
      switch (step.taskType) {
        case 'action':
          return await this.executeActionTask(step, startTime);
        case 'llm':
          return await this.executeLLMTask(step, startTime);
        case 'user_input':
          return await this.executeUserInputTask(step, startTime);
        default:
          throw new Error(`不支持的任务类型: ${step.taskType}`);
      }

    } catch (error) {
      return {
        success: false,
        stepId: step.id,
        stepText: step.text,
        error: (error as Error).message,
        executionTime: Date.now() - startTime
      };
    }
  }

  // 执行动作库任务
  private async executeActionTask(step: SimpleTodoItem, startTime: number): Promise<TodoStepResult> {
    console.log('📍 开始执行动作库任务:', step.text);
    
    // 1. 分析步骤文本，选择合适的动作
    const action = await this.selectActionForStep(step.text);
    
    if (!action) {
      console.log('⚠️ 无法匹配到具体工具，将使用LLM处理');
      // 改为使用LLM处理，而不是抛出错误
      return await this.executeWithLLM(step, startTime);
    }

    console.log('✅ 匹配到动作:', action.name, `类型: ${action.type}`);

    // 2. 根据动作类型执行（使用英文类型匹配）
    switch (action.type) {
      case 'code_execution':
        return await this.executeCodeAction(step, action, startTime);
      case 'api_call':
        return await this.executeApiAction(step, action, startTime);
      case 'llm_task':
        return await this.executePromptAction(step, action, startTime);
      case 'image_generation':
        return await this.executeImageGenerationAction(step, action, startTime);
      default:
        console.log(`⚠️ 不支持的动作类型: ${action.type}，使用LLM处理`);
        return await this.executeWithLLM(step, startTime);
    }
  }

  // 执行LLM任务
  private async executeLLMTask(step: SimpleTodoItem, startTime: number): Promise<TodoStepResult> {
    try {
      console.log('🧠 开始上下文推理分析...');
      
      // 使用简化的推理系统
      const reasoningResult = await performContextualReasoning(
        step,
        this.results, // 前面步骤的执行结果
        this.todoList,
        this.userOriginalInput // 🆕 传入用户原始输入
      );

      console.log('✅ 推理完成，shouldProceed:', reasoningResult.shouldProceed);

      // 简化判断：总是继续执行
      if (!reasoningResult.shouldProceed) {
        console.log('⚠️ 推理建议等待，但强制继续执行');
      }

      console.log('🔍 搜索知识库...');
      // 搜索知识库获取额外上下文
      const knowledgeResults = await searchKnowledgeBase(step.text, 3);
      console.log('✅ 知识库搜索完成，找到', knowledgeResults.length, '个结果');
      
      console.log('🔍 构建增强提示词...');
      // 构建增强的提示词
      let enhancedPrompt = reasoningResult.contextualInfo.enhancedPrompt;
      
      // 添加知识库信息
      if (knowledgeResults.length > 0) {
        enhancedPrompt += '\n\n相关知识库信息：\n' + 
          knowledgeResults.map(r => `- ${r.content}`).join('\n');
      }
      console.log('✅ 增强提示词构建完成，长度:', enhancedPrompt.length);

      console.log('🚀 执行LLM任务...');
      console.log('📥 开始接收LLM响应...');
      const response = await this.callLLM(enhancedPrompt, 2000);
      console.log('✅ LLM响应完成，长度:', response.length);

      const executionResult = {
        success: true,
        result: {
          task: step.text,
          response: response.trim(),
          method: 'LLM处理(上下文增强)',
          knowledgeUsed: knowledgeResults.length > 0,
          knowledgeCount: knowledgeResults.length,
          llmResponse: response.trim(),
          isLLMTask: true,
          contextUsed: reasoningResult.contextualInfo.relevantData.length > 0,
          reasoningApplied: true, // 标记已应用推理
          enhancedPrompt: enhancedPrompt // 保存使用的增强提示词
        },
        executionTime: Date.now() - startTime
      };

      return {
        success: true,
        stepId: step.id,
        stepText: step.text,
        executionResult,
        executionTime: Date.now() - startTime,
        reasoning: reasoningResult
      };


    } catch (error) {
      console.error('LLM任务执行失败:', error);
      return {
        success: false,
        stepId: step.id,
        stepText: step.text,
        error: (error as Error).message,
        executionTime: Date.now() - startTime
      };
    }
  }

  // 执行用户输入任务
  private async executeUserInputTask(step: SimpleTodoItem, startTime: number): Promise<TodoStepResult> {
    try {
      // 使用LLM生成友好的询问消息
      const userPrompt = step.userPrompt || `请提供以下信息：${step.text}`;
      
      const prompt = `你是一个智能助手。现在需要向用户询问信息以继续执行任务。

任务步骤: ${step.text}
需要询问: ${userPrompt}

请生成一个友好、简洁的询问消息，向用户说明需要什么信息。要求：
- 使用简短、清晰的语言
- 说明为什么需要这个信息
- 保持友好和专业的语调
- 不超过50字`;

      const response = await this.callLLM(prompt, 2000);

      // 返回部分成功结果，包含询问消息
      return {
        success: false, // 标记为未完全成功，需要用户回应
        stepId: step.id,
        stepText: step.text,
        executionResult: {
          success: true,
          result: {
            task: step.text,
            askMessage: response.trim(),
            method: '用户输入询问',
            prompt: userPrompt,
            waitingForInput: true,
            partialSuccess: true // 标记为部分成功
          },
          executionTime: Date.now() - startTime
        },
        error: 'WAITING_FOR_USER_INPUT', // 保持等待用户输入的标记
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      // 如果LLM调用失败，使用默认询问
      const fallbackMessage = step.userPrompt || `请提供以下信息：${step.text}`;
      
      return {
        success: false, // 标记为未完全成功，需要用户回应
        stepId: step.id,
        stepText: step.text,
        executionResult: {
          success: true,
          result: {
            task: step.text,
            askMessage: fallbackMessage,
            method: '用户输入询问',
            waitingForInput: true,
            partialSuccess: true // 标记为部分成功
          },
          executionTime: Date.now() - startTime
        },
        error: 'WAITING_FOR_USER_INPUT', // 保持等待用户输入的标记
        executionTime: Date.now() - startTime
      };
    }
  }

  // 选择适合步骤的动作
  private async selectActionForStep(stepText: string): Promise<ActionDefinition | null> {
    // 首先尝试基于关键词的快速匹配
    const quickMatch = selectBestAction(stepText);
    if (quickMatch) {
      return quickMatch;
    }

    // 如果快速匹配失败，使用LLM进行智能匹配
    return await this.selectActionWithLLM(stepText);
  }

  // 使用LLM选择动作
  private async selectActionWithLLM(stepText: string): Promise<ActionDefinition | null> {
    try {
      console.log('🤖 使用LLM智能选择Action...');
      
      const prompt = `你是一个任务分析专家。分析任务步骤，从以下工具ID中选择最合适的：

【可用工具ID及其功能】
- calculator: 数学计算（加减乘除、函数运算）
- text_processor: 文本处理（字数统计、大小写转换）
- json_processor: JSON处理（格式化、验证）
- datetime_processor: 时间处理（获取时间、格式化）
- google_search: 搜索（竞品资讯）
- sentiment_analysis: 情感分析（分析评论）
- game_classification: 游戏分类（生成标签）
- gpt_image_gen: 图像生成（创建图像）

【任务步骤】: "${stepText}"

【匹配规则】
1. 包含"计算"、"数学"、"表达式" → calculator
2. 包含"文本"、"字数"、"统计字" → text_processor
3. 包含"JSON"、"json"、"数据格式" → json_processor
4. 包含"时间"、"日期"、"当前时间" → datetime_processor
5. 包含"搜索"、"查找"、"竞品" → google_search
6. 包含"情感"、"评论分析" → sentiment_analysis
7. 包含"游戏分类"、"标签"、"游戏类型" → game_classification
8. 包含"生图"、"图像"、"画" → gpt_image_gen
9. 如果步骤需要"分析"、"总结"、"生成报告"但不涉及具体工具 → 回答"llm"
10. 完全不确定 → 回答"llm"

只回答工具ID（如calculator）或"llm"，不要其他内容。`;

      const response = await this.callLLM(prompt, 500);
      const actionId = response.trim().toLowerCase();
      
      console.log('🎯 LLM选择结果:', actionId);
      
      // 如果是llm，返回null让后续用LLM处理
      if (actionId === 'llm' || actionId === 'unknown' || actionId === '0') {
        console.log('📝 将使用LLM直接处理此步骤');
        return null;
      }
      
      // 尝试获取action
      const action = getActionById(actionId);
      if (action) {
        console.log('✅ 成功匹配Action:', action.name, `(${action.id})`);
        return action;
      }
      
      console.log('⚠️ 未找到匹配的Action，将使用LLM处理');
      return null;

    } catch (error) {
      console.error('❌ LLM动作选择失败:', error);
      return null;
    }
  }

  // 执行代码动作
  private async executeCodeAction(
    step: SimpleTodoItem, 
    action: ActionDefinition, 
    startTime: number
  ): Promise<TodoStepResult> {
    // 使用LLM提取执行参数
    const params = await this.extractExecutionParams(step.text, action);
    
    // 执行代码动作
    const executionResult = executeAction(action.name, params.input, params.params);
    
    return {
      success: executionResult.success,
      stepId: step.id,
      stepText: step.text,
      actionUsed: action,
      executionResult,
      error: executionResult.error,
      executionTime: Date.now() - startTime
    };
  }

  // 执行API动作
  private async executeApiAction(
    step: SimpleTodoItem, 
    action: ActionDefinition, 
    startTime: number
  ): Promise<TodoStepResult> {
    // 模拟API调用（实际项目中需要真实的API调用）
    const mockResult: ActionExecutionResult = {
      success: true,
      result: {
        action: action.name,
        step: step.text,
        data: `模拟${action.name}的执行结果`,
        timestamp: new Date().toISOString()
      },
      executionTime: Math.random() * 1000 + 500 // 模拟500-1500ms的执行时间
    };

    return {
      success: true,
      stepId: step.id,
      stepText: step.text,
      actionUsed: action,
      executionResult: mockResult,
      executionTime: Date.now() - startTime
    };
  }

  // 执行提示工程动作
  private async executePromptAction(
    step: SimpleTodoItem, 
    action: ActionDefinition, 
    startTime: number
  ): Promise<TodoStepResult> {
    try {
      // 智能提取参数
      const params = await this.extractExecutionParams(step.text, action);
      const inputText = params.input;
      
      // 构建提示词
      let prompt = '';
      if (action.id === 'sentiment_analysis') {
        prompt = `请分析以下文本的情感倾向，回答"正面"、"负面"或"中性"：\n\n"${inputText}"`;
      } else if (action.id === 'game_classification') {
        prompt = `请为以下游戏描述分类游戏类型标签（如动作、RPG、策略等）：\n\n"${inputText}"`;
      } else {
        prompt = `请处理以下任务：${inputText}`;
      }

      // 调用LLM
      const response = await this.callLLM(prompt, 2000);

      const executionResult: ActionExecutionResult = {
        success: true,
        result: {
          prompt: prompt,
          response: response.trim(),
          action: action.name,
          input: inputText
        },
        executionTime: Date.now() - startTime
      };

      return {
        success: true,
        stepId: step.id,
        stepText: step.text,
        actionUsed: action,
        executionResult,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        stepId: step.id,
        stepText: step.text,
        actionUsed: action,
        error: (error as Error).message,
        executionTime: Date.now() - startTime
      };
    }
  }

  // 🆕 执行图像生成动作
  private async executeImageGenerationAction(
    step: SimpleTodoItem,
    action: ActionDefinition,
    startTime: number
  ): Promise<TodoStepResult> {
    try {
      console.log('🎨 执行图像生成任务...');
      
      // 智能提取图像描述prompt
      const params = await this.extractExecutionParams(step.text, action);
      const imagePrompt = params.input;
      
      console.log('🖼️ 图像生成prompt:', imagePrompt);

      // 模拟图像生成（实际应该调用后端API）
      const executionResult: ActionExecutionResult = {
        success: true,
        result: {
          prompt: imagePrompt,
          message: '图像生成功能需要在实际环境中调用GPT Image API',
          action: action.name
        },
        executionTime: Date.now() - startTime
      };

      return {
        success: true,
        stepId: step.id,
        stepText: step.text,
        actionUsed: action,
        executionResult,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        stepId: step.id,
        stepText: step.text,
        actionUsed: action,
        error: (error as Error).message,
        executionTime: Date.now() - startTime
      };
    }
  }

  // 使用LLM执行（当没有匹配的动作时）
  private async executeWithLLM(step: SimpleTodoItem, startTime: number): Promise<TodoStepResult> {
    try {
      console.log('📝 使用LLM处理步骤:', step.text);
      
      // 🆕 构建前置结果上下文（完整的数据传递）
      let previousContext = '';
      if (this.results.length > 0) {
        previousContext = '\n\n【前置步骤的执行结果】\n';
        this.results.forEach((r, i) => {
          const resultData = r.executionResult?.result;
          previousContext += `\n步骤${i + 1}: ${r.stepText}\n`;
          
          if (resultData) {
            if (typeof resultData === 'object') {
              // 提取关键字段
              if ('result' in resultData) {
                previousContext += `结果: ${resultData.result}\n`;
              } else if ('response' in resultData) {
                previousContext += `结果: ${resultData.response}\n`;
              } else if ('answer' in resultData) {
                previousContext += `结果: ${resultData.answer}\n`;
              } else if ('data' in resultData) {
                previousContext += `结果: ${JSON.stringify(resultData.data)}\n`;
              } else {
                previousContext += `结果: ${JSON.stringify(resultData)}\n`;
              }
            } else {
              previousContext += `结果: ${resultData}\n`;
            }
          }
        });
      }
      
      // 🆕 构建用户输入上下文
      const userContext = this.userOriginalInput ? 
        `\n\n【用户的原始请求】\n${this.userOriginalInput}` : '';
      
      // 搜索知识库
      const knowledgeResults = await searchKnowledgeBase(step.text, 3);
      let knowledgeContext = '';
      if (knowledgeResults.length > 0) {
        knowledgeContext = '\n\n【相关知识库信息】\n' + 
          knowledgeResults.map(r => `- ${r.content}`).join('\n');
      }

      // 🆕 构建完整的增强提示词
      const prompt = `你是一个智能助手，正在执行多步骤任务的其中一步。

【当前任务】
${step.text}${userContext}${previousContext}${knowledgeContext}

【重要提示】
1. 如果前置步骤提供了数据，请务必使用这些真实数据
2. 如果用户原始请求包含了所需信息，请从中提取
3. 不要编造或假设数据，只使用已提供的真实信息
4. 如果需要提取信息，请从用户原始请求或前置步骤结果中提取
5. 如果是生成报告/总结，请基于前置步骤的真实结果
6. 【格式要求】使用纯文本和自然语言回答，不要使用LaTeX格式（如\\times、\\frac、\\approx等）
7. 【格式要求】数学符号使用：乘号用×或*，除号用÷或/，约等于用≈，分数直接写如"1232÷890"
8. 【格式要求】如果提取数学表达式，保持原样，不要修改运算符

请完成当前任务：`;
      
      console.log('📋 LLM提示词长度:', prompt.length);
      
      const response = await this.callLLM(prompt, 2000);

      const executionResult: ActionExecutionResult = {
        success: true,
        result: {
          task: step.text,
          response: response.trim(),
          method: 'LLM智能处理',
          knowledgeUsed: knowledgeResults.length > 0,
          usedPreviousResults: this.results.length > 0,
          usedUserInput: !!this.userOriginalInput
        },
        executionTime: Date.now() - startTime
      };

      return {
        success: true,
        stepId: step.id,
        stepText: step.text,
        executionResult,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ LLM执行失败:', error);
      return {
        success: false,
        stepId: step.id,
        stepText: step.text,
        error: (error as Error).message,
        executionTime: Date.now() - startTime
      };
    }
  }

  // 提取执行参数（智能版，支持从前置结果和用户输入中提取）
  private async extractExecutionParams(stepText: string, action: ActionDefinition): Promise<{ input: string; params?: any }> {
    try {
      console.log('🔍 智能提取参数...', { action: action.name, step: stepText });
      
      // 构建前置结果上下文
      let previousContext = '';
      if (this.results.length > 0) {
        previousContext = '\n\n【前置步骤结果】\n' + this.results.map((r, i) => {
          const resultData = r.executionResult?.result;
          let resultSummary = '';
          
          if (resultData) {
            if (typeof resultData === 'object') {
              // 提取关键字段
              if ('result' in resultData) resultSummary = String(resultData.result);
              else if ('response' in resultData) resultSummary = String(resultData.response);
              else if ('data' in resultData) resultSummary = String(resultData.data);
              else resultSummary = JSON.stringify(resultData).substring(0, 200);
            } else {
              resultSummary = String(resultData).substring(0, 200);
            }
          }
          
          return `步骤${i + 1}: ${r.stepText}\n结果: ${resultSummary}`;
        }).join('\n\n');
      }
      
      // 构建用户输入上下文
      const userContext = this.userOriginalInput ? `\n\n【用户原始输入】\n${this.userOriginalInput}` : '';
      
      const prompt = `你是参数提取专家。请从以下信息中提取工具所需的参数。

【当前任务】: ${stepText}
【使用工具】: ${action.name} (${action.id})${previousContext}${userContext}

【参数提取规则】
- calculator: 提取纯数学表达式（如 "8*8*9*123+567-1232/890"）
- text_processor: 提取要处理的文本内容
- json_processor: 提取JSON字符串
- datetime_processor: 提取时间信息或"now"表示当前时间
- google_search: 提取搜索关键词
- sentiment_analysis: 提取要分析的评论文本
- game_classification: 提取游戏描述文本
- gpt_image_gen: 提取图像描述prompt

【重要提示】
1. 优先从用户原始输入中提取
2. 如果用户输入中没有，再从前置步骤结果中提取
3. 只返回参数值本身，不要解释

请以JSON格式回答：
{
  "value": "提取的参数值"
}`;

      const response = await this.callLLM(prompt, 1000);
      
      // 尝试解析JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const value = parsed.value || stepText;
        console.log('✅ 参数提取成功:', value);
        return { input: value, params: {} };
      }
      
      // 如果无法解析JSON，直接使用响应
      const trimmed = response.trim();
      console.log('⚠️ JSON解析失败，使用原始响应:', trimmed);
      return { input: trimmed || stepText, params: {} };

    } catch (error) {
      console.error('❌ 参数提取失败:', error);
      return { input: stepText, params: {} };
    }
  }
}

// 创建Todo执行器
export function createTodoExecutor(
  todoList: SimpleTodoList,
  onProgress: (result: TodoStepResult) => void,
  onComplete: (allResults: TodoStepResult[]) => void,
  userInput?: string  // 🆕 用户原始输入
): TodoExecutor {
  return new TodoExecutor(todoList, onProgress, onComplete, userInput);
}
