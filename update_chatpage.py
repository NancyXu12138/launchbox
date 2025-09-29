#!/usr/bin/env python3
import re

# 读取原始文件
with open('src/modules/chat/ChatPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 添加必要的imports
import_additions = """import MarkdownRenderer from '../../components/MarkdownRenderer';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';"""

# 在现有imports后添加新的imports
content = content.replace(
    "import ExtensionIcon from '@mui/icons-material/Extension';",
    f"import ExtensionIcon from '@mui/icons-material/Extension';\n{import_additions}"
)

# 2. 修改skills数组
skills_replacement = """  const skills = [
    { id: 'image_generation', name: '图像生成', description: '生成高质量图像' },
    { id: 'event_planning', name: 'Event Planner', description: '生成专业的游戏活动策划案' },
  ];"""

content = re.sub(
    r'const skills = \[\s*\{ id: \'image_generation\'.*?\},\s*// 可以在这里添加更多技能\s*\];',
    skills_replacement,
    content,
    flags=re.DOTALL
)

# 3. 添加Event Planner状态
state_additions = """  // Event Planner相关状态
  const [eventPlannerDialogOpen, setEventPlannerDialogOpen] = React.useState<boolean>(false);
  const [eventPlannerForm, setEventPlannerForm] = React.useState({
    theme: '',
    overview: '',
    market: '',
    businessGoal: '',
    businessGoalCustom: '',
    targetPlayer: '',
    targetPlayerCustom: '',
    targetRegion: ''
  });

  // 业务目标选项
  const businessGoalOptions = [
    { value: 'revenue', label: '营收增长' },
    { value: 'retention', label: '用户留存' },
    { value: 'acquisition', label: '用户获取' },
    { value: 'engagement', label: '用户活跃' },
    { value: 'custom', label: '自定义' }
  ];

  // 目标玩家选项
  const targetPlayerOptions = [
    { value: 'whale', label: '大R玩家' },
    { value: 'dolphin', label: '中R玩家' },
    { value: 'minnow', label: '小R玩家' },
    { value: 'f2p', label: '免费玩家' },
    { value: 'all', label: '全体玩家' },
    { value: 'custom', label: '自定义' }
  ];

"""

# 在技能定义后添加状态
content = content.replace(
    "  // 获取当前对话的选中指令ID",
    f"{state_additions}  // 获取当前对话的选中指令ID"
)

# 4. 修改消息渲染逻辑，添加Markdown支持
message_render_replacement = """                          {/* 如果消息包含Markdown格式，使用MarkdownRenderer */}
                          {m.text.includes('#') || m.text.includes('**') || m.text.includes('|') ? (
                            <MarkdownRenderer content={m.text} />
                          ) : (
                            <Typography whiteSpace="pre-wrap">{m.text}</Typography>
                          )}"""

content = content.replace(
    "<Typography whiteSpace=\"pre-wrap\">{m.text}</Typography>",
    message_render_replacement
)

# 5. 添加Event Planner处理函数
handler_function = """
  // Event Planner处理函数
  const handleEventPlannerSubmit = async () => {
    setEventPlannerDialogOpen(false);
    
    // 构建用户消息
    const userMessage = `活动策划需求：
主题：${eventPlannerForm.theme}
概要：${eventPlannerForm.overview}
市场：${eventPlannerForm.market}
业务目标：${eventPlannerForm.businessGoal === 'custom' ? eventPlannerForm.businessGoalCustom : eventPlannerForm.businessGoal}
目标玩家：${eventPlannerForm.targetPlayer === 'custom' ? eventPlannerForm.targetPlayerCustom : eventPlannerForm.targetPlayer}
目标区域：${eventPlannerForm.targetRegion}`;

    pushMessage({ role: 'user', text: userMessage });
    
    // 生成唯一ID
    const messageId = generateId();
    const now = Date.now();
    
    // 显示生成中消息
    const generatingMessage: Message = {
      id: messageId,
      role: 'agent',
      text: '正在为您生成专业的活动策划案，请稍候...',
      createdAt: now
    };
    
    upsertConversation(prev => prev.map(c => c.id === activeId ? {
      ...c,
      messages: [...c.messages, generatingMessage],
      updatedAt: now
    } : c));
    
    try {
      // 调用后端API
      const response = await fetch('http://localhost:8001/api/generate-event-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPlannerForm)
      });
      
      const result = await response.json();
      
      // 更新消息
      upsertConversation(prev => prev.map(conv => {
        if (conv.id === activeId) {
          return {
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId
                ? {
                    ...msg,
                    text: result.success 
                      ? result.plan 
                      : `策划案生成失败：${result.error}`
                  }
                : msg
            ),
            updatedAt: Date.now()
          };
        }
        return conv;
      }));
      
    } catch (error) {
      // 错误处理
      upsertConversation(prev => prev.map(conv => {
        if (conv.id === activeId) {
          return {
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId
                ? {
                    ...msg,
                    text: `策划案生成失败：${error instanceof Error ? error.message : String(error)}`
                  }
                : msg
            ),
            updatedAt: Date.now()
          };
        }
        return conv;
      }));
    }
    
    // 重置表单
    setEventPlannerForm({
      theme: '',
      overview: '',
      market: '',
      businessGoal: '',
      businessGoalCustom: '',
      targetPlayer: '',
      targetPlayerCustom: '',
      targetRegion: ''
    });
  };

"""

# 在handleImageGeneration函数前添加Event Planner处理函数
content = content.replace(
    "  // 处理图像生成（通过Action库）",
    f"{handler_function}  // 处理图像生成（通过Action库）"
)

# 6. 修改技能选择逻辑
skill_selection_replacement = """              onClick={() => {
                if (skill.id === 'event_planning') {
                  setEventPlannerDialogOpen(true);
                  setSkillDialogOpen(false);
                } else {
                  setSelectedSkill(skill.id);
                  setSkillDialogOpen(false);
                }
              }}"""

content = content.replace(
    """onClick={() => {
                      setSelectedSkill(skill.id);
                      setSkillDialogOpen(false);
                    }}""",
    skill_selection_replacement
)

# 写入修改后的文件
with open('src/modules/chat/ChatPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("ChatPage.tsx updated successfully!")
