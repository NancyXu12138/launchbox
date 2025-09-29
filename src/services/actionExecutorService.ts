/**
 * Action执行服务
 * 调用后端API执行各种Action
 */

import { backendApiService } from './backendApiService';

export interface ActionExecutionRequest {
  action_id: string;
  action_name: string;
  action_type: string;
  parameters: Record<string, any>;
}

export interface ActionExecutionResult {
  success: boolean;
  type?: string;
  data?: any;
  message?: string;
  error?: string;
  requiresInput?: boolean;
  formConfig?: any;
  nextStep?: string;
}

export interface EventPlannerFormData {
  theme: string;
  overview: string;
  businessGoal: string;
  targetPlayer: string;
  targetRegion: string;
}

export interface EventPlannerState {
  step: 'form' | 'overview' | 'selection' | 'full_plan' | 'ui_mockup' | 'completed';
  formData?: EventPlannerFormData;
  generatedOverviews?: Array<{
    id: number;
    title: string;
    description: string;
    coreGameplay: string;
  }>;
  selectedPlan?: number;
  fullPlan?: string;
  uiMockupUrl?: string;
}

class ActionExecutorService {
  private readonly baseUrl: string;
  private eventPlannerStates: Map<string, EventPlannerState> = new Map();

  constructor() {
    this.baseUrl = 'http://localhost:8001'; // 后端API地址
  }

  /**
   * 执行Action
   */
  async executeAction(request: ActionExecutionRequest): Promise<ActionExecutionResult> {
    try {
      console.log('执行Action:', request);

      const response = await fetch(`${this.baseUrl}/api/execute-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('后端API错误响应:', response.status, errorText);
        return {
          success: false,
          error: `后端API请求失败: ${response.status} - ${errorText}`
        };
      }

      const result = await response.json();
      console.log('后端API响应:', result);

      return result;

    } catch (error) {
      console.error('执行Action时发生错误:', error);
      return {
        success: false,
        error: `执行Action失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 执行图像生成Action
   */
  async executeImageGeneration(prompt: string, width: number = 1536, height: number = 1024): Promise<ActionExecutionResult> {
    return this.executeAction({
      action_id: '4',
      action_name: 'GPT图像生成',
      action_type: '图像生成',
      parameters: {
        prompt,
        width,
        height
      }
    });
  }

  /**
   * 执行Event Planner - 开始流程
   */
  async startEventPlanner(sessionId: string): Promise<ActionExecutionResult> {
    // 初始化Event Planner状态
    this.eventPlannerStates.set(sessionId, {
      step: 'form'
    });

    return {
      success: true,
      type: 'event_planner_form',
      requiresInput: true,
      message: '请填写活动策划的基本信息',
      formConfig: {
        fields: [
          { name: 'theme', label: '活动主题', type: 'text', required: true },
          { name: 'overview', label: '活动概要', type: 'textarea', required: true },
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
          { name: 'targetRegion', label: '目标区域', type: 'text', required: true }
        ]
      }
    };
  }

  /**
   * 处理Event Planner表单提交
   */
  async submitEventPlannerForm(sessionId: string, formData: EventPlannerFormData): Promise<ActionExecutionResult> {
    const state = this.eventPlannerStates.get(sessionId);
    if (!state || state.step !== 'form') {
      return {
        success: false,
        error: 'Event Planner会话状态无效'
      };
    }

    // 更新状态
    state.formData = formData;
    state.step = 'overview';
    this.eventPlannerStates.set(sessionId, state);

    // 生成活动概览 - 使用前端逻辑而不是后端API
    const result = await this.generateEventOverviews(formData);

    if (result.success && result.data?.overviews) {
      state.generatedOverviews = result.data.overviews;
      state.step = 'selection';
      this.eventPlannerStates.set(sessionId, state);

      return {
        success: true,
        type: 'event_planner_selection',
        data: {
          overviews: result.data.overviews
        },
        message: '已生成3个活动方案，请选择您喜欢的方案或要求重新生成',
        requiresInput: true
      };
    }

    return result;
  }

  /**
   * 处理方案选择
   */
  async selectEventPlan(sessionId: string, selectedPlan: number | string): Promise<ActionExecutionResult> {
    const state = this.eventPlannerStates.get(sessionId);
    if (!state) {
      return {
        success: false,
        error: 'Event Planner会话状态无效'
      };
    }

    // 增加Agent化处理：理解用户的重新生成意图
    if (selectedPlan === 'regenerate' || 
        (typeof selectedPlan === 'string' && 
        (selectedPlan.includes('重新生成') || selectedPlan.includes('重新') || selectedPlan.includes('再生成')))) {
      // 重新生成方案 - 重置状态到form步骤
      state.step = 'form';
      state.generatedOverviews = undefined;
      state.selectedPlan = undefined;
      this.eventPlannerStates.set(sessionId, state);
      return this.submitEventPlannerForm(sessionId, state.formData!);
    }

    // 如果不是selection状态，但用户想选择方案，也支持处理
    if (state.step !== 'selection' && state.generatedOverviews) {
      state.step = 'selection';
      this.eventPlannerStates.set(sessionId, state);
    }

    if (state.step !== 'selection') {
      return {
        success: false,
        error: 'Event Planner会话状态无效'
      };
    }

    // 选择方案，生成完整策划案
    const planIndex = typeof selectedPlan === 'string' ? parseInt(selectedPlan) : selectedPlan;
    if (isNaN(planIndex) || planIndex < 0 || planIndex >= (state.generatedOverviews?.length || 0)) {
      return {
        success: false,
        error: '无效的方案选择，请选择 0、1、2 中的一个数字'
      };
    }

    state.selectedPlan = planIndex;
    state.step = 'full_plan';
    this.eventPlannerStates.set(sessionId, state);

    const result = await this.generateFullPlan(state.formData!, state.generatedOverviews![planIndex]);

    if (result.success) {
      state.fullPlan = result.data?.fullPlan;
      state.step = 'ui_mockup';
      this.eventPlannerStates.set(sessionId, state);

      // 先返回策划案，稍后异步生成UI
      return {
        success: true,
        type: 'event_planner_plan_ready',
        data: {
          fullPlan: result.data?.fullPlan,
          sessionId: sessionId // 传递sessionId用于后续生成UI
        },
        message: '活动策划案已完成，正在生成UI设计图...'
      };
    }

    return result;
  }

  /**
   * 异步生成UI Mockup（在策划案完成后调用）
   */
  async generateEventMockupAsync(sessionId: string): Promise<ActionExecutionResult> {
    console.log('🎨 异步生成UI设计图...');
    return await this.generateEventMockup(sessionId);
  }

  /**
   * 生成活动UI Mockup
   */
  async generateEventMockup(sessionId: string): Promise<ActionExecutionResult> {
    const state = this.eventPlannerStates.get(sessionId);
    if (!state || !state.formData) {
      return {
        success: false,
        error: 'Event Planner会话状态无效'
      };
    }

    try {
      console.log('🎨 开始生成UI原型图和设计图...');
      
      // 第一步：生成低保真原型图
      console.log('📐 步骤1: 生成低保真原型图');
      const wireframePrompt = this.buildWireframePrompt(state.formData);
      console.log('📐 原型图Prompt长度:', wireframePrompt.length);
      const wireframeResult = await this.generateSingleImage(wireframePrompt, '低保真原型图');
      console.log('📐 原型图生成结果:', wireframeResult.success ? '成功' : '失败', wireframeResult.error || '');
      
      // 第二步：通过构思LLM生成设计思路
      console.log('🤖 步骤2: 生成设计构思');
      const conceptPrompt = this.buildConceptPrompt(state.formData);
      console.log('🤖 构思Prompt长度:', conceptPrompt.length);
      const conceptResult = await this.getLLMResponse(conceptPrompt);
      console.log('🤖 构思生成结果长度:', conceptResult.length);
      
      // 第三步：基于构思生成高保真设计图
      console.log('🎨 步骤3: 生成高保真设计图');
      const designPrompt = this.buildDesignPrompt(conceptResult);
      console.log('🎨 设计图Prompt长度:', designPrompt.length);
      const designResult = await this.generateSingleImage(designPrompt, '高保真设计图');
      console.log('🎨 设计图生成结果:', designResult.success ? '成功' : '失败', designResult.error || '');

      // 更新状态
      state.step = 'completed';
      this.eventPlannerStates.set(sessionId, state);

      console.log('✅ UI生成流程完成:', {
        wireframe: wireframeResult.success,
        design: designResult.success,
        conceptLength: conceptResult.length
      });

      return {
        success: true,
        data: {
          wireframe: wireframeResult.success ? wireframeResult.data?.image_base64 : null,
          design: designResult.success ? designResult.data?.image_base64 : null,
          concept: conceptResult,
          // 保持向后兼容
          imageUrl: designResult.success ? designResult.data?.image_base64 : wireframeResult.data?.image_base64,
          image_base64: designResult.success ? designResult.data?.image_base64 : wireframeResult.data?.image_base64,
          uiMockup: designResult.success ? designResult.data?.image_base64 : wireframeResult.data?.image_base64
        },
        message: `UI设计完成！${wireframeResult.success ? '✅原型图' : '❌原型图'}，${designResult.success ? '✅设计图' : '❌设计图'}`
      };
    } catch (error) {
      console.error('❌ UI生成失败:', error);
      return {
        success: false,
        error: `UI mockup生成失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 生成单张图片的通用方法
   */
  private async generateSingleImage(prompt: string, type: string): Promise<ActionExecutionResult> {
    try {
      console.log(`🖼️ 开始生成${type}...`);
      
      const response = await fetch('http://localhost:8001/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          width: 1536,
          height: 1024
        })
      });

      if (!response.ok) {
        throw new Error(`${type}API请求失败: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log(`✅ ${type}生成成功`);
        return {
          success: true,
          data: {
            image_base64: result.image_base64
          }
        };
      } else {
        throw new Error(result.error || `${type}生成失败`);
      }
    } catch (error) {
      console.error(`❌ ${type}生成失败:`, error);
      return {
        success: false,
        error: `${type}生成失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 构建低保真原型图提示词
   */
  private buildWireframePrompt(formData: EventPlannerFormData): string {
    return `生成专业的移动游戏活动UI线框图：

【严格基于用户需求】
🎯 活动主题：${formData.theme}
📝 活动概要：${formData.overview}
👥 目标玩家：${this.getTargetPlayerDescription(formData.targetPlayer)}
💼 业务目标：${this.getBusinessGoalDescription(formData.businessGoal)}

【关键要求】
⚠️ 界面设计必须100%体现"${formData.theme}"的主题特色
⚠️ 核心功能区必须直接呼应"${formData.overview}"的具体描述

【界面规格】
尺寸：横屏移动界面 (1536x1024)
风格：黑白线框图，2px线条粗细，专业UX设计

【自适应布局设计】
🚫 不使用固定的区域分配（如"顶部20%"等预设结构）
✅ 根据"${formData.overview}"的具体内容自主设计界面布局

请根据活动特点自主设计：
- 主标题区：体现"${formData.theme}"特色的标题设计
- 核心功能区：完全基于"${formData.overview}"描述的交互区域
- 辅助功能区：根据${this.getBusinessGoalDescription(formData.businessGoal)}需要的支撑功能
- 信息展示区：适合${this.getTargetPlayerDescription(formData.targetPlayer)}的信息呈现方式

布局要求：
- 界面结构要完全贴合活动主题和玩法需求
- 功能区域划分要符合用户的实际操作流程
- 避免套用通用的游戏界面模板

【设计规范】
- 纯黑线条在白色背景上
- 按钮用矩形框表示
- 图标用几何形状表示
- 所有文本区域用"TEXT"占位符
- 清晰间距，专业UX线框图外观
- 无颜色或阴影，纯功能性布局设计

参考标准：专业移动应用线框图，简洁明了。`;
  }

  /**
   * 获取活动布局描述
   */
  private getActivityLayoutDescription(businessGoal: string): string {
    switch (businessGoal) {
      case 'retention':
        return 'daily task checklist, progress bars, reward grid layout';
      case 'monetization':
        return 'featured item showcase, purchase buttons, special offer banners';
      case 'acquisition':
        return 'social sharing elements, referral system, invite friend buttons';
      case 'engagement':
        return 'interactive challenges, leaderboard, achievement showcase';
      default:
        return 'task list with progress indicators and reward displays';
    }
  }

  /**
   * 构建设计构思LLM提示词
   */
  private buildConceptPrompt(formData: EventPlannerFormData): string {
    return `你是一个游戏活动界面设计构思大师，需要为"${formData.theme}"活动设计详细的视觉构思方案。

**活动信息：**
- 活动主题：${formData.theme}
- 活动概要：${formData.overview}
- 业务目标：${this.getBusinessGoalDescription(formData.businessGoal)}
- 目标玩家：${this.getTargetPlayerDescription(formData.targetPlayer)}
- 目标区域：${formData.targetRegion}

**设计构思要求：**
请基于活动主题和目标，设计一个吸引人的游戏活动界面视觉方案。

**输出格式：**
请按以下结构输出详细的设计构思：

## 整体风格
主题：[基于活动主题的设计风格，如科技感、奇幻风、竞技感等]
色调：[主色调和辅助色搭配，具体色彩描述]
背景：[背景设计思路，氛围营造]

## 顶部区域
活动标题：[标题设计风格和视觉效果]
功能按钮：[按钮设计风格和布局]

## 中央区域（核心玩法）
主要内容：[根据活动类型设计的核心内容展示]
交互元素：[按钮、进度条、奖励展示等]
视觉焦点：[最吸引眼球的设计元素]

## 底部区域
功能按钮：[主要操作按钮的设计]
辅助信息：[次要信息的展示方式]

## 关键设计元素
特色图标：[符合主题的图标设计]
动效提示：[可能的动画效果描述]
视觉层次：[信息的重要性层级安排]

请确保设计方案符合目标玩家的审美偏好，突出活动的核心吸引力。`;
  }

  /**
   * 构建高保真设计图提示词
   */
  private buildDesignPrompt(conceptResult: string): string {
    return `基于设计构思生成高保真移动游戏UI设计：

【设计构思依据】
${conceptResult}

【核心要求】
🎯 必须严格遵循上述构思内容的视觉方向
🎨 色彩和风格完全契合构思中描述的主题氛围
🎮 界面元素精确体现构思提到的功能和交互设计

【技术规格】
布局：横屏移动游戏界面 (1536x1024)
风格：现代游戏UI设计语言

【基于构思的自适应视觉设计】
🚫 不使用预设的视觉元素组合
✅ 严格根据设计构思内容来确定所有视觉元素

请根据构思内容自主决定：
- 色彩搭配：完全基于构思中描述的主题氛围来选择颜色
- 视觉风格：让构思内容决定是科技感、奇幻风、简约风还是其他风格
- UI组件样式：按钮、图标、字体都要体现构思中的设计理念
- 特效选择：根据主题需要决定是否使用发光、粒子等效果
- 背景处理：基于活动特点决定背景的复杂度和元素

视觉统一性要求：
- 所有视觉元素都要服务于构思中描述的主题体验
- 色彩、形状、材质要形成完整的视觉语言
- 界面美感要符合目标用户群体的审美偏好
- 避免使用与主题不符的通用游戏UI元素

【质量标准】
制作级移动游戏界面，像素级完美对齐，顶级游戏UI标准

参考质量：王者荣耀、原神、皇室战争等高端移动游戏UI品质。`;
  }

  /**
   * 构建UI Mockup提示词（保留原方法作为备用）
   */
  private buildMockupPrompt(formData: EventPlannerFormData): string {
    const basePrompt = `生成一个游戏活动UI mockup原型图，活动主题：${formData.theme}

**活动信息：**
- 活动主题：${formData.theme}
- 活动概要：${formData.overview}
- 业务目标：${this.getBusinessGoalDescription(formData.businessGoal)}
- 目标玩家：${this.getTargetPlayerDescription(formData.targetPlayer)}
- 目标区域：${formData.targetRegion}

**界面布局要求：**
- 横屏布局设计，适合移动端游戏
- 顶部区域：活动标题"${formData.theme}" + 剩余时间倒计时 + 活动规则按钮
- 中央主要区域：根据活动类型设计核心功能区域
  * 如果是竞技类活动：排行榜、对战匹配、积分显示
  * 如果是收集类活动：收集进度、物品展示、合成界面
  * 如果是签到类活动：签到日历、奖励预览、连续天数
  * 如果是商业化活动：商品展示、购买按钮、限时优惠
- 侧栏区域：个人信息（当前进度、累计奖励、个人排名）
- 底部区域：活动商店入口、分享功能、返回主界面按钮

**设计风格要求：**
- 低保真线框图风格（wireframe style）
- 使用黑白灰色系展示界面结构
- 清晰标注各个功能模块和按钮
- 现代移动游戏UI设计风格
- 注重信息层级和用户体验
- 界面简洁明了，功能区域划分清晰

**针对目标用户的设计考虑：**
${this.getUIDesignConsiderations(formData.targetPlayer, formData.businessGoal)}

请生成一个专业的游戏活动界面原型图，展示清晰的功能布局和用户交互流程。`;

    return basePrompt;
  }

  /**
   * 根据目标用户和业务目标获取UI设计考虑
   */
  private getUIDesignConsiderations(targetPlayer: string, businessGoal: string): string {
    let considerations = [];
    
    // 根据目标玩家调整UI设计
    if (targetPlayer.includes('new')) {
      considerations.push('- 界面简单直观，减少复杂操作');
      considerations.push('- 突出新手引导和帮助功能');
    } else if (targetPlayer.includes('active_high')) {
      considerations.push('- 功能丰富，支持高级操作');
      considerations.push('- 显示详细数据和统计信息');
    } else if (targetPlayer.includes('returning')) {
      considerations.push('- 突出回归福利和专属奖励');
      considerations.push('- 显示离开期间的更新内容');
    }
    
    // 根据业务目标调整UI设计
    if (businessGoal.includes('monetization')) {
      considerations.push('- 突出商品价值和限时优惠');
      considerations.push('- 清晰的购买流程和支付入口');
    } else if (businessGoal.includes('retention')) {
      considerations.push('- 强调每日任务和签到奖励');
      considerations.push('- 显示连续参与的进度和成就');
    } else if (businessGoal.includes('acquisition')) {
      considerations.push('- 突出分享和邀请功能');
      considerations.push('- 展示社交互动和好友系统');
    }
    
    return considerations.length > 0 ? considerations.join('\n') : '- 通用游戏界面设计原则';
  }

  /**
   * 获取活动类型描述
   */
  private getActivityTypeDescription(businessGoal: string): string {
    const descriptions: Record<string, string> = {
      'retention_battle': '对战竞技类活动，重点展示排行榜和对战匹配',
      'retention_signin': '签到类活动，重点展示签到日历和奖励进度',
      'retention_dau': '日活冲高活动，重点展示任务列表和完成进度',
      'acquisition_return': '回流活动，重点展示回归奖励和专属福利',
      'acquisition_new': '新手活动，重点展示引导流程和新手奖励',
      'monetization_payment': '付费活动，重点展示商品展示和购买入口',
      'monetization_arppu': 'ARPPU提升活动，重点展示高价值商品和限时优惠'
    };
    return descriptions[businessGoal] || '通用活动界面';
  }

  /**
   * 获取目标玩家描述
   */
  private getTargetPlayerDescription(targetPlayer: string): string {
    const descriptions: Record<string, string> = {
      'active_low': '低活跃玩家，界面简洁易懂',
      'active_medium': '中活跃玩家，界面功能适中',
      'active_high': '高活跃玩家，界面功能丰富',
      'returning': '回流玩家，突出回归福利',
      'new': '新玩家，界面简单清晰',
      'monetization_big_r': '大R玩家，突出高端商品',
      'monetization_medium_r': '中R玩家，平衡性价比',
      'monetization_small_r': '小R玩家，突出优惠',
      'monetization_non_paying': '免费玩家，突出免费获取途径'
    };
    return descriptions[targetPlayer] || '通用用户界面';
  }

  /**
   * 获取Event Planner状态
   */
  getEventPlannerState(sessionId: string): EventPlannerState | null {
    return this.eventPlannerStates.get(sessionId) || null;
  }

  /**
   * 生成完整活动策划案
   */
  private async generateFullPlan(formData: EventPlannerFormData, selectedOverview: any): Promise<ActionExecutionResult> {
    try {
      console.log('🎯 开始生成完整策划案...');
      console.log('📝 用户输入数据:', formData);
      console.log('🎮 选中的概览方案:', selectedOverview);
      
      // 构建详细的分析prompt
      const analysisPrompt = this.buildEventPlanningPrompt(formData, selectedOverview);
      console.log('📋 生成的完整策划案Prompt长度:', analysisPrompt.length);
      
      // 调用LLM生成策划案 - 使用高token限制确保完整生成
      const fullPlan = await this.getLLMResponse(analysisPrompt, 16000);
      console.log('✅ LLM返回的完整策划案长度:', fullPlan.length);

      return {
        success: true,
        data: {
          fullPlan
        }
      };
    } catch (error) {
      console.error('❌ LLM生成完整策划案失败:', error);
      return {
        success: false,
        error: `生成完整策划案失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 调用LLM获取响应
   */
  private async getLLMResponse(prompt: string, maxTokens: number = 2000): Promise<string> {
    try {
      const messages = [{ role: 'user' as const, content: prompt }];
      const response = await backendApiService.getChatCompletion(messages, 0.7, maxTokens);
      if (response.success) {
        return response.content || '';
      } else {
        throw new Error(response.error || '后端API调用失败');
      }
    } catch (error) {
      console.error('LLM调用失败:', error);
      throw error;
    }
  }

  /**
   * 构建活动策划分析prompt
   */
  private buildEventPlanningPrompt(formData: EventPlannerFormData, selectedOverview: any): string {
    return `你是拥有15+年经验的"资深游戏活动策划总监"。你的核心能力是将用户的具体需求转化为高度个性化、可直接执行的原创活动方案。

🚫 **严禁使用通用模板** - 每个方案必须100%基于用户具体输入进行原创设计
🎯 **个性化要求** - 所有内容必须紧密契合用户提供的主题和概要描述

**用户明确要求的活动信息：**
- 活动主题：${formData.theme}
- 活动概要：${formData.overview}
- 业务目标：${formData.businessGoal}（${this.getBusinessGoalDescription(formData.businessGoal)}）
- 目标玩家：${formData.targetPlayer}（${this.getTargetPlayerDescription(formData.targetPlayer)}）
- 目标区域：${formData.targetRegion}
- 选择方案：${selectedOverview.title}
- 方案描述：${selectedOverview.description}
- 核心玩法：${selectedOverview.coreGameplay}

**游戏奖励体系知识库：**

**英雄类别：**
- 英雄：无等级区分，基础稀有度

**皮肤类别：**
- T1：最高稀有度 - 限定商业化皮肤
- T1.5：限定商业化皮肤
- T2：限定商业化皮肤
- T2.5：限定商业化皮肤
- T3：限定商业化皮肤、直售商业化皮肤
- T3.5：限定商业化皮肤、直售商业化皮肤、活躍皮肤
- T4：限定商业化皮肤、直售商业化皮肤、活躍皮肤
- T5：直售商业化皮肤、活躍皮肤
- T6：最低稀有度 - 直售商业化皮肤、活躍皮肤

**局内周边资源：**
- 動態頭像框：最高稀有度
- 稱號標籤：
- 靜態頭像框：
- 頭像：
- 表情：
- 回城特效：
- 擊殺特效：
- 加速特效：
- 個性載載：
- 親密度道具：最低稀有度
- 舞蹈動作：需與皮膚/英雄綁定，較不通用
- 播報：需與皮膚/英雄綁定，較不通用
- 個性化按鍵：需與皮膚/英雄綁定，較不通用

**输出格式要求：**
请严格按照以下结构生成，每个部分都必须基于用户输入的主题和概要进行原创设计：

# 🎮 ${formData.theme} - 专业活动策划案

## 📋 1. 活动概览
### 活动定位
[基于"${formData.theme}"的核心卖点分析，3-4个关键卖点]
[目标玩家精准画像分析]
[在游戏整体运营中的战略意义]

### 关键指标预期
[基于 业务目标${formData.businessGoal} 生成可执行 可实现的关键指标与预期]

## 🎯 2. 活动背景与目标
### 市场机会分析
[热点趋势契合性分析]
[竞品态势对比和差异化优势]

### 活动目标拆解
[主目标量化指标和达成路径]
[次要目标和成功标准]

## 🌟 3. 活动主题与故事线
### 主题设计
[故事背景和世界观设定]
[视觉风格和色彩方案，具体色值]
[情感连接点设计]

### 分阶段剧情
[若活动需要份不同阶段剧情，可参考下方结构；若不需要分阶段（例如活动从开始到结束都属于一种状态，例如展示皮肤的活动，则不需要显示这一点）]
参考阶段（可自由发挥，不需要严格按照此结构展示）：
[第一阶段：具体天数，节点设计，体验目标，核心玩法]
[第二阶段：中期战报，玩法升级，社交协作]
[第三阶段：终局冲刺，限时机制，高潮设计]

## 🎮 4. 核心玩法设计 ⭐ **最重要模块**
### 主要玩法机制
可基于下方模块做参考和延伸（不强制参考下方模块，若当前活动适用，可参考）
最重要的是详细的说明活动玩法与机制与流程！
[触发行为：完整的用户操作流程]
[反馈机制：即时反馈和长期激励]
[奖励获取：奖励设计]
[循环动力：日更/周更/节点性内容]

### 任务系统构成
若此活动有任务系统，则需要设计任务系统与奖励体系；若没有任务 此模块可以忽略

### 公平性约束机制
可参考下方内容做延伸，根据活动不同需要给玩家提供不同的约束机制
[防作弊技术方案]
[用户行为限制规则]
[异常检测和处理流程]

### 创新玩法设计
可参考下方内容做延伸，根据活动不同提供不同的创新玩法设计
[基于主题的独特玩法机制]
[社交协作玩法]
[跨平台互动设计]

### 界面与交互设计
根据活动玩法机制详细的说明活动的**每个主页面与重要交互设计**，可参考下方内容，但需要根据活动机制，内容不同做修改
[主界面布局：顶部/中区/侧栏/底部具体设计]
[任务界面：分类展示和一键跳转]
[奖励界面：分层展示和开箱动效]

### 社交机制
根据活动不同进行设计，如果当前活动没有社交机制，则不需要展示此部分；下方内容仅做参考
[话题挑战设计]
[排行竞技规则]
[协作玩法机制]
[分享传播激励]

### 视觉设计方向
根据活动主题，机制 给出对应的视觉设计建议（根据活动不同设计对应的内容）下方内容仅做参考
[主题化视觉风格]
[色彩搭配和材质选择]
[动效设计和反馈机制]

## 🏆 6. 奖励体系设计
### 奖励结构设计
若活动有奖励系统，需要严格按照 **游戏奖励体系知识库**的内容来设计本次活动的奖励，确保奖励设计的合理

## 📅 7. 活动时间规划
根据不同活动机制来设计对应合理的时间规划，例如包括 整体时间轴 和 关键时间节点

## 📢 8. 推广传播策略
活动上线后，制定可执行的社媒推广方案

## 🎨 9. 素材需求与制作规范
### 视觉设计素材
根据活动提供视觉素材list，包括但不限于下面内容：
[主KV：风格定义，色彩规范，文案层级]
[活动Banner：多尺寸适配，信息层级]
[界面UI：模块化设计，动效规范]

## 📊 10. 效果监测与优化
### 关键指标
根据不同活动提供，包括但不限于下方内容
[参与度指标：UV、参与率、活跃度]
[转化指标：注册、付费、留存]
[传播指标：UGC数量、播放量、口碑]

### 实时优化策略
根据不同活动提供，包括但不限于下方内容
[数据监控频率和预警机制]
[动态调整策略和应急预案]
[A/B测试和优化方向]

## ⚠️ 11. 风险管控与应急预案
根据不同活动提供，包括但不限于下方内容
### 运营风险
[参与度低于预期的应对策略]
[舆情争议的预防和处理]
[竞品狙击的应对措施]

### 合规风险
[内容审核和版权控制]
[平台政策合规检查]
[未成年人保护机制]

### 市场变化应急
[热点变化的快速响应]
[政策调整的适配方案]

**重要提醒：**
- 所有具体数字、方案、时间节点都必须基于"${formData.theme}"主题进行设计
- 奖励选择严格按照提供的等级体系
- 每个模块都要有可执行的具体内容，避免空泛描述
- 确保商业化设计与用户体验平衡
- 除了上方提到的模块内容以外，你作为一个专业的游戏策划和游戏公司ceo，你可以对此策划案增加任何你认为有价值的东西`;
  }


  /**
   * Agent化的智能意图识别和处理
   */
  async handleUserIntent(sessionId: string, userInput: string): Promise<ActionExecutionResult> {
    const state = this.eventPlannerStates.get(sessionId);
    
    // 如果没有会话状态，创建新的Event Planner会话
    if (!state) {
      return {
        success: true,
        message: '我是您的活动策划助手，让我们开始创建一个精彩的游戏活动吧！请告诉我您的活动主题和想法。',
        requiresInput: true,
        type: 'event_planner_start'
      };
    }

    // 智能分析用户意图
    const intent = this.analyzeUserIntent(userInput, state);
    
    switch (intent.type) {
      case 'regenerate':
        // 用户想要重新生成
        if (state.generatedOverviews) {
          return this.selectEventPlan(sessionId, 'regenerate');
        }
        break;
        
      case 'select_plan':
        // 用户想要选择方案
        if (state.generatedOverviews && intent.planIndex !== -1) {
          return this.selectEventPlan(sessionId, intent.planIndex);
        }
        break;
        
      case 'generate_mockup':
        // 用户想要生成UI设计
        if (state.fullPlan) {
          return this.generateEventMockupAsync(sessionId);
        }
        break;
        
      case 'modify_request':
        // 用户想要修改需求
        state.step = 'form';
        return {
          success: true,
          message: '好的，让我们重新确认您的活动需求。请告诉我新的活动主题和概要。',
          requiresInput: true
        };
        
      case 'continue':
        // 用户想要继续当前流程
        if (state.step === 'selection' && state.generatedOverviews) {
          return {
            success: true,
            type: 'event_planner_selection',
            data: { overviews: state.generatedOverviews },
            message: '请选择您喜欢的活动方案，或告诉我"重新生成"',
            requiresInput: true
          };
        }
        break;
    }
    
    // 默认处理：提供上下文相关的帮助
    return this.provideContextualHelp(state, userInput);
  }

  /**
   * 分析用户意图
   */
  private analyzeUserIntent(userInput: string, state: any): any {
    const input = userInput.toLowerCase();
    
    // 重新生成意图
    if (input.includes('重新') || input.includes('再') || input.includes('重做') || 
        input.includes('regenerate') || input.includes('again')) {
      return { type: 'regenerate' };
    }
    
    // 选择方案意图
    const planMatches = input.match(/[方案选择选]([abc123一二三])/);
    if (planMatches) {
      const planMap: { [key: string]: number } = {
        'a': 0, '1': 0, '一': 0,
        'b': 1, '2': 1, '二': 1,
        'c': 2, '3': 2, '三': 2
      };
      const planIndex = planMap[planMatches[1]];
      return { type: 'select_plan', planIndex: planIndex ?? -1 };
    }
    
    // UI设计/mockup生成意图
    if (input.includes('设计') || input.includes('界面') || input.includes('ui') || 
        input.includes('mockup') || input.includes('原型')) {
      return { type: 'generate_mockup' };
    }
    
    // 修改需求意图
    if (input.includes('修改') || input.includes('改') || input.includes('换') || 
        input.includes('不满意') || input.includes('重新来')) {
      return { type: 'modify_request' };
    }
    
    // 继续流程意图
    if (input.includes('继续') || input.includes('下一步') || input.includes('好的') || 
        input.includes('确定') || input.includes('continue')) {
      return { type: 'continue' };
    }
    
    return { type: 'unknown' };
  }

  /**
   * 提供上下文相关的帮助
   */
  private provideContextualHelp(state: any, userInput: string): ActionExecutionResult {
    switch (state.step) {
      case 'selection':
        return {
          success: true,
          message: `我理解您说的是"${userInput}"。现在您有3个活动方案可以选择：\n1. 选择方案A/B/C\n2. 要求"重新生成"\n3. 或者告诉我您想要什么样的修改`,
          requiresInput: true
        };
        
      case 'full_plan':
        return {
          success: true,
          message: `策划案已生成完成。您可以：\n1. 说"生成UI设计"来创建界面原型\n2. 说"重新生成"来重做策划案\n3. 或告诉我其他需求`,
          requiresInput: true
        };
        
      default:
        return {
          success: true,
          message: `我理解您想要"${userInput}"。作为您的活动策划助手，我可以帮您：\n1. 创建全新的活动策划方案\n2. 修改现有方案\n3. 生成UI设计原型\n请告诉我您具体想做什么？`,
          requiresInput: true
        };
    }
  }

  /**
   * 获取业务目标描述
   */
  private getBusinessGoalDescription(businessGoal: string): string {
    const descriptions: Record<string, string> = {
      'retention_battle': '通过对战竞技提升用户活跃度和留存',
      'retention_signin': '通过签到机制培养用户日常登录习惯',
      'retention_dau': '通过多样化任务提升日活跃用户数',
      'acquisition_return': '吸引流失用户重新回到游戏',
      'acquisition_new': '通过活动吸引新用户注册和体验',
      'monetization_payment': '提升用户付费率和首次付费转化',
      'monetization_arppu': '提升付费用户的平均付费金额'
    };
    return descriptions[businessGoal] || businessGoal;
  }

  /**
   * 生成活动概览 - 使用LLM生成3个不同方案
   */
  private async generateEventOverviews(formData: EventPlannerFormData): Promise<ActionExecutionResult> {
    try {
      console.log('🎯 开始生成活动概览...');
      console.log('📝 用户输入数据:', formData);
      
      const overviewPrompt = this.buildOverviewGenerationPrompt(formData);
      console.log('📋 生成的概览Prompt长度:', overviewPrompt.length);
      
      const llmResponse = await this.getLLMResponse(overviewPrompt, 4000);
      console.log('🤖 LLM返回的概览响应长度:', llmResponse.length);
      console.log('📄 LLM概览响应内容预览:', llmResponse.substring(0, 200) + '...');
      
      // 解析LLM返回的JSON格式概览
      const overviews = this.parseOverviewsFromLLM(llmResponse, formData.theme);
      console.log('✅ 解析得到的概览数量:', overviews.length);
      console.log('📊 概览标题:', overviews.map(o => o.title));
      
      return {
        success: true,
        data: {
          overviews
        }
      };
    } catch (error) {
      console.error('❌ LLM生成活动概览失败:', error);
      return {
        success: false,
        error: `生成活动概览失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 构建概览生成的prompt
   */
  private buildOverviewGenerationPrompt(formData: EventPlannerFormData): string {
    return `你是拥有15+年经验的"资深游戏活动策划总监"。请基于用户具体需求，生成3个专业级、差异化的活动概览方案。

**用户明确要求的活动信息：**
- 活动主题：${formData.theme}
- 活动概要：${formData.overview}
- 业务目标：${formData.businessGoal}（${this.getBusinessGoalDescription(formData.businessGoal)}）
- 目标玩家：${this.getTargetPlayerDescription(formData.targetPlayer)}
- 目标区域：${formData.targetRegion}

**核心设计原则：**
🚫 **严禁预设具体内容** - 所有内容必须根据用户输入的"${formData.theme}"和"${formData.overview}"进行原创设计
✅ **差异化策略** - 3个方案采用不同的策略路径和玩法重心
✅ **目标匹配** - 确保方案契合${this.getBusinessGoalDescription(formData.businessGoal)}和${this.getTargetPlayerDescription(formData.targetPlayer)}

**方案设计要求：**
每个方案都要基于"${formData.theme}"主题进行深度设计，重点体现：

1. **活动定位差异化**：
   - 方案A：偏向"低门槛高参与"策略，适合大众化推广
   - 方案B：偏向"深度体验"策略，适合核心玩家留存  
   - 方案C：偏向"社交协作"策略，适合社区建设和口碑传播

2. **核心玩法机制**：
   - 详细说明基于"${formData.overview}"设计的具体玩法
   - 每个方案的玩法机制要有明显差异
   - 突出创新点和与主题的契合度

3. **可执行性考量**：
   - 考虑开发成本、技术难度、运营复杂度
   - 提供具体的实施路径和关键功能

**输出格式要求：**
请严格按照以下JSON格式输出：

\`\`\`json
[
  {
    "id": 1,
    "title": "${formData.theme} - [策略定位名称]",
    "description": "基于'${formData.overview}'的核心策略描述，突出与其他方案的差异化价值和针对${this.getTargetPlayerDescription(formData.targetPlayer)}的匹配度",
    "coreGameplay": "• [基于主题的核心玩法机制1]（具体操作流程）\\n• [基于主题的核心玩法机制2]（奖励机制）\\n• [基于主题的核心玩法机制3]（社交/竞技元素）\\n• [该方案独有的创新亮点]（差异化价值）"
  },
  {
    "id": 2,
    "title": "${formData.theme} - [策略定位名称]",
    "description": "基于'${formData.overview}'的核心策略描述，突出与其他方案的差异化价值和针对${this.getTargetPlayerDescription(formData.targetPlayer)}的匹配度",
    "coreGameplay": "• [基于主题的核心玩法机制1]（具体操作流程）\\n• [基于主题的核心玩法机制2]（奖励机制）\\n• [基于主题的核心玩法机制3]（社交/竞技元素）\\n• [该方案独有的创新亮点]（差异化价值）"
  },
  {
    "id": 3,
    "title": "${formData.theme} - [策略定位名称]",
    "description": "基于'${formData.overview}'的核心策略描述，突出与其他方案的差异化价值和针对${this.getTargetPlayerDescription(formData.targetPlayer)}的匹配度",
    "coreGameplay": "• [基于主题的核心玩法机制1]（具体操作流程）\\n• [基于主题的核心玩法机制2]（奖励机制）\\n• [基于主题的核心玩法机制3]（社交/竞技元素）\\n• [该方案独有的创新亮点]（差异化价值）"
  }
]
\`\`\`

**重要提醒：**
- 所有玩法设计必须紧密围绕"${formData.theme}"主题展开
- 每个方案都要体现"${formData.overview}"的核心概念
- 确保3个方案有明显的策略差异和玩法重心区别
- 方案命名要体现主题特色和策略定位`;
  }

  /**
   * 解析LLM返回的概览数据
   */
  private parseOverviewsFromLLM(llmResponse: string, fallbackTheme: string = '游戏活动'): any[] {
    try {
      // 提取JSON部分
      const jsonMatch = llmResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const overviews = JSON.parse(jsonStr);
        return Array.isArray(overviews) ? overviews : [];
      }
      
      // 如果没有找到JSON格式，尝试直接解析
      const parsed = JSON.parse(llmResponse);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('解析LLM概览响应失败:', error);
      // 返回默认方案
      return [
        {
          id: 1,
          title: `${fallbackTheme} - 经典方案`,
          description: '基于传统玩法设计的稳定方案',
          coreGameplay: '• 任务完成\n• 奖励获取\n• 进度追踪\n• 排行竞争'
        },
        {
          id: 2,
          title: `${fallbackTheme} - 创新方案`,
          description: '融入新颖元素的创新玩法方案',
          coreGameplay: '• 互动体验\n• 社交分享\n• 个性化定制\n• 成就解锁'
        },
        {
          id: 3,
          title: `${fallbackTheme} - 平衡方案`,
          description: '兼顾不同玩家需求的平衡方案',
          coreGameplay: '• 多样化任务\n• 灵活参与\n• 公平竞争\n• 持续激励'
        }
      ];
    }
  }

  /**
   * 清理Event Planner状态
   */
  clearEventPlannerState(sessionId: string): void {
    this.eventPlannerStates.delete(sessionId);
  }
}

export const actionExecutorService = new ActionExecutorService();
