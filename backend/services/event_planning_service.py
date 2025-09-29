"""
Event Planning Service
生成专业的游戏活动策划案
"""
from typing import Dict, Any, Optional
from services.openai_service import openai_service
from services.gpt_image_service import gpt_image_service

class EventPlanningService:
    def __init__(self):
        self.openai_service = openai_service
    
    async def generate_event_plan(self, form_data: Dict[str, Any]) -> Dict[str, Any]:
        """生成活动策划案"""
        try:
            # 构建详细的prompt
            prompt = self._build_event_planning_prompt(form_data)
            
            # 调用OpenAI API生成策划案
            messages = [
                {"role": "system", "content": "你是资深游戏活动策划总监，专门负责制定专业级、可直接执行的游戏活动策划案。"},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.openai_service.get_chat_completion(
                messages=messages,
                temperature=0.7,
                max_tokens=4000
            )
            
            if response.get('success'):
                plan_content = response['content']
                
                # 生成UI mockup图片
                mockup_image = await self._generate_ui_mockup(form_data)
                
                return {
                    'success': True,
                    'plan': plan_content,
                    'mockup_image': mockup_image,
                    'form_data': form_data
                }
            else:
                return {
                    'success': False,
                    'error': response.get('error', '生成策划案失败')
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'生成策划案时发生错误: {str(e)}'
            }
    
    def _build_event_planning_prompt(self, form_data: Dict[str, Any]) -> str:
        """构建活动策划prompt"""
        
        # 处理业务目标
        business_goal = form_data.get('businessGoal', '')
        if business_goal == 'custom':
            business_goal_text = form_data.get('businessGoalCustom', '')
        else:
            goal_mapping = {
                'revenue': '营收增长',
                'retention': '用户留存提升',
                'acquisition': '新用户获取',
                'engagement': '用户活跃度提升'
            }
            business_goal_text = goal_mapping.get(business_goal, business_goal)
        
        # 处理目标玩家
        target_player = form_data.get('targetPlayer', '')
        if target_player == 'custom':
            target_player_text = form_data.get('targetPlayerCustom', '')
        else:
            player_mapping = {
                'whale': '大R玩家（高付费用户）',
                'dolphin': '中R玩家（中等付费用户）',
                'minnow': '小R玩家（低付费用户）',
                'f2p': '免费玩家',
                'all': '全体玩家'
            }
            target_player_text = player_mapping.get(target_player, target_player)
        
        prompt = f"""
**角色与目标**
你是"资深游戏活动策划总监"。你需要基于用户输入的需求，输出一份**专业级、可直接执行的游戏活动策划案**，包含完整的活动设计、实施方案、资源配置和效果预期。

**用户需求输入：**
* 活动主题：{form_data.get('theme', '')}
* 活动概要：{form_data.get('overview', '')}
* 业务目标：{business_goal_text}
* 目标玩家：{target_player_text}
* 目标区域：{form_data.get('targetRegion', '')}

**策划原则**
* **用户中心**：优先考虑目标玩家的体验和需求
* **商业闭环**：确保活动目标可达成，ROI可计算
* **创新融合**：结合当前热点趋势，创造差异化体验
* **风险可控**：设置完善的风险预案和调整机制
* **数据驱动**：所有设计决策都要有逻辑支撑

**输出要求**
请严格按照以下格式输出

# 🎮 {form_data.get('theme', '[活动名称]')} 活动策划案

## 📋 1. UI mockup、核心玩法设计

### 方案A：创新玩法方案
**核心玩法机制**：
* 主要玩法循环：[详细描述玩家的核心操作流程]
* 反馈机制：[即时反馈和进度显示设计]
* 奖励获取：[奖励类型和获取逻辑]
* 社交元素：[玩家互动和竞争机制]

**UI界面设计**：
* 主界面布局：[详细描述各功能区域划分]
* 核心按钮设计：[主要操作入口的位置和样式]
* 信息展示方式：[关键信息的呈现逻辑]
* 视觉引导流程：[用户操作的引导设计]

### 方案B：经典优化方案
**核心玩法机制**：
* 主要玩法循环：[基于成熟玩法的优化设计]
* 反馈机制：[优化的反馈和进度系统]
* 奖励获取：[平衡的奖励分发机制]
* 社交元素：[强化的社交互动设计]

**UI界面设计**：
* 主界面布局：[用户友好的界面设计]
* 核心按钮设计：[直观的操作界面]
* 信息展示方式：[清晰的信息架构]
* 视觉引导流程：[简化的用户流程]

### 方案C：混合创新方案
**核心玩法机制**：
* 主要玩法循环：[创新与经典结合的玩法]
* 反馈机制：[多层次的反馈系统]
* 奖励获取：[差异化的奖励机制]
* 社交元素：[创新的社交玩法]

**UI界面设计**：
* 主界面布局：[平衡创新与易用性]
* 核心按钮设计：[个性化的交互设计]
* 信息展示方式：[动态的信息展示]
* 视觉引导流程：[沉浸式的用户体验]

## 📅 2. 活动时间规划

### 整体时间轴
**预热期（活动前1周）**
* 宣传预告：[具体的预热内容和推广渠道]
* 玩家教育：[玩法介绍和期待值管理]
* 技术准备：[系统测试和性能优化]
* 素材准备：[视觉素材和文案的最终确认]

**爆发期（活动前3天）**
* 高强度推广：[多渠道同步发力的具体计划]
* KOL合作：[意见领袖的内容投放策略]
* 社区造势：[官方社区的话题讨论和预约活动]
* 最终测试：[上线前的最后技术验证]

**活动执行期**
* 第1周：[开局吸引策略，建立用户习惯]
  - 新手引导优化
  - 初期奖励丰富
  - 问题快速响应
* 第2-3周：[维持热度策略，深度参与激励]
  - 中期活动高潮
  - 社交功能强化
  - 用户反馈收集
* 第4周+：[收尾冲刺策略，最终转化]
  - 限时特殊奖励
  - 排行榜竞争
  - 成就系统完善

**收尾期（活动后1周）**
* 数据分析：[全面的效果评估和数据总结]
* 用户回访：[满意度调研和改进建议收集]
* 经验沉淀：[成功经验的文档化和流程优化]

## 🌟 3. 活动主题与故事线

### 主题设计
**活动主题**：{form_data.get('theme', '')}
**故事背景**：[基于主题的沉浸式背景设定，结合目标玩家喜好]
**视觉风格**：[符合目标市场文化的视觉调性设计]
**情感连接**：[与{target_player_text}的情感共鸣点设计]

### 分阶段剧情设计
**第一阶段：开启篇**
* 故事节点：[引入性的故事情节，建立世界观]
* 玩家体验：[新手友好的体验设计]
* 核心玩法：[基础玩法的介绍和练习]
* 奖励设置：[吸引性的初期奖励]

**第二阶段：发展篇**
* 故事节点：[深入的故事发展，增加复杂性]
* 玩家体验：[进阶玩法的解锁和挑战]
* 核心玩法：[完整玩法体验的展开]
* 奖励设置：[持续激励的奖励机制]

**第三阶段：高潮篇**
* 故事节点：[故事高潮，最终挑战]
* 玩家体验：[最具挑战性和奖励性的内容]
* 核心玩法：[所有玩法元素的综合运用]
* 奖励设置：[最有价值的终极奖励]

## 📊 4. 效果监测与风险应急预案

### 关键指标监测体系
**参与度指标**
* 活动页面访问量：目标[具体数字]万次/日
* 任务完成率：目标[具体百分比]%
* 平均参与时长：目标[具体分钟]分钟/次
* 回访频次：目标[具体次数]次/周

**转化指标**
* 新用户注册：目标增长[具体百分比]%
* 付费转化率：目标提升至[具体百分比]%
* 客单价变化：目标提升[具体金额]元
* 留存率变化：目标7日留存提升[具体百分比]%

**业务目标达成指标**
* 主要目标：{business_goal_text} - 具体指标：[量化的成功标准]
* 次要目标1：[具体描述] - 指标：[量化标准]
* 次要目标2：[具体描述] - 指标：[量化标准]

### 风险识别与应急预案
**运营风险**
* 参与度不达预期
  - 风险指标：首日参与率低于[具体百分比]%
  - 应急措施：[具体的补救方案，如奖励加码、玩法调整]
* 负面舆情风险
  - 风险指标：负面评价超过[具体百分比]%
  - 应急措施：[公关策略和内容调整方案]

**技术风险**
* 服务器承载风险
  - 风险指标：响应时间超过[具体秒数]秒
  - 应急措施：[扩容方案和降级策略]
* 数据安全风险
  - 风险指标：数据异常或泄露
  - 应急措施：[数据备份和安全响应流程]

**市场风险**
* 竞品干扰风险
  - 风险指标：竞品同期推出类似活动
  - 应急措施：[差异化策略和营销加码方案]

## 🏆 5. 奖励体系设计

### 针对{target_player_text}的奖励结构
**保底奖励（人人可得）**
* 奖励内容：[适合目标玩家的基础价值物品清单]
* 获取条件：[低门槛的参与要求]
* 发放节奏：[每日/每周的奖励分布]
* 价值评估：[对目标玩家的吸引力分析]

**进阶奖励（努力可得）**
* 奖励内容：[中等价值的激励性物品]
* 获取条件：[适中难度的挑战要求]
* 发放节奏：[维持长期参与的奖励节奏]
* 价值评估：[激励持续参与的价值设计]

**稀有奖励（少数获得）**
* 奖励内容：[高价值的稀有物品，符合目标玩家偏好]
* 获取条件：[高难度或高投入的要求]
* 稀有度控制：[限量发放策略]
* 价值评估：[创造独特性和炫耀价值]

**惊喜奖励（随机获得）**
* 奖励内容：[超预期价值的特殊物品]
* 触发机制：[随机事件或隐藏条件]
* 惊喜程度：[心理满足感的设计考量]
* 价值评估：[增强活动记忆点和话题性]

### 奖励分发策略
* **时间分布**：[奖励在活动期间的分发时间安排]
* **难度梯度**：[从易到难的奖励获取路径设计]
* **价值递增**：[奖励价值的逐步提升逻辑]
* **个性化推荐**：[基于玩家行为的个性化奖励]

## 💰 6. 活动制作成本与人天需求

### 开发成本估算
**策划设计**
* 活动策划：2人 × 5工作日 = 10人天
* 系统设计：1人 × 3工作日 = 3人天
* 数值平衡：1人 × 2工作日 = 2人天

**美术制作**
* UI界面设计：2人 × 8工作日 = 16人天
* 活动素材制作：3人 × 10工作日 = 30人天
* 特效制作：1人 × 5工作日 = 5人天

**程序开发**
* 前端开发：2人 × 12工作日 = 24人天
* 后端开发：2人 × 10工作日 = 20人天
* 数据统计：1人 × 3工作日 = 3人天

**测试调优**
* 功能测试：2人 × 5工作日 = 10人天
* 性能优化：1人 × 3工作日 = 3人天
* 兼容性测试：1人 × 2工作日 = 2人天

**总计开发成本**：128人天

### 运营成本估算
**推广费用**
* 线上广告投放：[基于目标市场的预算估算]
* KOL合作费用：[意见领袖合作的成本]
* 社交媒体推广：[社媒平台的推广预算]

**奖励成本**
* 虚拟物品价值：[游戏内奖励的价值换算]
* 实物奖品：[如有实物奖励的采购成本]
* 平台分成：[第三方平台的分成费用]

**人力成本**
* 活动运营：2人 × 活动周期
* 客服支持：增加1人 × 活动周期
* 数据分析：1人 × 活动周期 + 后续1周

### ROI预期
**收益预测**
* 直接收益：活动期间预期营收增长[具体金额]
* 间接收益：用户增长带来的长期价值[具体估算]
* 品牌价值：知名度和用户满意度提升的价值

**投资回报率**
* 短期ROI：活动期间投入产出比预期[具体比例]
* 长期ROI：3-6个月综合收益预期[具体比例]
* 风险调整ROI：考虑各种风险因素后的保守估算

---

**策划案总结**
本活动策划案基于用户需求"{form_data.get('theme', '')}"，针对{target_player_text}群体，以{business_goal_text}为核心目标，设计了完整的活动方案。通过三套UI mockup方案提供选择空间，详细的时间规划确保执行有序，丰富的故事线增强玩家沉浸感，完善的监测体系保障效果达成，科学的奖励设计激励持续参与，合理的成本控制确保商业价值。整体方案具备可执行性、创新性和商业价值，预期能够有效达成设定的业务目标。
"""
        
        return prompt
    
    async def _generate_ui_mockup(self, form_data: Dict[str, Any]) -> Optional[str]:
        """生成UI mockup图片"""
        try:
            # 构建UI mockup的prompt
            mockup_prompt = self._build_mockup_prompt(form_data)
            
            # 调用GPT图像生成服务
            result = await gpt_image_service.generate_image(mockup_prompt, 1536, 1024)
            
            if result.get('success'):
                return result.get('image_base64')
            else:
                print(f"UI mockup生成失败: {result.get('error')}")
                return None
                
        except Exception as e:
            print(f"生成UI mockup时发生错误: {str(e)}")
            return None
    
    def _build_mockup_prompt(self, form_data: Dict[str, Any]) -> str:
        """构建UI mockup生成的prompt"""
        theme = form_data.get('theme', '游戏活动')
        overview = form_data.get('overview', '')
        
        # 处理业务目标
        business_goal = form_data.get('businessGoal', '')
        if business_goal == 'custom':
            business_goal_text = form_data.get('businessGoalCustom', '')
        else:
            goal_mapping = {
                'revenue': '营收增长',
                'retention': '用户留存提升',
                'acquisition': '新用户获取',
                'engagement': '用户活跃度提升'
            }
            business_goal_text = goal_mapping.get(business_goal, business_goal)
        
        # 处理目标玩家
        target_player = form_data.get('targetPlayer', '')
        if target_player == 'custom':
            target_player_text = form_data.get('targetPlayerCustom', '')
        else:
            player_mapping = {
                'whale': '大R玩家',
                'dolphin': '中R玩家',
                'minnow': '小R玩家',
                'f2p': '免费玩家',
                'all': '全体玩家'
            }
            target_player_text = player_mapping.get(target_player, target_player)
        
        # 优化的UI mockup prompt - 与策划案保持一致
        mockup_prompt = f"""生成一个专业的游戏活动UI mockup原型图：

【核心要求】
🎯 活动主题：{theme}
📝 活动概要：{overview}
👥 目标用户：{target_player_text}
💼 业务目标：{business_goal_text}

【界面设计规范】
请严格按照以下布局生成移动端游戏UI原型图：

顶部区域（占屏幕上方20%）：
- 左上："{theme}"活动标题Logo
- 右上：剩余时间倒计时
- 中间：当前活动进度条/等级显示

中央核心区域（占屏幕中央60%）：
- 主要功能：根据"{overview}"的具体描述设计对应的核心交互区域
- 突出{business_goal_text}目标的关键功能按钮
- 符合{target_player_text}使用习惯的交互布局

底部功能区（占屏幕下方20%）：
- 左下：个人信息/进度
- 中下：主要操作按钮
- 右下：商店/奖励入口

【视觉规范】
- 风格：低保真线框图，黑白灰色调
- 标准：移动端游戏UI设计规范
- 布局：清晰的功能区域划分，易于理解
- 重点：突出核心玩法和业务目标相关功能
"""
        
        return mockup_prompt

# 创建全局实例
event_planning_service = EventPlanningService()
