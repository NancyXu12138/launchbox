import React from 'react';
import { Box, Paper, Stack, TextField, IconButton, Typography, Avatar, Button, List, ListItemButton, ListItemText, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Collapse, Divider, Chip, Alert, FormControl, InputLabel, Select, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import SaveIcon from '@mui/icons-material/Save';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAppSettings } from '../../services/settings';
import { backendApiService, ChatMessage as BackendChatMessage } from '../../services/backendApiService';
import { gptImageService, ImageGenerationResult } from '../../services/gptImageService';
import { actionExecutorService, ActionExecutionResult } from '../../services/actionExecutorService';
import { selectBestAction, ACTION_LIBRARY } from '../../../shared/action-library';
import { classifyIntent, quickIntentCheck, IntentResult } from '../../services/intentClassifier';
import { extractParameters, quickExtractParameters } from '../../services/parameterExtractor';
import { selectModelForTask } from '../../services/modelConfig';
import { splitThinking } from '../../utils/thinking';
import { searchKnowledgeBase, formatSearchResultsAsContext, getKnowledgeSources } from '../../services/knowledgeBase';
import { getCommands, CommandItem } from '../../services/commandService';
import BottomTodoPanel, { SimpleTodoList, SimpleTodoItem } from '../../components/BottomTodoPanel';
import ActionResultDisplay from '../../components/ActionResultDisplay';
import { 
  generateSimpleTodoWithLLM, 
  isMultiStepTask, 
  startTodoExecution, 
  completeCurrentAndStartNext,
  updateTodoItemStatus 
} from '../../services/simpleTodoGenerator';
import { createTodoExecutor, TodoExecutor, TodoStepResult } from '../../services/todoExecutionService';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ExtensionIcon from '@mui/icons-material/Extension';
import MarkdownRenderer from '../../components/MarkdownRenderer';

type Message = {
  id: string;
  role: 'user' | 'agent';
  text: string;
  createdAt: number;
  thinking?: string;
  isThinking?: boolean; // 🆕 正在思考中的标记
  isSystemMessage?: boolean; // 🔥 系统消息标记（UI提示，不发送给LLM）
  executionResults?: TodoStepResult[]; // 附加的执行结果
  imageBase64?: string; // 生成的图像数据
  isImageGeneration?: boolean; // 标记是否为图像生成消息
  showEventPlannerButton?: boolean; // 显示Event Planner按钮
  // Event Planner双图支持
  wireframeImage?: string; // 低保真原型图
  designImage?: string; // 高保真设计图
  isEventPlannerResult?: boolean; // 标记是否为Event Planner结果
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = 'launchbox_conversations_v1';
const MEMORY_SETTINGS_KEY = 'launchbox_memory_settings_v1';
const RAG_SETTINGS_KEY = 'launchbox_rag_settings_v1';
const TODOS_STORAGE_KEY = 'launchbox_conversation_todos_v1';
const INPUTS_STORAGE_KEY = 'launchbox_conversation_inputs_v1';
const COMMANDS_STORAGE_KEY = 'launchbox_conversation_commands_v1';

// 内存缓存，用于保存当前会话的图像数据
const imageCache = new Map<string, string>();

// 图片缓存清理函数
const cleanupImageCache = () => {
  const maxCacheSize = 15; // 增加到15张图片
  if (imageCache.size > maxCacheSize) {
    const entries = Array.from(imageCache.entries());
    // 删除最旧的图片（假设按插入顺序）
    const toDelete = entries.slice(0, imageCache.size - maxCacheSize);
    toDelete.forEach(([key]) => imageCache.delete(key));
    console.log(`🧹 清理了${toDelete.length}张缓存图片`);
  }
};

// 下载图片功能
const downloadImage = (base64Data: string, filename: string = 'game-activity-design.png') => {
  try {
    // 移除data:image/png;base64,前缀（如果存在）
    const base64 = base64Data.startsWith('data:image') 
      ? base64Data.split(',')[1] 
      : base64Data;
    
    // 将base64转换为blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ 图片下载成功:', filename);
  } catch (error) {
    console.error('❌ 图片下载失败:', error);
  }
};

// 检查localStorage使用情况
function getLocalStorageUsage(): { used: number; total: number; percentage: number } {
  let used = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      used += localStorage[key].length + key.length;
    }
  }
  
  // 大多数浏览器的localStorage限制是5MB
  const total = 5 * 1024 * 1024; // 5MB in bytes
  const percentage = (used / total) * 100;
  
  return { used, total, percentage };
}

type MemorySettings = {
  maxRounds: number; // 最大保留轮数，0表示无限制
};

type RAGSettings = {
  enabled: boolean;
  maxResults: number;
};

type SpecialMessage = Message & {
  type?: 'command_result' | 'action_result';
  metadata?: {
    commandName?: string;
    actionName?: string;
    actionType?: string;
    executionTime?: number;
    result?: any;
  };
};

const defaultMemorySettings: MemorySettings = {
  maxRounds: 10
};

const defaultRAGSettings: RAGSettings = {
  enabled: true,
  maxResults: 3
};

export default function ChatPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = React.useState<Conversation[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw) as Conversation[];
    // 清理旧的todoMessages字段
    return parsed.map(conv => ({
      id: conv.id,
      title: conv.title,
      messages: conv.messages || [],
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }));
  });
  const [activeId, setActiveId] = React.useState<string | null>(() => conversations[0]?.id ?? null);
  const [conversationInputs, setConversationInputs] = React.useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(INPUTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error('Failed to load conversation inputs:', error);
      return {};
    }
  });
  const [expandedThinking, setExpandedThinking] = React.useState<Record<string, boolean>>({});
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // 自动滚动到最新消息
  const scrollToBottom = (smooth: boolean = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [getActive()?.messages]);

  // 当切换对话时，立即跳转到底部（不使用动画）
  React.useEffect(() => {
    if (activeId) {
      scrollToBottom(false); // 立即跳转，不使用滚动动画
    }
  }, [activeId]);
  
  // 获取当前对话的输入文本
  const input = activeId ? (conversationInputs[activeId] || '') : '';
  
  // 设置当前对话的输入文本
  const setInput = (value: string) => {
    if (activeId) {
      setConversationInputs(prev => ({
        ...prev,
        [activeId]: value
      }));
    }
  };
  
  
  // 底部简单Todo状态 - 按对话ID存储
  const [conversationTodos, setConversationTodos] = React.useState<Record<string, SimpleTodoList>>(() => {
    try {
      const raw = localStorage.getItem(TODOS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error('Failed to load conversation todos:', error);
      return {};
    }
  });
  const [todoExpanded, setTodoExpanded] = React.useState<Record<string, boolean>>({});
  
  // Todo执行器状态
  const [todoExecutors, setTodoExecutors] = React.useState<Record<string, TodoExecutor>>({});
  
  // 上下文问题状态
  const [hasContextIssue, setHasContextIssue] = React.useState<Record<string, boolean>>({});
  const [imageModalOpen, setImageModalOpen] = React.useState<{ open: boolean; src: string }>({ open: false, src: '' });
  
  // Event Planner会话ID
  const [eventPlannerSessionId, setEventPlannerSessionId] = React.useState<string | null>(null);
  
  // 监听执行器状态变化
  React.useEffect(() => {
    console.log('todoExecutors状态变化:', Object.keys(todoExecutors));
  }, [todoExecutors]);
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [menuConvId, setMenuConvId] = React.useState<string | null>(null);
  const isMenuOpen = Boolean(menuAnchor);
  const [renameOpen, setRenameOpen] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState('');
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [clearChatOpen, setClearChatOpen] = React.useState(false);
  const [memorySettingsOpen, setMemorySettingsOpen] = React.useState(false);
  const [ragSettingsOpen, setRAGSettingsOpen] = React.useState(false);
  const [memorySettings, setMemorySettings] = React.useState<MemorySettings>(() => {
    const raw = localStorage.getItem(MEMORY_SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as MemorySettings) : defaultMemorySettings;
  });
  const [ragSettings, setRAGSettings] = React.useState<RAGSettings>(() => {
    const raw = localStorage.getItem(RAG_SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as RAGSettings) : defaultRAGSettings;
  });
  
  // 指令相关状态
  const [commands, setCommands] = React.useState<CommandItem[]>([]);
  const [conversationCommands, setConversationCommands] = React.useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(COMMANDS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.error('Failed to load conversation commands:', error);
      return {};
    }
  });
  const [commandDialogOpen, setCommandDialogOpen] = React.useState(false);
  const [commandSearchText, setCommandSearchText] = React.useState('');
  
  // Event Planner相关状态
  const [eventPlannerDialogOpen, setEventPlannerDialogOpen] = React.useState<boolean>(false);
  const [eventPlannerForm, setEventPlannerForm] = React.useState({
    theme: '',
    overview: '',
    businessGoal: '',
    businessGoalCustom: '',
    targetPlayer: '',
    targetPlayerCustom: '',
    targetRegion: ''
  });

  // 业务目标选项 - 根据用户提供的图片内容
  const businessGoalOptions = [
    { value: 'retention_battle', label: '留存活动 - 对战类活动' },
    { value: 'retention_signin', label: '留存活动 - 登录天数活动' },
    { value: 'retention_dau', label: '留存活动 - 冲高类活动' },
    { value: 'acquisition_return', label: '拉人活动 - 回流活动' },
    { value: 'acquisition_new', label: '拉人活动 - 拉新活动' },
    { value: 'monetization_payment', label: '商业化 - 付费率活动' },
    { value: 'monetization_arppu', label: '商业化 - ARPPU活动' },
    { value: 'custom', label: '自定义' }
  ];

  // 目标玩家选项 - 根据用户提供的图片内容
  const targetPlayerOptions = [
    { value: 'active_low', label: '活跃玩家 - 低活' },
    { value: 'active_medium', label: '活跃玩家 - 中活' },
    { value: 'active_high', label: '活跃玩家 - 高活' },
    { value: 'returning', label: '回流玩家' },
    { value: 'new', label: '新玩家' },
    { value: 'monetization_big_r', label: '商业化 - 大R' },
    { value: 'monetization_medium_r', label: '商业化 - 中R' },
    { value: 'monetization_small_r', label: '商业化 - 小R' },
    { value: 'monetization_non_paying', label: '商业化 - 未付费玩家' },
    { value: 'custom', label: '自定义' }
  ];

  // 获取当前对话的选中指令ID
  const selectedCommandId = activeId ? (conversationCommands[activeId] || '') : '';
  
  // 设置当前对话的选中指令ID
  const setSelectedCommandId = (commandId: string) => {
    if (activeId) {
      setConversationCommands(prev => ({
        ...prev,
        [activeId]: commandId
      }));
    }
  };

  React.useEffect(() => {
    try {
      // 创建一个没有循环引用的conversations副本用于序列化
      const serializableConversations = conversations.map(conv => ({
        ...conv,
        messages: conv.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          text: msg.text,
          createdAt: msg.createdAt,
          thinking: msg.thinking,
          imageBase64: undefined, // 不保存图像数据到localStorage，避免容量溢出
          isImageGeneration: msg.isImageGeneration, // 确保图像生成标记被保存
          // 移除可能包含循环引用的executionResults中的reasoning
          executionResults: msg.executionResults?.map(result => ({
            ...result,
            reasoning: result.reasoning ? {
              shouldProceed: result.reasoning.shouldProceed,
              reasoning: result.reasoning.reasoning,
              waitingForData: result.reasoning.waitingForData,
              // 不包含contextualInfo以避免循环引用
            } : undefined
          }))
        }))
      }));
      
      const dataToSave = JSON.stringify(serializableConversations);
      localStorage.setItem(STORAGE_KEY, dataToSave);
    } catch (error) {
      console.warn('保存conversations到localStorage失败:', error);
      
      // 如果是存储空间不足，尝试清理旧数据后重试
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        const usage = getLocalStorageUsage();
        console.warn(`localStorage空间不足，当前使用: ${(usage.used / 1024 / 1024).toFixed(2)}MB (${usage.percentage.toFixed(1)}%)`);
        console.warn('尝试清理旧数据...');
        try {
          // 清理旧的对话，只保留最近的3个
          const recentConversations = conversations
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 3);
          
          const cleanedData = recentConversations.map(conv => ({
            ...conv,
            messages: conv.messages.map(msg => ({
              id: msg.id,
              role: msg.role,
              text: msg.text,
              createdAt: msg.createdAt,
              thinking: msg.thinking,
              // 对于图像消息，保留标记但完全移除base64数据以节省空间
              imageBase64: undefined,
              isImageGeneration: msg.isImageGeneration,
              executionResults: msg.executionResults?.map(result => ({
                ...result,
                reasoning: result.reasoning ? {
                  shouldProceed: result.reasoning.shouldProceed,
                  reasoning: result.reasoning.reasoning,
                  waitingForData: result.reasoning.waitingForData,
                } : undefined
              }))
            }))
          }));
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedData));
          console.warn('已清理localStorage数据，保留最近3个对话');
        } catch (retryError) {
          console.error('清理localStorage后仍然保存失败:', retryError);
          // 最后的降级方案：完全清空localStorage
          try {
            localStorage.removeItem(STORAGE_KEY);
            console.warn('已清空localStorage中的对话数据');
          } catch (clearError) {
            console.error('清空localStorage失败:', clearError);
          }
        }
      }
    }
  }, [conversations]);

  // 持久化 conversationTodos
  React.useEffect(() => {
    try {
      localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(conversationTodos));
    } catch (error) {
      console.error('Failed to save conversation todos:', error);
    }
  }, [conversationTodos]);

  // 持久化 conversationInputs
  React.useEffect(() => {
    try {
      localStorage.setItem(INPUTS_STORAGE_KEY, JSON.stringify(conversationInputs));
    } catch (error) {
      console.error('Failed to save conversation inputs:', error);
    }
  }, [conversationInputs]);

  // 持久化 conversationCommands
  React.useEffect(() => {
    try {
      localStorage.setItem(COMMANDS_STORAGE_KEY, JSON.stringify(conversationCommands));
    } catch (error) {
      console.error('Failed to save conversation commands:', error);
    }
  }, [conversationCommands]);

  React.useEffect(() => {
    localStorage.setItem(MEMORY_SETTINGS_KEY, JSON.stringify(memorySettings));
  }, [memorySettings]);

  React.useEffect(() => {
    localStorage.setItem(RAG_SETTINGS_KEY, JSON.stringify(ragSettings));
  }, [ragSettings]);

  // 加载指令数据
  React.useEffect(() => {
    setCommands(getCommands());
  }, []);

  function generateId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as Crypto).randomUUID();
    }
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function upsertConversation(updater: (prev: Conversation[]) => Conversation[]): void {
    setConversations(prev => updater(prev));
  }

  function getActive(): Conversation | undefined {
    const conversation = conversations.find(c => c.id === activeId);
    if (!conversation) return undefined;
    
    // 从内存缓存中恢复图像数据
    const messagesWithImages = conversation.messages.map(msg => {
      let updatedMsg = { ...msg };
      
      // 恢复普通图片
      if (msg.isImageGeneration === false && !msg.imageBase64 && imageCache.has(msg.id)) {
        updatedMsg.imageBase64 = imageCache.get(msg.id);
      }
      
      // 恢复Event Planner双图
      if (msg.isEventPlannerResult) {
        if (!msg.wireframeImage && imageCache.has(`${msg.id}_wireframe`)) {
          updatedMsg.wireframeImage = imageCache.get(`${msg.id}_wireframe`);
        }
        if (!msg.designImage && imageCache.has(`${msg.id}_design`)) {
          updatedMsg.designImage = imageCache.get(`${msg.id}_design`);
        }
      }
      
      return updatedMsg;
    });
    
    return {
      ...conversation,
      messages: messagesWithImages
    };
  }
  
  function getCurrentTodo(): SimpleTodoList | null {
    return activeId ? conversationTodos[activeId] || null : null;
  }
  
  function setCurrentTodo(todo: SimpleTodoList | null): void {
    if (activeId) {
      setConversationTodos(prev => {
        if (todo === null) {
          const { [activeId]: removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, [activeId]: todo };
      });
    }
  }
  
  // 🆕 使用函数式更新TodoItem状态（确保基于最新状态）
  function updateCurrentTodoItemStatus(itemId: string, newStatus: SimpleTodoItem['status']): void {
    if (!activeId) return;
    
    setConversationTodos(prev => {
      const currentTodo = prev[activeId];
      if (!currentTodo) return prev;
      
      const updatedTodo = updateTodoItemStatus(currentTodo, itemId, newStatus);
      
      console.log('🔄 函数式更新TodoItem状态:', {
        itemId,
        newStatus,
        before: currentTodo.items.map(i => ({ id: i.id, status: i.status })),
        after: updatedTodo.items.map(i => ({ id: i.id, status: i.status }))
      });
      
      return { ...prev, [activeId]: updatedTodo };
    });
  }

  function pushMessage(partial: Omit<Message, 'id' | 'createdAt'>): void {
    const now = Date.now();
    upsertConversation(prev => prev.map(c => c.id === activeId ? {
      ...c,
      messages: [...c.messages, { id: generateId(), createdAt: now, ...partial }],
      updatedAt: now
    } : c));
  }

  // Event Planner处理函数
  const handleEventPlannerSubmit = async () => {
    if (!eventPlannerSessionId) {
      console.error('Event Planner session ID 不存在');
      return;
    }

    setEventPlannerDialogOpen(false);
    
    // 转换表单数据格式
    const formData = {
      theme: eventPlannerForm.theme,
      overview: eventPlannerForm.overview,
      businessGoal: eventPlannerForm.businessGoal === 'custom' ? eventPlannerForm.businessGoalCustom : eventPlannerForm.businessGoal,
      targetPlayer: eventPlannerForm.targetPlayer === 'custom' ? eventPlannerForm.targetPlayerCustom : eventPlannerForm.targetPlayer,
      targetRegion: eventPlannerForm.targetRegion
    };

    // 构建用户消息
    const userMessage = `活动策划需求：
主题：${formData.theme}
概要：${formData.overview}
业务目标：${formData.businessGoal}
目标玩家：${formData.targetPlayer}
目标区域：${formData.targetRegion}`;

    pushMessage({ role: 'user', text: userMessage });
    
    try {
      await handleEventPlannerFormSubmit(formData);
    } catch (error) {
      console.error('Event Planner提交错误:', error);
      pushMessage({
        role: 'agent',
        text: `处理时发生错误：${error instanceof Error ? error.message : String(error)}`
      });
    }
    
    // 重置表单
    setEventPlannerForm({
      theme: '',
      overview: '',
      businessGoal: '',
      businessGoalCustom: '',
      targetPlayer: '',
      targetPlayerCustom: '',
      targetRegion: ''
    });
  };

  // 处理图像生成（通过Action库）
  async function handleImageGeneration(message: string): Promise<void> {
    const prompt = gptImageService.extractImagePrompt(message);

    // 生成唯一ID
    const messageId = generateId();
    const now = Date.now();

    // 显示生成中的消息
    const generatingMessage: Message = {
      id: messageId,
      role: 'agent',
      text: '正在为您生成图像，请稍候...',
      createdAt: now,
      isImageGeneration: true
    };

    // 直接使用upsertConversation来添加消息，确保ID一致
    upsertConversation(prev => prev.map(c => c.id === activeId ? {
      ...c,
      messages: [...c.messages, generatingMessage],
      updatedAt: now
    } : c));

    try {
      // 通过Action执行服务调用图像生成
      const result = await actionExecutorService.executeImageGeneration(prompt, 1536, 1024);

      // 如果图像生成成功，将图像数据保存到内存缓存
      if (result.success && result.data?.image_base64) {
        imageCache.set(messageId, result.data.image_base64);
      }

      // 更新消息内容
      upsertConversation(prev => prev.map(conv => {
        if (conv.id === activeId) {
          return {
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId
                ? {
                    ...msg,
                    text: result.success
                      ? "已为您生成图像"
                      : `图像生成失败：${result.error}`,
                    imageBase64: result.success ? result.data?.image_base64 : undefined,
                    isImageGeneration: false // 清除生成中标记
                  }
                : msg
            ),
            updatedAt: Date.now()
          };
        }
        return conv;
      }));

    } catch (error) {
      // 更新为错误消息
      upsertConversation(prev => prev.map(conv => {
        if (conv.id === activeId) {
          return {
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId
                ? {
                    ...msg,
                    text: `图像生成失败：${error instanceof Error ? error.message : String(error)}`,
                    isImageGeneration: false // 清除生成中标记
                  }
                : msg
            ),
            updatedAt: Date.now()
          };
        }
        return conv;
      }));
    }
  }

  // Event Planner处理函数
  async function handleEventPlanner(message: string): Promise<void> {
    if (!activeId) return;

    // 生成唯一的session ID用于跟踪Event Planner状态
    const sessionId = `${activeId}_${Date.now()}`;
    
    try {
      // 开始Event Planner流程
      const result = await actionExecutorService.startEventPlanner(sessionId);
      
      if (result.success && result.type === 'event_planner_form') {
        // 显示表单消息
        const formMessage: Message = {
          id: generateId(),
          role: 'agent',
          text: result.message || '请填写活动策划信息',
          createdAt: Date.now()
        };
        
        // 添加消息到对话
        upsertConversation(prev => prev.map(c => c.id === activeId ? {
          ...c,
          messages: [...c.messages, formMessage],
          updatedAt: Date.now()
        } : c));
        
        // 显示Event Planner表单
        showEventPlannerForm(sessionId, result.formConfig);
      } else {
        // 显示错误消息
        pushMessage({
          role: 'agent',
          text: `启动活动策划助手失败：${result.error || '未知错误'}`
        });
      }
    } catch (error) {
      console.error('Event Planner处理错误:', error);
      pushMessage({
        role: 'agent',
        text: `启动活动策划助手时发生错误：${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  // 显示Event Planner表单
  function showEventPlannerForm(sessionId: string, formConfig: any): void {
    setEventPlannerSessionId(sessionId);
    
    // 显示带有按钮的消息
    const formMessage: Message = {
      id: generateId(),
      role: 'agent',
      text: '🎮 **活动策划助手已启动**\n\n请填写活动策划的基本信息：',
      createdAt: Date.now()
    };
    
    // 添加消息到对话，包含一个特殊的按钮组件
    upsertConversation(prev => prev.map(c => c.id === activeId ? {
      ...c,
      messages: [...c.messages, { ...formMessage, showEventPlannerButton: true }],
      updatedAt: Date.now()
    } : c));
  }

  // 打开Event Planner表单弹窗
  function openEventPlannerDialog(): void {
    setEventPlannerDialogOpen(true);
  }
  
  /**
   * 处理通用动作执行
   * @param action 选择的动作
   * @param message 用户消息
   * @returns 如果成功处理了动作，返回true；否则返回false
   */
  function handleActionExecution(action: any, message: string): boolean {
    if (!action) return false;
    
    console.log('处理动作执行:', action.type, message);
    
    // 根据不同的动作类型执行不同的操作
    switch (action.type) {
      case '翻译':
        // 对于翻译请求，使用普通的AI响应，让模型自己处理翻译
        console.log('检测到翻译请求，使用通用AI响应');
        // 不拦截，继续使用普通AI响应处理
        return false;
        
      case '代码解释':
        console.log('检测到代码解释请求');
        // 使用普通AI响应，让模型自行理解并解释代码
        return false;
        
      default:
        console.log(`未特殊处理的动作类型: ${action.type}`);
        // 如果没有特别处理的动作，就返回false，让系统继续使用普通AI响应
        return false;
    }
  }

  // 处理Event Planner方案选择
  async function handleEventPlannerSelection(message: string): Promise<void> {
    if (!eventPlannerSessionId) return;

    try {
      let selection: number | 'regenerate';
      
      if (message.includes('重新生成')) {
        selection = 'regenerate';
      } else if (message.includes('方案1') || message.includes('选择方案1')) {
        selection = 0;
      } else if (message.includes('方案2') || message.includes('选择方案2')) {
        selection = 1;
      } else if (message.includes('方案3') || message.includes('选择方案3')) {
        selection = 2;
      } else {
        pushMessage({
          role: 'agent',
          text: '请选择具体的方案（方案1、方案2、方案3）或输入"重新生成"。'
        });
        return;
      }

      // 显示处理中的消息
      pushMessage({
        role: 'agent',
        text: selection === 'regenerate' ? 
          '正在重新生成活动方案...' : 
          `正在生成方案${(selection as number) + 1}的完整策划案...`
      });

      // 调用方案选择
      const result = await actionExecutorService.selectEventPlan(eventPlannerSessionId, selection);
      console.log('Event Planner方案选择结果:', result);
      
      if (result.success) {
        if (result.type === 'event_planner_plan_ready') {
          // 策划案完成，先显示策划案
          const messageId = generateId();
          
          const message: Message = {
            id: messageId,
            role: 'agent',
            text: result.data?.fullPlan || '策划案生成完成',
            createdAt: Date.now(),
          };
          
          // 添加策划案消息
          upsertConversation(prev => prev.map(c => c.id === activeId ? {
            ...c,
            messages: [...c.messages, message],
            updatedAt: Date.now()
          } : c));
          
          // 异步生成UI设计图
          if (result.data?.sessionId) {
            // 立即显示loading提示
            const loadingMessageId = generateId();
            const loadingMessage: Message = {
              id: loadingMessageId,
              role: 'agent',
              text: '🎨 正在生成UI设计图，请稍候...\n\n📐 生成低保真原型图中...',
              createdAt: Date.now(),
            };
            
            upsertConversation(prev => prev.map(c => c.id === activeId ? {
              ...c,
              messages: [...c.messages, loadingMessage],
              updatedAt: Date.now()
            } : c));
            
            setTimeout(async () => {
              try {
                console.log('🎨 开始异步生成UI设计图...');
                
                // 更新loading状态
                upsertConversation(prev => prev.map(c => c.id === activeId ? {
                  ...c,
                  messages: c.messages.map(msg => 
                    msg.id === loadingMessageId 
                      ? { ...msg, text: '🎨 正在生成UI设计图，请稍候...\n\n🤖 分析设计构思中...' }
                      : msg
                  ),
                  updatedAt: Date.now()
                } : c));
                
                const uiResult = await actionExecutorService.generateEventMockupAsync(result.data.sessionId);
                
                if (uiResult.success) {
                  // 生成UI成功，替换loading消息为图片消息
                  const uiMessage: Message = {
                    id: loadingMessageId, // 复用loading消息的ID
                    role: 'agent',
                    text: '🎨 UI设计方案已完成',
                    createdAt: Date.now(),
                    isEventPlannerResult: true,
                    wireframeImage: uiResult.data?.wireframe,
                    designImage: uiResult.data?.design,
                    imageBase64: uiResult.data?.design || uiResult.data?.wireframe
                  };
                  
                  // 替换loading消息为UI消息
                  upsertConversation(prev => prev.map(c => c.id === activeId ? {
                    ...c,
                    messages: c.messages.map(msg => 
                      msg.id === loadingMessageId ? uiMessage : msg
                    ),
                    updatedAt: Date.now()
                  } : c));
                  
                  // 缓存图片（不保存到localStorage，只保存到内存）
                  if (uiResult.data?.wireframe) {
                    imageCache.set(`${loadingMessageId}_wireframe`, uiResult.data.wireframe);
                  }
                  if (uiResult.data?.design) {
                    imageCache.set(`${loadingMessageId}_design`, uiResult.data.design);
                    imageCache.set(loadingMessageId, uiResult.data.design);
                  }
                  
                  cleanupImageCache();
                } else {
                  // UI生成失败，替换loading消息为错误消息
                  const errorMessage: Message = {
                    id: loadingMessageId, // 复用loading消息的ID
                    role: 'agent',
                    text: `❌ UI设计图生成失败：${uiResult.error}`,
                    createdAt: Date.now(),
                  };
                  
                  upsertConversation(prev => prev.map(c => c.id === activeId ? {
                    ...c,
                    messages: c.messages.map(msg => 
                      msg.id === loadingMessageId ? errorMessage : msg
                    ),
                    updatedAt: Date.now()
                  } : c));
                }
              } catch (error) {
                console.error('异步UI生成失败:', error);
                const errorMessage: Message = {
                  id: loadingMessageId, // 复用loading消息的ID
                  role: 'agent',
                  text: `❌ UI设计图生成失败：${error instanceof Error ? error.message : String(error)}`,
                  createdAt: Date.now(),
                };
                
                upsertConversation(prev => prev.map(c => c.id === activeId ? {
                  ...c,
                  messages: c.messages.map(msg => 
                    msg.id === loadingMessageId ? errorMessage : msg
                  ),
                  updatedAt: Date.now()
                } : c));
              }
            }, 1000); // 1秒后开始生成UI
          }
          
          // 清理session
          setEventPlannerSessionId(null);
        } else if (result.type === 'event_planner_complete') {
          // 生成消息ID用于图像缓存
          const messageId = generateId();
          
          // 显示完整策划案
          const message: Message = {
            id: messageId,
            role: 'agent',
            text: result.data?.fullPlan || '策划案生成完成',
            createdAt: Date.now(),
            isEventPlannerResult: true,
            // 双图支持
            wireframeImage: result.data?.wireframe,
            designImage: result.data?.design,
            // 向后兼容
            imageBase64: result.data?.uiMockup || result.data?.imageUrl || result.data?.image_base64
          };
          
          // 添加消息到对话
          upsertConversation(prev => prev.map(c => c.id === activeId ? {
            ...c,
            messages: [...c.messages, message],
            updatedAt: Date.now()
          } : c));
          
          // 优化图片缓存策略 - 只缓存设计图作为主图，避免重复存储
          if (result.data?.wireframe) {
            imageCache.set(`${messageId}_wireframe`, result.data.wireframe);
          }
          if (result.data?.design) {
            imageCache.set(`${messageId}_design`, result.data.design);
            // 设计图也作为主图缓存，避免重复存储
            imageCache.set(messageId, result.data.design);
          } else if (result.data?.wireframe) {
            // 如果没有设计图，使用原型图作为主图
            imageCache.set(messageId, result.data.wireframe);
          }
          
          // 清理过多的图片缓存
          cleanupImageCache();
          
          // 检查localStorage使用情况，如果接近限制则提前清理
          const usage = getLocalStorageUsage();
          if (usage.percentage > 80) {
            console.warn(`⚠️ localStorage使用率过高: ${usage.percentage.toFixed(1)}%，开始清理...`);
            // 清理图片缓存
            imageCache.clear();
            console.log('🧹 已清理所有图片缓存');
          }
          
          // 清理session
          setEventPlannerSessionId(null);
        } else if (result.type === 'event_planner_selection') {
          // 重新生成的情况，显示新的方案选择
          const overviewsText = result.data?.overviews?.map((overview: any, index: number) => 
            `**方案 ${index + 1}：${overview.title}**\n${overview.description}\n\n**核心玩法：**\n${overview.coreGameplay}`
          ).join('\n\n---\n\n');

          pushMessage({
            role: 'agent',
            text: `🎯 **已重新生成3个活动策划方案供您选择：**\n\n${overviewsText}\n\n请回复 "选择方案1"、"选择方案2"、"选择方案3" 或 "重新生成" 来继续。`
          });
        }
      } else {
        pushMessage({
          role: 'agent',
          text: `处理失败：${result.error}`
        });
      }
    } catch (error) {
      console.error('Event Planner方案选择错误:', error);
      pushMessage({
        role: 'agent',
        text: `处理时发生错误：${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  // 处理Event Planner表单提交
  async function handleEventPlannerFormSubmit(formData: any): Promise<void> {
    if (!eventPlannerSessionId) return;

    try {
      // 显示处理中的消息
      pushMessage({
        role: 'agent',
        text: '正在根据您的需求生成活动策划方案，请稍候...'
      });

      // 提交表单数据
      const result = await actionExecutorService.submitEventPlannerForm(eventPlannerSessionId, formData);
      
      if (result.success) {
        if (result.type === 'event_planner_selection' && result.data?.overviews) {
          // 显示3个概览方案
          const overviewsText = result.data.overviews.map((overview: any, index: number) => 
            `**方案 ${index + 1}：${overview.title}**\n${overview.description}\n\n**核心玩法：**\n${overview.coreGameplay}`
          ).join('\n\n---\n\n');

          pushMessage({
            role: 'agent',
            text: `🎯 **已生成3个活动策划方案供您选择：**\n\n${overviewsText}\n\n请回复 "选择方案1"、"选择方案2"、"选择方案3" 或 "重新生成" 来继续。`
          });
        } else {
          pushMessage({
            role: 'agent',
            text: result.message || '处理完成'
          });
        }
      } else {
        pushMessage({
          role: 'agent',
          text: `处理失败：${result.error}`
        });
      }
    } catch (error) {
      console.error('Event Planner表单提交错误:', error);
      pushMessage({
        role: 'agent',
        text: `处理时发生错误：${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  /**
   * 处理AI响应
   * @param overridePrompt 可选的覆盖提示词，用于Closing the Loop场景
   * @param reuseAssistantId 可选的已存在的assistantId，用于复用loading消息
   * @param currentUserMessage 可选的当前用户消息，避免从状态中读取（解决异步问题）
   */
  async function handleAIResponse(overridePrompt?: string, reuseAssistantId?: string, currentUserMessage?: string): Promise<void> {
    if (!activeId) {
      const firstMessage = getActive()?.messages?.[0]?.text;
      handleNewConversation(firstMessage?.slice(0, 12) || '新对话');
    }

    const currentMessages = getActive()?.messages ?? [];
    // 🔥 修复：优先使用传入的currentUserMessage，避免从异步状态中读取
    const lastUserMessage = overridePrompt || currentUserMessage || currentMessages.filter(m => m.role === 'user').pop()?.text || '';
    
    // 调试日志
    if (currentUserMessage) {
      console.log('✅ 使用传入的currentUserMessage:', currentUserMessage.substring(0, 50));
    } else if (!overridePrompt) {
      console.log('⚠️ 从历史消息中获取lastUserMessage:', lastUserMessage.substring(0, 50));
    }
    
    // RAG检索（如果启用，且没有overridePrompt）
    let contextualPrompt = lastUserMessage;
    if (!overridePrompt && ragSettings.enabled) {
      try {
        const knowledgeSources = getKnowledgeSources();
        if (knowledgeSources.some(source => source.status === 'active')) {
          const searchResults = await searchKnowledgeBase(lastUserMessage, ragSettings.maxResults);
          if (searchResults.length > 0) {
            const context = formatSearchResultsAsContext(searchResults);
            contextualPrompt = `${context}\n\n${lastUserMessage}`;
            console.log('✅ RAG上下文已添加');
          }
        }
      } catch (error) {
        console.error('RAG检索失败:', error);
      }
    } else if (overridePrompt) {
      // 使用override prompt（Closing the Loop场景）
      contextualPrompt = overridePrompt;
    }

    const appSettings = getAppSettings();
    const assistantId = reuseAssistantId || generateId();  // 复用或创建新ID
    const startTs = Date.now();
    
    // 只有在没有复用ID时才创建新消息
    if (!reuseAssistantId) {
      // 创建助手消息（带loading状态）
    upsertConversation(prev => prev.map(c => c.id === activeId ? {
      ...c,
        messages: [...c.messages, { 
          id: assistantId, 
          role: 'agent', 
          text: '', 
          createdAt: startTs,
          isThinking: true
        }],
      updatedAt: startTs
    } : c));
    } else {
      // 复用现有消息，只需要确保isThinking状态正确
      upsertConversation(prev => prev.map(c => c.id === activeId ? {
        ...c,
        messages: c.messages.map(m => m.id === assistantId ? {
          ...m,
          text: '',  // 清空之前的"正在执行..."文本
          isThinking: true
        } : m),
        updatedAt: startTs
      } : c));
    }

    try {
      // 使用后端OpenAI API（统一路径）
        const trimmedMessages = trimMessagesForMemory(currentMessages);
        
      // 🔥 关键修复：过滤系统消息（执行日志/UI提示），只保留真实对话
      const conversationMessages = trimmedMessages.filter(m => {
        // 过滤掉系统消息
        if (m.isSystemMessage) return false;
        
        // 过滤掉包含系统提示符号的消息（额外保护）
        const systemPatterns = ['📋', '🚀', '⏸️', '任务执行计划', '开始执行任务', '任务执行已暂停'];
        if (systemPatterns.some(pattern => m.text.includes(pattern))) return false;
        
        // 保留真实的对话内容
        return true;
      });
      
      // 🆕 Token预算管理：限制最近N轮对话（建议6-10轮，即12-20条消息）
      const MAX_CONTEXT_MESSAGES = 12; // 6轮对话
      const contextMessages = conversationMessages.slice(-MAX_CONTEXT_MESSAGES);
      
      console.log('📝 上下文管理:', {
        原始消息数: currentMessages.length,
        过滤后消息数: conversationMessages.length,
        发送消息数: contextMessages.length,
        已过滤系统消息: currentMessages.length - conversationMessages.length
      });
      
      // 🆕 修复：处理overridePrompt场景（Closing the Loop）
      let backendMessages: BackendChatMessage[];
      
      if (overridePrompt) {
        // Closing the Loop场景：只发送增强提示词，不包含历史
        // 这样LLM可以专注于基于工具结果生成解释
        backendMessages = [{
          role: 'user',
          content: contextualPrompt
        }];
        console.log('🔄 Closing the Loop模式，不包含历史');
      } else {
        // 🔥 强化System Prompt：使用MUST规则，明确职责分离
        const systemMessage: BackendChatMessage = {
          role: 'system',
          content: `You are a professional AI assistant. Follow these rules STRICTLY:

【MUST FOLLOW】
1. The user's LAST message is THE ONLY question you need to answer
2. Previous conversation is ONLY for reference when explicitly needed
3. DO NOT mix topics from history into unrelated new questions

【Context Usage Rules】
✅ MUST use history when:
- User explicitly refers: "the previous", "that result", "continue", "based on above"
- User uses pronouns: "it", "this", "that" (need to find referent in history)
- User is clearly continuing the same topic

❌ MUST NOT use history when:
- Completely new independent question (e.g., "translate X", "calculate Y", "what is Z")
- Topic completely switches (from game discussion to weather)
- No reference to previous content

【Critical Examples】
BAD ❌:
User history: discussed math calculation
User now: translate "hello" to Spanish
Wrong answer: Based on the calculation result above...
Correct answer: Hola

BAD ❌:
User history: asked about Godot engine
User now: search for current events
Wrong answer: Godot is a game engine, regarding current events...
Correct answer: I cannot search real-time information...

【Output Requirements】
- Direct, accurate, concise
- NEVER fabricate information
- If uncertain, say "I'm not sure" instead of guessing
- Keep your answer focused ONLY on the latest user question

Now, answer ONLY the user's latest question below.`
        };
        
        // 构建消息列表：system + 历史 + 当前
        backendMessages = [
          systemMessage,
          ...contextMessages.map(m => ({
            role: m.role === 'agent' ? 'assistant' as const : 'user' as const,
            content: m.text
          })),
          {
            role: 'user',
            content: contextualPrompt
          }
        ];
        
        console.log('💬 发送给LLM的消息:', {
          '真实对话轮数': Math.floor(contextMessages.length / 2),
          '发送消息数': contextMessages.length,
          '当前问题': lastUserMessage.substring(0, 50) + (lastUserMessage.length > 50 ? '...' : ''),
          '使用RAG': contextualPrompt !== lastUserMessage,
          '总消息数（含system）': backendMessages.length,
          '强化System Prompt': true
        });
      }

        // 使用流式API
      let streamBuffer = '';  // 节流缓冲区
      let fullContent = '';   // 完整内容累积器（解决竞态条件）
        let lastUpdateTime = 0;
        const UPDATE_THROTTLE = 50; // 50ms更新一次，减少渲染压力
        
        await backendApiService.startStreamingChat(
          backendMessages,
          (chunk: string) => {
            // 处理流式响应块
            streamBuffer += chunk;
          fullContent += chunk;  // 累积完整内容
            const now = Date.now();
            
          // 节流：避免过于频繁的更新导致无限循环
            if (now - lastUpdateTime < UPDATE_THROTTLE) {
              return; // 跳过本次更新
            }
            
            lastUpdateTime = now;
          
          // 直接使用fullContent，避免依赖React状态
          const { visible, thinking } = splitThinking(fullContent);
          
            upsertConversation(prev => prev.map(c => {
              if (c.id !== activeId) return c;
              const nextMessages = c.messages.map(m => {
                if (m.id !== assistantId) return m;
              
              return { 
                ...m, 
                text: visible, 
                thinking,
                isThinking: false
              };
              });
              streamBuffer = ''; // 清空缓冲区
              return { ...c, messages: nextMessages, updatedAt: now };
            }));
          },
          () => {
          // 完成回调 - 使用fullContent确保所有内容都显示
          const { visible, thinking } = splitThinking(fullContent);
          
          // 最终更新：确保所有内容显示，清除loading状态
          upsertConversation(prev => prev.map(c => {
            if (c.id !== activeId) return c;
            const nextMessages = c.messages.map(m => {
              if (m.id !== assistantId) return m;
              
              return { 
                ...m, 
                text: visible, 
                thinking,
                isThinking: false
              };
            });
            return { ...c, messages: nextMessages, updatedAt: Date.now() };
          }));
          
          // 清空所有变量
          streamBuffer = '';
          fullContent = '';
        },
        (error: string) => {
          // 错误回调
          console.error('❌ Backend streaming error:', error);
          pushMessage({ role: 'agent', text: `❌ 后端API调用失败: ${error}` });
        }
      );
    } catch (e) {
      const err = e as Error;
      pushMessage({ role: 'agent', text: `❌ 调用后端API失败: ${err.message}` });
    }
  }

  function handleNewConversation(initialTitle?: string): void {
    const now = Date.now();
    const id = generateId();
    const newConv: Conversation = { id, title: initialTitle || '新对话', messages: [], createdAt: now, updatedAt: now };
    setConversations(prev => [newConv, ...prev]);
    setActiveId(id);
  }

  async function handleNewConversationAndSend(message: string): Promise<void> {
    const now = Date.now();
    const id = generateId();
    const newConv: Conversation = { id, title: '新对话', messages: [], createdAt: now, updatedAt: now };
    
    // 同步创建对话并设置为活跃
    setConversations(prev => [newConv, ...prev]);
    setActiveId(id);
    
    // 等待状态更新，然后发送消息
    // 使用 React 的批处理机制，在下一个事件循环中执行
    setTimeout(async () => {
      await handleIntelligentSend(message);
    }, 0);
  }

  function handleRenameConversation(id: string, title: string): void {
    upsertConversation(prev => prev.map(c => c.id === id ? { ...c, title, updatedAt: Date.now() } : c));
  }

  function handleDeleteConversation(id: string): void {
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      // 如果删除的是当前活跃对话，需要切换到其他对话
      if (activeId === id) {
        setActiveId(updated[0]?.id ?? null);
      }
      return updated;
    });
    
    // 清除被删除对话的相关数据
    setConversationTodos(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
    
    setTodoExpanded(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
    
    setTodoExecutors(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
    
    // 清除输入框和指令选择状态
    setConversationInputs(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
    
    setConversationCommands(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  }

  function handleClearCurrentChat(): void {
    if (!activeId) return;
    
    // 清除聊天记录
    setConversations(prev => prev.map(c => 
      c.id === activeId 
        ? { ...c, messages: [], updatedAt: Date.now() }
        : c
    ));
    
    // 清除思考过程展开状态
    setExpandedThinking({});
    
    // 清除当前对话的Todo数据
    setConversationTodos(prev => {
      const { [activeId]: removed, ...rest } = prev;
      return rest;
    });
    
    // 清除当前对话的Todo展开状态
    setTodoExpanded(prev => {
      const { [activeId]: removed, ...rest } = prev;
      return rest;
    });
    
    // 清除当前对话的Todo执行器
    console.log('handleClearCurrentChat: 清除执行器', activeId);
    setTodoExecutors(prev => {
      const { [activeId]: removed, ...rest } = prev;
      console.log('清除执行器后剩余:', Object.keys(rest));
      return rest;
    });
    
    // 清除当前对话的输入框和指令选择状态
    setConversationInputs(prev => {
      const { [activeId]: removed, ...rest } = prev;
      return rest;
    });
    
    setConversationCommands(prev => {
      const { [activeId]: removed, ...rest } = prev;
      return rest;
    });
  }

  async function handleSend(): Promise<void> {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // 如果没有活跃对话，创建一个新对话并发送消息
    if (!activeId) {
      handleNewConversationAndSend(userMessage);
      return;
    }
    
    // 统一处理所有输入
    await handleIntelligentSend(userMessage);
  }

  async function handleIntelligentSend(message: string): Promise<void> {
    pushMessage({ role: 'user', text: message });
    
    // 首先检查是否有待处理的用户输入任务
    const pendingUserInput = checkForPendingUserInput();
    if (pendingUserInput) {
      // 处理用户输入响应
      await handleUserInputResponse(pendingUserInput, message);
      return;
    }
    
    // 检查Event Planner方案选择（优先级最高，因为在特定会话状态中）
    if (eventPlannerSessionId && (
      message.includes('选择方案') || 
      message.includes('重新生成') ||
      message.includes('方案1') ||
      message.includes('方案2') ||
      message.includes('方案3') ||
      /方案\s*[123]/.test(message)
    )) {
      await handleEventPlannerSelection(message);
      return;
    }
    
    // 步骤0：检查是否选择了指令模板（优先级最高）
    if (selectedCommandId) {
      // 指令模板应该总是走workflow逻辑，生成todolist
      await handleWorkflowTask(message);
      return;
    }
    
    // 步骤1：智能意图识别
    let intentResult: IntentResult;
    
    try {
      // 使用快速关键词检测作为第一道防线
      const quickIntent = quickIntentCheck(message);
      
      // 对于高置信度的结果，直接使用；否则调用LLM进一步确认
      if (quickIntent.confidence >= 0.8) {
        intentResult = quickIntent;
      } else {
        // 调用LLM进行更精确的意图分类
        intentResult = await classifyIntent(message);
      }
    } catch (error) {
      console.error('意图识别失败:', error);
      intentResult = quickIntentCheck(message);
    }
    
    // 步骤2：根据意图路由到不同的处理器
    switch (intentResult.intent) {
      case 'tool_call':
        // 单工具调用
        await handleToolCall(intentResult.toolId, message);
        return;
        
      case 'workflow':
        // 复杂任务，尝试生成Todo
        await handleWorkflowTask(message);
        return;
        
      case 'clarify':
        // 需要更多信息
        pushMessage({ 
          role: 'agent', 
          text: `请提供更多信息以便我更好地帮助您${intentResult.missingFields ? `：${intentResult.missingFields.join('、')}` : ''}` 
        });
        return;
        
      case 'text_answer':
      default:
        // 默认：普通AI回复
        await handleAIResponse(undefined, undefined, message); // 🔥 传递当前消息
        return;
    }
  }
  
  /**
   * 🔄 Closing the Loop: 将工具执行结果传给LLM生成详细解释
   * 
   * 这是流程图中的核心机制：
   * 工具执行 → 获得准确结果 → LLM基于结果做详细说明
   * 
   * @param toolResult 工具执行的结果
   * @param userMessage 用户的原始问题
   * @param toolId 工具ID
   */
  async function closingTheLoopWithLLM(
    toolResult: any,
    userMessage: string,
    toolId: string,
    existingAssistantId: string  // 复用已存在的assistantId
  ): Promise<void> {
    
    const toolName = ACTION_LIBRARY.find(a => a.id === toolId)?.name || toolId;
    const toolData = JSON.stringify(toolResult.data, null, 2);
    
    // 构建增强提示词：包含工具结果 + 用户原始请求
    const enhancedPrompt = `【系统消息 - 工具执行结果】

工具名称：${toolName}
工具ID：${toolId}
执行状态：✅ 成功
执行时间：${new Date().toLocaleString('zh-CN')}

工具返回的准确结果：
\`\`\`json
${toolData}
\`\`\`

【用户的原始请求】
${userMessage}

【你的任务】
请基于上述工具提供的准确结果，为用户提供详细的解释和回答。

重要要求：
1. ✅ 使用工具提供的准确数据，不要自己重新计算
2. 📋 如果用户要求步骤，提供清晰的计算或处理步骤
3. 💡 用通俗易懂的语言解释，使用自然语言描述（例如："8乘以8等于64"）
4. 🎯 直接回答用户的问题，不要重复工具结果的JSON格式
5. ❌ 不要使用LaTeX数学公式（如\\frac、\\times等），使用普通文字和符号（×、÷、=）

开始回答：`;
    
    // 调用LLM，传入增强提示词和已存在的assistantId
    await handleAIResponse(enhancedPrompt, existingAssistantId);
  }

  /**
   * 处理工具调用
   */
  async function handleToolCall(toolId: string | undefined, message: string): Promise<void> {
    if (!toolId) {
      console.error('toolId为空，无法调用工具');
      await handleAIResponse(undefined, undefined, message); // 🔥 传递当前消息
        return;
    }
    
    // 特殊工具：图像生成
    if (toolId === 'gpt_image_gen') {
      await handleImageGeneration(message);
        return;
    }
    
    // 特殊工具：Event Planner
    if (toolId === 'event_planning') {
      await handleEventPlanner(message);
      return;
    }
    
    // 通用工具调用：calculator, text_processor, etc.
    try {
      // 智能参数提取：先尝试快速提取，失败则用LLM提取
      let parameters: any = quickExtractParameters(toolId, message);
      
      if (!parameters) {
        try {
          parameters = await extractParameters(toolId, message);
          
          // 验证参数是否有效
          if (!parameters || Object.keys(parameters).length === 0) {
            await handleAIResponse(undefined, undefined, message); // 🔥 传递当前消息
            return;
          }
        } catch (error) {
          console.error('参数提取失败:', error);
          await handleAIResponse(undefined, undefined, message); // 🔥 传递当前消息
          return;
        }
      }
      
      // 创建助手消息（带loading状态）
      const assistantId = generateId();
      const now = Date.now();
      upsertConversation(prev => prev.map(c => c.id === activeId ? {
        ...c,
        messages: [...c.messages, {
          id: assistantId,
          role: 'agent',
          text: `正在执行${ACTION_LIBRARY.find(a => a.id === toolId)?.name || toolId}...`,
          createdAt: now,
          isThinking: true
        }],
        updatedAt: now
      } : c));
      
      // 执行Action
      const result = await actionExecutorService.executeAction({
        action_id: toolId,
        action_name: ACTION_LIBRARY.find(a => a.id === toolId)?.name || toolId,
        action_type: ACTION_LIBRARY.find(a => a.id === toolId)?.type || 'code_execution',
        parameters
      });
      
      // 判断是否需要LLM详细解释（Closing the Loop）
      const needsExplanation = message.includes('步骤') || message.includes('过程') || 
                               message.includes('解释') || message.includes('详细') ||
                               message.includes('为什么') || message.includes('怎么') ||
                               message.includes('原理') || message.includes('方法');
      
      if (result.success) {
        if (needsExplanation) {
          // Closing the Loop: 保留loading消息，让handleAIResponse复用
          // 将assistantId传递给closingTheLoopWithLLM
          await closingTheLoopWithLLM(result, message, toolId, assistantId);
        } else {
          // 📊 直接显示工具结果：清除loading，显示结果
          upsertConversation(prev => prev.map(conv => {
            if (conv.id === activeId) {
              return {
                ...conv,
                messages: conv.messages.filter(msg => msg.id !== assistantId),
                updatedAt: Date.now()
              };
            }
            return conv;
          }));
          
          // 直接显示工具结果
          let displayText = '';
          if (toolId === 'calculator') {
            displayText = `计算结果：${result.data?.result}\n\n表达式：${parameters.expression}`;
          } else {
            displayText = result.data?.result || result.data?.response || JSON.stringify(result.data);
          }
          
          pushMessage({
            role: 'agent',
            text: displayText
          });
        }
      } else {
        // 工具执行失败，降级到LLM处理
        upsertConversation(prev => prev.map(conv => {
          if (conv.id === activeId) {
            return {
              ...conv,
              messages: conv.messages.filter(msg => msg.id !== assistantId),
              updatedAt: Date.now()
            };
          }
          return conv;
        }));
        await handleAIResponse(undefined, undefined, message); // 🔥 传递当前消息
      }
    } catch (error) {
      console.error('工具调用异常:', error);
      // 失败时也切换到LLM处理
      await handleAIResponse(undefined, undefined, message); // 🔥 传递当前消息
    }
  }
  
  /**
   * 处理需要工作流的复杂任务
   */
  async function handleWorkflowTask(message: string): Promise<void> {
    // 检查是否选择了指令模板
    const selectedCommand = selectedCommandId ? commands.find(cmd => cmd.id === selectedCommandId) : null;
    
    // 如果选择了指令模板，或者是复杂任务，则生成Todo
    const shouldGenerateTodo = selectedCommand || message.length > 50;
    
    if (shouldGenerateTodo) { // 启用TODO功能
      // 显示固定的计划制定消息
      const templateInfo = selectedCommand?.name ? `（基于指令模板：${selectedCommand?.name}）` : '';
      pushMessage({ 
        role: 'agent', 
          text: `已经收到你的需求${templateInfo}，正在制定计划…`,
          isSystemMessage: true // 🔥 系统提示
      });
      
      try {
        let enhancedMessage = message;
        
        if (selectedCommand?.name && selectedCommand?.todoList) {
          enhancedMessage = `请按照以下指令模板制定详细的执行计划：

指令模板：${selectedCommand?.name}
任务步骤：
${selectedCommand?.todoList}

用户需求：${message}

请根据用户的具体需求，参考上述模板步骤，制定详细的执行计划。`;
        }
        
        const simpleTodo = await generateSimpleTodoWithLLM(enhancedMessage);
        if (simpleTodo && activeId) {
          console.log('✅ 生成Todo成功，activeId:', activeId);
          // 只设置Todo，保持draft状态，等待用户手动确认执行
          setCurrentTodo(simpleTodo);
          
          // 显示计划生成完成的消息
          const finalTemplateInfo = selectedCommand?.name ? `（基于指令模板：${selectedCommand?.name}）` : '';
          pushMessage({ 
            role: 'agent', 
            text: `📋 任务执行计划已生成${finalTemplateInfo}，共${simpleTodo?.totalSteps || 0}个步骤。请点击"开始执行"按钮来启动任务。`,
            isSystemMessage: true // 🔥 系统提示，不发送给LLM
          });
          
          // 清除选中的指令
          setSelectedCommandId('');
        } else {
          console.error('❌ 生成Todo失败或activeId为空:', { simpleTodo: !!simpleTodo, activeId });
          // 🆕 如果生成失败，清除指令选择并提示用户
          setSelectedCommandId('');
          pushMessage({ 
            role: 'agent', 
            text: '抱歉，无法生成任务执行计划。让我直接为您处理这个请求...',
            isSystemMessage: true // 🔥 系统提示
          });
          // 降级到正常AI回复
          await handleAIResponse(undefined, undefined, message); // 🔥 传递当前消息
        }
      } catch (error) {
        console.error('❌ 生成简单Todo失败:', error);
        // 清除指令选择
        setSelectedCommandId('');
        pushMessage({ 
          role: 'agent', 
          text: '抱歉，生成执行计划时遇到问题。让我直接为您处理...',
          isSystemMessage: true // 🔥 系统提示
        });
        // 如果生成失败，继续正常AI回复
        await handleAIResponse(undefined, undefined, message); // 🔥 传递当前消息
      }
    } else {
      // 正常AI回复
      await handleAIResponse(undefined, undefined, message); // 🔥 传递当前消息
    }
  }
  
  // 检查是否有待处理的用户输入任务
  function checkForPendingUserInput(): string | null {
    const active = getActive();
    if (!active) return null;
    
    // 🆕 首先检查是否有对应的executor（必须有正在运行的todo）
    if (!activeId || !todoExecutors[activeId]) {
      return null; // 没有executor，不处理用户输入
    }
    
    // 查找最后一条包含AWAITING_USER_INPUT的消息
    for (let i = active.messages.length - 1; i >= 0; i--) {
      const message = active.messages[i];
      if (message.executionResults) {
        for (const result of message.executionResults) {
          if (result.error && result.error.startsWith('AWAITING_USER_INPUT:')) {
            return result.error.split(':')[1]; // 返回stepId
          }
        }
      }
    }
    
    return null;
  }
  
  // 处理用户输入响应
  async function handleUserInputResponse(stepId: string, userResponse: string): Promise<void> {
    if (!activeId) {
      console.error('activeId为空，无法处理用户输入');
      return;
    }
    
    console.log('处理用户输入响应:', { stepId, userResponse, activeId });
    console.log('当前所有执行器:', Object.keys(todoExecutors));
    console.log('当前Todo状态:', getCurrentTodo());
    
    // 获取对应的执行器
    const executor = todoExecutors[activeId];
    console.log('找到的执行器:', !!executor);
    
    if (executor) {
      // 调用执行器的handleUserInput方法
      console.log('调用执行器的handleUserInput方法');
      await executor.handleUserInput(stepId, userResponse);
      console.log('执行器handleUserInput完成');
    } else {
      console.error('未找到对应的Todo执行器，这可能是因为:', { 
        activeId, 
        availableExecutors: Object.keys(todoExecutors),
        todoExecutorsCount: Object.keys(todoExecutors).length,
        currentTodo: !!getCurrentTodo(),
        reason: 'executor已被清理或未创建，将使用正常AI回复'
      });
      // 🆕 降级处理：如果找不到executor，当作正常消息处理
      await handleAIResponse(undefined, undefined, userResponse); // 🔥 传递当前消息
    }
  }
  
  // 强制继续下一步
  function handleForceNext(): void {
    const currentTodo = getCurrentTodo();
    if (currentTodo && activeId) {
      const executor = todoExecutors[activeId];
      if (executor) {
        // 清除上下文问题状态
        setHasContextIssue(prev => ({ ...prev, [activeId]: false }));
        
        // 强制执行下一步
        executor.forceNextStep().catch(error => {
          console.error('强制继续失败:', error);
          pushMessage({ 
            role: 'agent', 
            text: `❌ 强制继续失败: ${error.message}` 
          });
        });
        
        // 显示强制继续消息
        pushMessage({ 
          role: 'agent', 
          text: `🔄 强制继续执行，忽略上下文问题...` 
        });
      }
    }
  }

  // 底部Todo操作处理函数
  function handleBottomTodoStart(): void {
    const currentTodo = getCurrentTodo();
    if (currentTodo && activeId) {
      // 检查是否已存在executor（暂停后继续的情况）
      const existingExecutor = todoExecutors[activeId];
      
      if (existingExecutor) {
        // 📌 复用已存在的executor，不要重新创建
        console.log('♻️ 复用已存在的Executor');
        
        // 更新Todo状态为运行中（保留已完成步骤的状态）
        const resumedTodo = { 
          ...currentTodo, 
          status: 'running' as const,
          userConfirmed: true,
          hasStarted: true
        };
        setCurrentTodo(resumedTodo);
        
        // 继续执行
        existingExecutor.resume();
        
        pushMessage({ 
          role: 'agent', 
          text: `▶️ 继续执行任务...`,
          isSystemMessage: true // 🔥 系统提示
        });
      } else {
        // 🆕 首次启动：创建新executor
        const currentConv = conversations.find((c: Conversation) => c.id === activeId);
        const lastUserMessage = currentConv?.messages
          .filter((m: Message) => m.role === 'user')
          .slice(-1)[0]?.text || '';
        
        console.log('📝 首次创建TodoExecutor，用户输入:', lastUserMessage);
        
        // 创建真实的Todo执行器（传入用户输入）
      const executor = createTodoExecutor(
        currentTodo,
        handleTodoStepProgress,
          handleTodoComplete,
          lastUserMessage
      );
      
      // 保存执行器
      setTodoExecutors(prev => ({ ...prev, [activeId]: executor }));
      
        // 更新Todo状态为运行中，只在首次启动时设置第一步为running
      const startedTodo = { 
        ...startTodoExecution(currentTodo), 
        userConfirmed: true,
          hasStarted: true
      };
      setCurrentTodo(startedTodo);
      
      // 开始执行后自动收起Todo面板
      setTodoExpanded(prev => ({ ...prev, [activeId]: false }));
      
      // 显示开始执行消息
      pushMessage({ 
        role: 'agent', 
          text: `🚀 开始执行任务计划...\n\n正在执行第1步：${startedTodo.items[0]?.text}`,
          isSystemMessage: true // 🔥 系统提示，不发送给LLM
      });
      
      // 开始真实执行
      executor.start().catch(error => {
        console.error('Todo执行失败:', error);
        pushMessage({ 
          role: 'agent', 
          text: `❌ 任务执行出错: ${error.message}` 
        });
      });
      }
    }
  }
  
  // 处理Todo步骤进度
  function handleTodoStepProgress(result: TodoStepResult): void {
    if (!activeId) return;
    
    console.log('handleTodoStepProgress 开始:', {
      stepId: result.stepId,
      success: result.success,
      waitingForContext: result.waitingForContext,
      reasoning: result.reasoning?.reasoning,
      error: result.error,
      currentTodoStatus: getCurrentTodo()?.status,
      currentTodoUserConfirmed: getCurrentTodo()?.userConfirmed
    });
    
    // 检查是否是上下文问题
    if (!result.success && result.error === 'WAITING_FOR_CONTEXT') {
      // 设置上下文问题状态
      setHasContextIssue(prev => ({ ...prev, [activeId]: true }));
      
      // 显示推理结果和等待信息
      const contextMessage: Message = {
        id: generateId(),
        role: 'agent',
        text: `🧠 **任务推理分析**\n\n${result.reasoning?.reasoning}\n\n⚠️ **缺失信息**: ${result.reasoning?.waitingForData}\n\n💡 建议：您可以选择"继续执行"等待更多信息，或点击"强制继续"按钮忽略此问题直接执行。`,
        createdAt: Date.now(),
        executionResults: [result]
      };
      
      // 添加到对话中
      upsertConversation(prev => prev.map(c => c.id === activeId ? {
        ...c,
        messages: [...c.messages, contextMessage],
        updatedAt: Date.now()
      } : c));
      
      return;
    }
    
    // 检查是否是用户输入询问（部分成功状态）
    if (!result.success && result.error === 'WAITING_FOR_USER_INPUT' && result.executionResult?.result?.partialSuccess) {
      // 🔄 更新Todo状态为等待用户（函数式更新）
      updateCurrentTodoItemStatus(result.stepId, 'waiting_user');
      
      // 直接显示询问消息
      const askMessage = result.executionResult.result.askMessage;
      const messageWithWaiting: Message = {
        id: generateId(),
        role: 'agent',
        text: askMessage,
        createdAt: Date.now(),
        executionResults: [{
          ...result,
          error: `AWAITING_USER_INPUT:${result.stepId}` // 特殊标记包含stepId
        }]
      };
      
      // 添加到对话中
      upsertConversation(prev => prev.map(c => c.id === activeId ? {
        ...c,
        messages: [...c.messages, messageWithWaiting],
        updatedAt: Date.now()
      } : c));
      
      return;
    }
    
    // 检查是否是LLM任务
    if (result.success && result.executionResult?.result?.isLLMTask) {
      console.log('🎯 处理LLM任务成功结果:', {
        stepId: result.stepId,
        stepText: result.stepText,
        isLLMTask: result.executionResult?.result?.isLLMTask,
        method: result.executionResult?.result?.method
      });
      
      // 🔄 更新Todo状态为完成（函数式更新）
      updateCurrentTodoItemStatus(result.stepId, 'completed');
      
      // 直接显示LLM处理结果作为消息
      const llmResponse = result.executionResult.result.llmResponse;
      const messageWithResult: Message = {
        id: generateId(),
        role: 'agent',
        text: llmResponse,
        createdAt: Date.now(),
        executionResults: [result] // 简化的执行结果，只显示标题
      };
      
      // 添加到对话中
      upsertConversation(prev => prev.map(c => c.id === activeId ? {
        ...c,
        messages: [...c.messages, messageWithResult],
        updatedAt: Date.now()
      } : c));
      
      return;
    }
    
    // 🔄 处理其他类型的任务（action类型，函数式更新）
    updateCurrentTodoItemStatus(result.stepId, result.success ? 'completed' : 'failed');
    
    // 使用LLM处理执行结果并生成用户回复
    generateLLMResponseForResult(result);
  }
  
  
  // 使用LLM处理执行结果生成用户回复
  async function generateLLMResponseForResult(result: TodoStepResult): Promise<void> {
    try {
      // 构建给LLM的提示词
      const prompt = buildResultPrompt(result);
      
      // 使用后端API
      const appSettings = getAppSettings();
      const messages = [
        { role: 'user' as const, content: prompt }
      ];
      
      const response = await backendApiService.getChatCompletion(
        messages,
        0.7,
        1000
      );
      
      if (!response.success || !response.content) {
        throw new Error(response.error || '后端API调用失败');
      }
      
      const llmResponse = response.content;
      
      // 创建包含执行结果的消息
      const messageWithResult: Message = {
        id: generateId(),
        role: 'agent',
        text: llmResponse.trim(),
        createdAt: Date.now(),
        executionResults: [result] // 附加执行结果
      };
      
      // 添加到对话中
      upsertConversation(prev => prev.map(c => c.id === activeId ? {
        ...c,
        messages: [...c.messages, messageWithResult],
        updatedAt: Date.now()
      } : c));
      
    } catch (error) {
      console.error('LLM处理执行结果失败:', error);
      
      // 降级处理：直接显示简单的执行结果
      const fallbackText = result.success 
        ? `✅ 步骤完成：${result.stepText}`
        : `❌ 步骤失败：${result.stepText}\n\n错误：${result.error}`;
      
      pushMessage({ 
        role: 'agent', 
        text: fallbackText,
        executionResults: [result]
      });
    }
  }
  
  // 构建给LLM的结果处理提示词
  function buildResultPrompt(result: TodoStepResult): string {
    let prompt = `你是一个智能助手。用户刚刚执行了一个任务步骤，请根据执行结果为用户生成一个友好、简洁的回复。

任务步骤: ${result.stepText}
执行状态: ${result.success ? '成功' : '失败'}
执行时间: ${result.executionTime}ms`;

    if (result.actionUsed) {
      prompt += `\n使用工具: ${result.actionUsed.name} (${result.actionUsed.type})`;
    }

    if (result.success && result.executionResult?.result) {
      const resultData = result.executionResult.result;
      prompt += `\n\n执行结果:\n`;
      
      if (typeof resultData === 'object') {
        if (resultData.answer !== undefined) {
          prompt += `计算结果: ${resultData.answer}`;
        } else if (resultData.response) {
          prompt += resultData.response;
        } else if (resultData.processed) {
          prompt += `处理结果: ${resultData.processed}`;
        } else if (resultData.wordCount !== undefined) {
          prompt += `文本统计 - 单词: ${resultData.wordCount}, 字符: ${resultData.characterCount}`;
        } else {
          prompt += JSON.stringify(resultData, null, 2);
        }
      } else {
        prompt += String(resultData);
      }
    } else if (!result.success) {
      prompt += `\n\n错误信息: ${result.error}`;
    }

    prompt += `\n\n请生成一个简洁、友好的回复，向用户说明执行结果。不要重复显示技术细节，重点是结果的含义和价值。回复应该在50字以内。`;

    return prompt;
  }
  
  // 处理Todo完成
  function handleTodoComplete(allResults: TodoStepResult[]): void {
    if (!activeId) return;
    
    console.log('handleTodoComplete: 清理执行器', activeId, '结果数量:', allResults.length);
    
    // 更新TODO的最终状态为完成
    const currentTodo = getCurrentTodo();
    if (currentTodo) {
      console.log('📋 TODO执行完成，更新最终状态:', {
        currentStatus: currentTodo.status,
        currentStep: currentTodo.currentStep,
        totalSteps: currentTodo.totalSteps,
        allResultsSuccess: allResults.every(r => r.success),
        currentItems: currentTodo.items.map(i => ({ id: i.id, status: i.status }))
      });
      
      // 🔥 强制所有步骤状态为completed（因为已经全部执行完成）
      const completedTodo = {
        ...currentTodo,
        status: 'completed' as const,
        currentStep: currentTodo.totalSteps, // 设置为总步数表示全部完成
        items: currentTodo.items.map(item => ({
          ...item,
          // 🔥 全部完成时，所有步骤都应该是completed状态
          status: item.status === 'failed' ? 'failed' as const : 'completed' as const
        }))
      };
      
      console.log('🎉 最终完成状态:', {
        status: completedTodo.status,
        currentStep: completedTodo.currentStep,
        totalSteps: completedTodo.totalSteps,
        completedItems: completedTodo.items.map(i => ({ id: i.id, text: i.text.substring(0, 15), status: i.status }))
      });
      
      // 🔥 使用函数式更新，确保基于最新状态
      setConversationTodos(prev => ({
        ...prev,
        [activeId]: completedTodo
      }));
      
      // 显示完成消息
      pushMessage({
        role: 'agent',
        text: `✅ 任务计划执行完成！共完成 ${allResults.length} 个步骤。`,
        isSystemMessage: true // 🔥 系统提示
      });
    }
    
    // 清理执行器
    setTodoExecutors(prev => {
      const { [activeId]: removed, ...rest } = prev;
      console.log('Todo完成后清理执行器，剩余:', Object.keys(rest));
      return rest;
    });
  }
  
  function handleBottomTodoPause(): void {
    const currentTodo = getCurrentTodo();
    if (currentTodo && activeId) {
      // 暂停执行器
      const executor = todoExecutors[activeId];
      if (executor) {
        executor.pause();
      }
      
      const pausedTodo = { ...currentTodo, status: 'paused' as const };
      setCurrentTodo(pausedTodo);
      pushMessage({ 
        role: 'agent', 
        text: `⏸️ 任务执行已暂停`,
        isSystemMessage: true // 🔥 系统提示
      });
    }
  }
  
  function handleBottomTodoClose(): void {
    setCurrentTodo(null);
    if (activeId) {
      setTodoExpanded(prev => ({ ...prev, [activeId]: false }));
      
      // 清理执行器
      console.log('handleBottomTodoClose: 清理执行器', activeId);
      setTodoExecutors(prev => {
        const { [activeId]: removed, ...rest } = prev;
        console.log('关闭Todo后清理执行器，剩余:', Object.keys(rest));
        return rest;
      });
    }
  }
  
  function handleBottomTodoToggleExpanded(): void {
    if (activeId) {
      setTodoExpanded(prev => ({ ...prev, [activeId]: !prev[activeId] }));
    }
  }

  function trimMessagesForMemory(messages: Message[]): Message[] {
    
    // 计算轮数：一轮 = 一个用户消息 + 一个agent回复
    const rounds: Message[][] = [];
    let currentRound: Message[] = [];
    
    for (const message of messages) {
      currentRound.push(message);
      if (message.role === 'agent') {
        rounds.push([...currentRound]);
        currentRound = [];
      }
    }
    
    // 如果最后还有未完成的轮次（只有用户消息），也保留
    if (currentRound.length > 0) {
      rounds.push(currentRound);
    }
    
    // 只保留最近的N轮
    const recentRounds = rounds.slice(-memorySettings.maxRounds);
    return recentRounds.flat();
  }

  const active = getActive();
  const sortedConversations = React.useMemo(() => {
    return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [conversations]);

  React.useEffect(() => {
    if (searchParams.get('new') === '1') {
      handleNewConversation();
      const url = new URL(window.location.href);
      url.searchParams.delete('new');
      navigate({ pathname: url.pathname, search: url.search }, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <Stack direction="row" spacing={2} sx={{ height: 'calc(100vh - 120px)', minHeight: 0 }}>
        <Paper variant="outlined" sx={{ width: 280, p: 1, display: { xs: 'none', sm: 'block' }, flexShrink: 0, height: '100%', overflow: 'hidden' }}>
          <Stack spacing={1} sx={{ height: '100%' }}>
            <Button variant="text" color="inherit" startIcon={<AddIcon />} onClick={() => handleNewConversation()}>新建对话</Button>
            <Divider />
            <List dense disablePadding sx={{ flex: 1, overflow: 'auto' }}>
              {sortedConversations.map(c => (
                <ListItemButton key={c.id} selected={c.id === activeId} onClick={() => setActiveId(c.id)} sx={{ borderRadius: 1, mb: 0.5 }}>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600} noWrap title={c.title}>{c.title}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">{new Date(c.updatedAt).toLocaleString()}</Typography>}
                  />
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuConvId(c.id); }}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              ))}
              {sortedConversations.length === 0 && (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    minHeight: '200px'
                  }}
                >
                  <Typography 
                    color="text.secondary" 
                    variant="body2" 
                    sx={{ 
                      textAlign: 'center',
                      opacity: 0.6
                    }}
                  >
                    暂无对话，点击"新建对话"开始
                  </Typography>
                </Box>
              )}
            </List>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ flex: 1, minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'background.default', position: 'relative' }}>
          {active && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>{active.title}</Typography>
                {(() => {
                  const currentRounds = Math.floor(active.messages.length / 2);
                  const memoryRounds = memorySettings.maxRounds;
                  return currentRounds > memoryRounds ? (
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
                      记忆 {currentRounds}/{memoryRounds}
                    </Typography>
                  ) : null;
                })()}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton 
                  size="small" 
                  onClick={() => setMemorySettingsOpen(true)}
                  sx={{ color: 'grey.600' }}
                  title="记忆设置"
                >
                  <PsychologyIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => setRAGSettingsOpen(true)}
                  sx={{ color: ragSettings.enabled ? 'primary.main' : 'grey.600' }}
                  title="知识检索"
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
                {active.messages.length > 0 && (
                  <IconButton 
                    size="small" 
                    onClick={() => setClearChatOpen(true)}
                    sx={{ color: 'grey.600' }}
                    title="清除聊天记录"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          )}
          
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
            {!active || active.messages.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                textAlign: 'center',
                gap: 3
              }}>
                <AutoAwesomeIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  嗨～我是你的游戏发行小助理！有什么想聊的吗？
                </Typography>
                <Stack spacing={2} alignItems="center">
                  <Stack direction="row" spacing={2}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => setInput('给我今日的热点')}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        color: 'text.secondary',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'primary.50'
                        }
                      }}
                    >
                      给我今日的热点
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => setInput('设计一个网页活动')}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        color: 'text.secondary',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'primary.50'
                        }
                      }}
                    >
                      设计一个网页活动
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => setInput('进行数据分析')}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        color: 'text.secondary',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'primary.50'
                        }
                      }}
                    >
                      进行数据分析
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => setInput('查询游戏道具')}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        color: 'text.secondary',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'primary.50'
                        }
                      }}
                    >
                      查询游戏道具
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ) : (
              <Stack spacing={2}>
                {/* 正常的消息渲染 */}
                {(active.messages || []).map(m => {
                  const specialMessage = m as SpecialMessage;
                  const isCommandResult = specialMessage.type === 'command_result';
                  const isActionResult = specialMessage.type === 'action_result';
                  const isSpecialMessage = isCommandResult || isActionResult;
                  
                  return (
                    <Stack key={m.id} direction="row" spacing={2} justifyContent={m.role === 'user' ? 'flex-end' : 'flex-start'}>
                      {m.role === 'agent' && (
                        <Avatar sx={{ 
                          bgcolor: isCommandResult ? 'warning.main' : 
                                   isActionResult ? 'success.main' : 
                                   'primary.main',
                          color: 'white'
                        }}>
                          {isCommandResult ? '⚡' : isActionResult ? '🔧' : 'A'}
                        </Avatar>
                      )}
                      <Box sx={{ maxWidth: '70%' }}>
                        <Typography variant="caption" color="text.secondary">
                          {m.role === 'agent' ? 
                            (isCommandResult ? '指令执行' : 
                             isActionResult ? '动作执行' : 
                             'Agent') : '我'} · {new Date(m.createdAt).toLocaleTimeString()}
                          {specialMessage.metadata?.commandName && (
                            <Chip 
                              label={specialMessage.metadata.commandName} 
                              size="small" 
                              sx={{ ml: 1, fontSize: '0.75rem', height: 20 }}
                              color="warning"
                              variant="outlined"
                            />
                          )}
                          {specialMessage.metadata?.actionName && (
                            <Chip 
                              label={specialMessage.metadata.actionName} 
                              size="small" 
                              sx={{ ml: 1, fontSize: '0.75rem', height: 20 }}
                              color="success"
                              variant="outlined"
                            />
                          )}
                          {m.role === 'agent' && m.thinking && (
                            <Button size="small" sx={{ ml: 1 }} onClick={() => setExpandedThinking(prev => ({ ...prev, [m.id]: !prev[m.id] }))}>
                              {expandedThinking[m.id] ? '收起思考' : '展开思考'}
                            </Button>
                          )}
                        </Typography>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 1.25, 
                            mt: 0.5, 
                            backgroundColor: m.role === 'agent' ? 
                              (isCommandResult ? 'warning.50' : 
                               isActionResult ? 'success.50' : 
                               'background.paper') : 
                              'primary.main', 
                            color: m.role === 'agent' ? 'inherit' : 'primary.contrastText', 
                            borderRadius: 1,
                            borderColor: isCommandResult ? 'warning.main' : 
                                        isActionResult ? 'success.main' : 
                                        'divider',
                            borderWidth: isSpecialMessage ? 2 : 1
                          }}
                        >
                          {/* 🆕 Loading状态：正在思考中 */}
                          {m.isThinking ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                              <CircularProgress size={16} sx={{ color: 'primary.main' }} />
                              <Typography 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontStyle: 'italic',
                                  animation: 'pulse 1.5s ease-in-out infinite',
                                  '@keyframes pulse': {
                                    '0%, 100%': { opacity: 0.6 },
                                    '50%': { opacity: 1 }
                                  }
                                }}
                              >
                                正在思考中...
                              </Typography>
                            </Box>
                          ) : (
                            <>
                          {/* 🆕 Bug Fix: 更全面的Markdown检测，Agent回复统一使用Markdown渲染 */}
                          {m.role === 'agent' || 
                           m.text.includes('#') || 
                           m.text.includes('**') || 
                           m.text.includes('|') || 
                           m.text.includes('```') ||
                           m.text.includes('- ') ? (
                            <MarkdownRenderer content={m.text} />
                          ) : (
                            <Typography whiteSpace="pre-wrap">{m.text}</Typography>
                              )}
                            </>
                          )}
                          
                          {/* Event Planner按钮 */}
                          {m.showEventPlannerButton && (
                            <Box sx={{ mt: 2 }}>
                              <Button
                                variant="contained"
                                onClick={openEventPlannerDialog}
                                sx={{
                                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                  color: 'white',
                                  borderRadius: 2,
                                  px: 3,
                                  py: 1,
                                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                                  '&:hover': {
                                    background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                                  }
                                }}
                              >
                                📝 点击此处填写
                              </Button>
                            </Box>
                          )}
                          
                        {/* Event Planner双图显示 */}
                        {m.isEventPlannerResult && (m.wireframeImage || m.designImage) && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                              🎨 UI设计方案
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              {/* 低保真原型图 */}
                              {m.wireframeImage && (
                                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    📐 低保真原型图
                                  </Typography>
                                  <Box 
                                    sx={{ 
                                      position: 'relative',
                                      display: 'inline-block',
                                      '&:hover .zoom-button': { opacity: 1 }
                                    }}
                                  >
                                    <img
                                      src={m.wireframeImage}
                                      alt="低保真原型图"
                                      style={{
                                        width: '100%',
                                        maxWidth: '350px',
                                        height: 'auto',
                                        borderRadius: '8px',
                                        border: '2px solid #e0e0e0',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => setImageModalOpen({ open: true, src: m.wireframeImage! })}
                                    />
                                    <IconButton
                                      className="zoom-button"
                                      sx={{
                                        position: 'absolute',
                                        bottom: 8,
                                        right: 8,
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' }
                                      }}
                                      size="small"
                                      onClick={() => setImageModalOpen({ open: true, src: m.wireframeImage! })}
                                    >
                                      <ZoomInIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                              )}
                              
                              {/* 高保真设计图 */}
                              {m.designImage && (
                                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    🎨 高保真设计图
                                  </Typography>
                                  <Box 
                                    sx={{ 
                                      position: 'relative',
                                      display: 'inline-block',
                                      '&:hover .zoom-button': { opacity: 1 }
                                    }}
                                  >
                                    <img
                                      src={m.designImage}
                                      alt="高保真设计图"
                                      style={{
                                        width: '100%',
                                        maxWidth: '350px',
                                        height: 'auto',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => setImageModalOpen({ open: true, src: m.designImage! })}
                                    />
                                    <IconButton
                                      className="zoom-button"
                                      sx={{
                                        position: 'absolute',
                                        bottom: 8,
                                        right: 8,
                                        backgroundColor: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' }
                                      }}
                                      size="small"
                                      onClick={() => setImageModalOpen({ open: true, src: m.designImage! })}
                                    >
                                      <ZoomInIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        )}

                        {/* 显示生成的图像 */}
                        {m.imageBase64 && !m.isEventPlannerResult && (
                          <Box 
                            sx={{ 
                              mt: 2, 
                              position: 'relative',
                              display: 'inline-block',
                              '&:hover .zoom-button': {
                                opacity: 1
                              }
                            }}
                          >
                            <img
                              src={m.imageBase64}
                              alt="Generated image"
                              style={{
                                maxWidth: '400px',
                                height: 'auto',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                cursor: 'pointer'
                              }}
                              onClick={() => setImageModalOpen({ open: true, src: m.imageBase64! })}
                            />
                            <IconButton
                              className="zoom-button"
                              sx={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                '&:hover': {
                                  backgroundColor: 'rgba(0,0,0,0.8)'
                                }
                              }}
                              size="small"
                              onClick={() => setImageModalOpen({ open: true, src: m.imageBase64! })}
                            >
                              <ZoomInIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                        </Paper>
                        
                        {/* 执行结果展示 */}
                        {m.executionResults && m.executionResults.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {m.executionResults.map((result, index) => (
                              <ActionResultDisplay
                                key={`${m.id}-result-${index}`}
                                result={result}
                                defaultExpanded={false}
                              />
                            ))}
                          </Box>
                        )}
                        {m.role === 'agent' && m.thinking && (
                          <Collapse in={Boolean(expandedThinking[m.id])}>
                            <Paper variant="outlined" sx={{ p: 1.25, mt: 1, bgcolor: 'background.paper', borderRadius: 2 }}>
                              <Typography variant="overline" color="text.secondary">思考过程</Typography>
                              <Typography whiteSpace="pre-wrap" sx={{ mt: 0.5 }}>{m.thinking}</Typography>
                            </Paper>
                          </Collapse>
                        )}
                      </Box>
                      {m.role === 'user' && (
                        <Avatar sx={{ bgcolor: 'grey.300' }}>我</Avatar>
                      )}
                    </Stack>
                  );
                })}
                <div ref={messagesEndRef} />
              </Stack>
            )}
          </Box>

          {/* 底部Todo面板 */}
          {getCurrentTodo() && (
            <Box sx={{ m: 2, mb: 1 }}>
              <BottomTodoPanel
                todoList={getCurrentTodo()!}
                onStart={handleBottomTodoStart}
                onPause={handleBottomTodoPause}
                onClose={handleBottomTodoClose}
                onToggleExpanded={handleBottomTodoToggleExpanded}
                expanded={activeId ? (todoExpanded[activeId as string] || false) : false}
                onForceNext={handleForceNext}
                hasContextIssue={activeId ? (hasContextIssue[activeId as string] || false) : false}
              />
            </Box>
          )}

          {/* 指令选择气泡 */}
          {selectedCommandId && (
            <Box sx={{ mx: 2, mb: 1 }}>
              <Chip
                label={`指令: ${commands.find(cmd => cmd.id === selectedCommandId)?.name || '未知指令'}`}
                onDelete={() => setSelectedCommandId('')}
                deleteIcon={<CloseIcon />}
                color="primary"
                variant="outlined"
                size="small"
                sx={{
                  bgcolor: 'primary.50',
                  color: 'primary.700',
                  borderColor: 'primary.200',
                  '& .MuiChip-deleteIcon': {
                    color: 'primary.500',
                    '&:hover': {
                      color: 'primary.700'
                    }
                  },
                  boxShadow: '0 1px 4px rgba(25, 118, 210, 0.08)',
                  fontWeight: 500,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    bgcolor: 'primary.100',
                    borderColor: 'primary.300',
                    boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)'
                  },
                  animation: 'fadeIn 0.3s ease-in-out',
                  '@keyframes fadeIn': {
                    from: { opacity: 0, transform: 'translateY(-10px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                  }
                }}
              />
            </Box>
          )}

          <Paper 
            variant="outlined" 
            sx={{ 
              p: 1.5, 
              m: 2, 
              mt: 0, 
              display: 'flex', 
              gap: 1.5, 
              alignItems: 'center',
              borderRadius: 3,
              bgcolor: 'grey.25',
              border: '1px solid',
              borderColor: 'grey.200',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              '&:hover': {
                borderColor: 'primary.200',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              },
              '&:focus-within': {
                borderColor: 'primary.main',
                boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)'
              }
            }}
          >
            {/* 指令模板选择按钮 */}
            <IconButton 
              color={selectedCommandId ? "primary" : "default"}
              aria-label="select command" 
              onClick={() => setCommandDialogOpen(true)}
              sx={{ 
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: selectedCommandId ? 'primary.50' : 'grey.50',
                border: '1px solid',
                borderColor: selectedCommandId ? 'primary.200' : 'grey.200',
                color: selectedCommandId ? 'primary.600' : 'grey.600',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: selectedCommandId ? 'primary.100' : 'grey.100',
                  borderColor: selectedCommandId ? 'primary.300' : 'grey.300',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }
              }}
              title="选择指令模板"
            >
              <PlaylistPlayIcon fontSize="small" />
            </IconButton>
            
            <Box sx={{ position: 'relative', flex: 1 }}>
              {/* 🆕 指令模板提示覆盖层 */}
              {selectedCommandId && (
                <Box sx={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  padding: '4px 8px',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'rgba(25, 118, 210, 0.04)',
                    '& .close-button': {
                      opacity: 1,
                      visibility: 'visible'
                    }
                  }
                }}>
                  <Typography variant="body2" sx={{ 
                    color: 'primary.main', 
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    mr: 0.5,
                    pointerEvents: 'auto',
                    cursor: 'default'
                  }}>
                    📋 {commands.find(c => c.id === selectedCommandId)?.name}
                  </Typography>
                  <IconButton 
                    className="close-button"
                    size="small" 
                    onClick={() => setSelectedCommandId('')}
                    sx={{ 
                      width: 18, 
                      height: 18, 
                      color: 'primary.main',
                      opacity: 0,
                      visibility: 'hidden',
                      transition: 'all 0.2s ease-in-out',
                      pointerEvents: 'auto',
                      '&:hover': { 
                        bgcolor: 'primary.100',
                        opacity: 1,
                        visibility: 'visible'
                      }
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              )}
              
              <TextField
                fullWidth
                placeholder={
                  selectedCommandId ? `使用模板：${commands.find(c => c.id === selectedCommandId)?.name}...` :
                  "输入消息..."
                }
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  sx: {
                    bgcolor: 'transparent',
                    fontSize: '0.95rem',
                    '& input': {
                      padding: selectedCommandId ? '12px 16px 12px 200px' : '12px 16px',
                      borderRadius: 2,
                      bgcolor: 'white',
                      border: '1px solid',
                      borderColor: 'grey.200',
                      transition: 'all 0.2s ease-in-out',
                      '&:focus': {
                        borderColor: 'primary.main',
                        boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.08)'
                      },
                      '&::placeholder': {
                        color: 'grey.500',
                        opacity: 1
                      }
                    }
                  }
                }}
              />
            </Box>
            <IconButton 
              color="primary" 
              aria-label="send" 
              onClick={() => void handleSend()}
              disabled={!input.trim()}
              sx={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: input.trim() ? 'primary.main' : 'grey.200',
                color: input.trim() ? 'white' : 'grey.500',
                border: '1px solid',
                borderColor: input.trim() ? 'primary.main' : 'grey.300',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: input.trim() ? 'primary.dark' : 'grey.300',
                  transform: input.trim() ? 'translateY(-1px)' : 'none',
                  boxShadow: input.trim() ? '0 6px 20px rgba(25, 118, 210, 0.3)' : 'none'
                },
                '&:disabled': {
                  bgcolor: 'grey.200',
                  color: 'grey.400',
                  borderColor: 'grey.300'
                }
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Paper>

        </Paper>
      <Menu
        open={isMenuOpen}
        anchorEl={menuAnchor}
        onClose={() => { setMenuAnchor(null); setMenuConvId(null); }}
      >
        <MenuItem onClick={() => {
          const conv = conversations.find(c => c.id === menuConvId);
          setRenameValue(conv?.title ?? '');
          setRenameOpen(true);
          setMenuAnchor(null);
        }}>重命名</MenuItem>
        <MenuItem onClick={() => { setDeleteOpen(true); setMenuAnchor(null); }}>删除</MenuItem>
      </Menu>

      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)}>
        <DialogTitle>重命名对话</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth value={renameValue} onChange={e => setRenameValue(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => { if (menuConvId) handleRenameConversation(menuConvId, renameValue.trim() || '未命名对话'); setRenameOpen(false); }}>确定</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>删除对话</DialogTitle>
        <DialogContent>
          <Typography>此操作将删除选中的对话及其消息，是否继续？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>取消</Button>
          <Button color="error" variant="contained" onClick={() => { if (menuConvId) handleDeleteConversation(menuConvId); setDeleteOpen(false); }}>删除</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={clearChatOpen} onClose={() => setClearChatOpen(false)}>
        <DialogTitle>清除聊天记录</DialogTitle>
        <DialogContent>
          <Typography>此操作将清除当前对话的所有消息，但保留对话本身。是否继续？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearChatOpen(false)}>取消</Button>
          <Button color="error" variant="contained" onClick={() => { handleClearCurrentChat(); setClearChatOpen(false); }}>清除</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={memorySettingsOpen} onClose={() => setMemorySettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>记忆设置</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>聊天记忆轮数</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                控制 AI 能记住多少轮对话历史。一轮包含一次用户提问和 AI 回答。
              </Typography>
              <FormControl fullWidth>
                <InputLabel>记忆轮数</InputLabel>
                <Select
                  value={memorySettings.maxRounds}
                  label="记忆轮数"
                  onChange={(e) => setMemorySettings(prev => ({ ...prev, maxRounds: Number(e.target.value) }))}
                >
                  <MenuItem value={3}>3 轮</MenuItem>
                  <MenuItem value={5}>5 轮</MenuItem>
                  <MenuItem value={10}>10 轮</MenuItem>
                  <MenuItem value={20}>20 轮</MenuItem>
                  <MenuItem value={50}>50 轮</MenuItem>
                  <MenuItem value={100}>100 轮</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemorySettingsOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* RAG 设置对话框 */}
      <Dialog open={ragSettingsOpen} onClose={() => setRAGSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>知识检索设置</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>启用 RAG 检索</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                开启后，AI 会自动检索知识库中的相关信息来回答问题。
              </Typography>
              <FormControl fullWidth>
                <InputLabel>检索状态</InputLabel>
                <Select
                  value={ragSettings.enabled ? 'enabled' : 'disabled'}
                  label="检索状态"
                  onChange={(e) => setRAGSettings(prev => ({ ...prev, enabled: e.target.value === 'enabled' }))}
                >
                  <MenuItem value="enabled">✅ 启用检索</MenuItem>
                  <MenuItem value="disabled">❌ 禁用检索</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {ragSettings.enabled && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>检索结果数量</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  控制每次检索返回的知识库片段数量。更多结果提供更全面的信息，但可能影响响应速度。
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>结果数量</InputLabel>
                  <Select
                    value={ragSettings.maxResults}
                    label="结果数量"
                    onChange={(e) => setRAGSettings(prev => ({ ...prev, maxResults: Number(e.target.value) }))}
                  >
                    <MenuItem value={1}>1 个结果</MenuItem>
                    <MenuItem value={2}>2 个结果</MenuItem>
                    <MenuItem value={3}>3 个结果</MenuItem>
                    <MenuItem value={5}>5 个结果</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                📚 当前知识库状态：{getKnowledgeSources().filter(s => s.status === 'active').length} 个激活的知识源
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRAGSettingsOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 指令选择对话框 */}
      <Dialog open={commandDialogOpen} onClose={() => setCommandDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>选择指令模板</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* 搜索框 */}
            <TextField
              fullWidth
              placeholder="搜索指令..."
              value={commandSearchText}
              onChange={(e) => setCommandSearchText(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />

            {/* 指令列表 */}
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {['personal', 'public'].map((category) => {
                const categoryCommands = commands
                  .filter(cmd => cmd.category === category)
                  .filter(cmd => 
                    !commandSearchText || 
                    cmd.name.toLowerCase().includes(commandSearchText.toLowerCase()) ||
                    cmd.description.toLowerCase().includes(commandSearchText.toLowerCase())
                  );

                if (categoryCommands.length === 0) return null;

                return (
                  <Box key={category} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 1 }}>
                      {category === 'personal' ? '我的指令' : '公开指令'}
                    </Typography>
                    <Stack spacing={1}>
                      {categoryCommands.map((command) => (
                        <Paper
                          key={command.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            border: selectedCommandId === command.id ? 2 : 1,
                            borderColor: selectedCommandId === command.id ? 'primary.main' : 'divider',
                            bgcolor: selectedCommandId === command.id ? 'primary.50' : 'transparent',
                            '&:hover': {
                              bgcolor: selectedCommandId === command.id ? 'primary.100' : 'grey.50'
                            }
                          }}
                          onClick={() => {
                            setSelectedCommandId(command.id);
                            setCommandDialogOpen(false);
                            setCommandSearchText('');
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {command.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {command.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            display: 'block',
                            whiteSpace: 'pre-line',
                            bgcolor: 'grey.50',
                            p: 1,
                            borderRadius: 1,
                            fontFamily: 'monospace'
                          }}>
                            {command.todoList.split('\n').slice(0, 3).join('\n')}
                            {command.todoList.split('\n').length > 3 && '\n...'}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                );
              })}

              {commands.filter(cmd => 
                !commandSearchText || 
                cmd.name.toLowerCase().includes(commandSearchText.toLowerCase()) ||
                cmd.description.toLowerCase().includes(commandSearchText.toLowerCase())
              ).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    {commandSearchText ? '未找到匹配的指令' : '暂无可用指令'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          {selectedCommandId && (
            <Button 
              onClick={() => {
                setSelectedCommandId('');
              }}
              color="error"
            >
              清除选择
            </Button>
          )}
          <Button onClick={() => setCommandDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* Event Planner 表单弹窗 */}
      <Dialog
        open={eventPlannerDialogOpen}
        onClose={() => setEventPlannerDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Event Planner - 活动策划</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* 活动主题 */}
            <TextField
              fullWidth
              required
              label="活动主题"
              placeholder="例如：春节庆典、电竞联赛、周年庆典"
              value={eventPlannerForm.theme}
              onChange={(e) => setEventPlannerForm(prev => ({ ...prev, theme: e.target.value }))}
            />
            
            {/* 活动概要 */}
            <TextField
              fullWidth
              required
              multiline
              rows={3}
              label="活动概要"
              placeholder="简要描述活动的核心内容和玩法..."
              value={eventPlannerForm.overview}
              onChange={(e) => setEventPlannerForm(prev => ({ ...prev, overview: e.target.value }))}
            />
            
            {/* 业务目标 */}
            <FormControl fullWidth required>
              <InputLabel>业务目标</InputLabel>
              <Select
                value={eventPlannerForm.businessGoal}
                onChange={(e) => setEventPlannerForm(prev => ({ ...prev, businessGoal: e.target.value }))}
                label="业务目标"
              >
                {businessGoalOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* 自定义业务目标 */}
            {eventPlannerForm.businessGoal === 'custom' && (
              <TextField
                fullWidth
                label="自定义业务目标"
                placeholder="请描述具体的业务目标和指标..."
                value={eventPlannerForm.businessGoalCustom}
                onChange={(e) => setEventPlannerForm(prev => ({ ...prev, businessGoalCustom: e.target.value }))}
              />
            )}
            
            {/* 目标玩家 */}
            <FormControl fullWidth required>
              <InputLabel>目标玩家</InputLabel>
              <Select
                value={eventPlannerForm.targetPlayer}
                onChange={(e) => setEventPlannerForm(prev => ({ ...prev, targetPlayer: e.target.value }))}
                label="目标玩家"
              >
                {targetPlayerOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* 自定义目标玩家 */}
            {eventPlannerForm.targetPlayer === 'custom' && (
              <TextField
                fullWidth
                label="自定义目标玩家"
                placeholder="请描述目标玩家群体的特征..."
                value={eventPlannerForm.targetPlayerCustom}
                onChange={(e) => setEventPlannerForm(prev => ({ ...prev, targetPlayerCustom: e.target.value }))}
              />
            )}
            
            {/* 目标区域 */}
            <TextField
              fullWidth
              required
              label="目标区域"
              placeholder="例如：亚太地区、欧美市场、全球"
              value={eventPlannerForm.targetRegion}
              onChange={(e) => setEventPlannerForm(prev => ({ ...prev, targetRegion: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventPlannerDialogOpen(false)}>取消</Button>
          <Button 
            variant="contained" 
            onClick={handleEventPlannerSubmit}
            disabled={!eventPlannerForm.theme || !eventPlannerForm.overview || !eventPlannerForm.businessGoal || !eventPlannerForm.targetPlayer || !eventPlannerForm.targetRegion}
          >
            开始生成策划案
          </Button>
        </DialogActions>
      </Dialog>

      {/* 图片放大弹窗 */}
      <Dialog
        open={imageModalOpen.open}
        onClose={() => setImageModalOpen({ open: false, src: '' })}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 1, textAlign: 'center' }}>
          {imageModalOpen.src && (
            <img
              src={imageModalOpen.src}
              alt="Generated image"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                height: 'auto',
                borderRadius: '8px'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<SaveIcon />}
            onClick={() => {
              const link = document.createElement('a');
              link.href = imageModalOpen.src;
              link.download = `generated-image-${Date.now()}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            保存图片
          </Button>
          <Button onClick={() => setImageModalOpen({ open: false, src: '' })}>
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

