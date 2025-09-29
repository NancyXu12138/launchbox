// 底部Todo面板组件

import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  LinearProgress, 
  Chip, 
  Stack, 
  IconButton,
  Collapse,
  Button,
  Divider
} from '@mui/material';
import { 
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  FilterAlt as ProgressIcon,
  Error as FailedIcon,
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  SkipNext as ForceNextIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

export type SimpleTodoStatus = 'pending' | 'running' | 'completed' | 'failed' | 'waiting_user';

export type TodoTaskType = 'action' | 'llm' | 'user_input';

export interface SimpleTodoItem {
  id: string;
  text: string;
  status: SimpleTodoStatus;
  order: number;
  taskType: TodoTaskType; // 任务类型
  userPrompt?: string; // 用于user_input类型的用户提示
}

export interface SimpleTodoList {
  id: string;
  title: string;
  items: SimpleTodoItem[];
  status: 'draft' | 'running' | 'completed' | 'paused';
  currentStep: number;
  totalSteps: number;
  userConfirmed?: boolean; // 标记用户是否已经确认过这个计划
  hasStarted?: boolean; // 标记计划是否已经开始执行过（一旦开始就永远为true）
}

interface BottomTodoPanelProps {
  todoList?: SimpleTodoList;
  onStart?: () => void;
  onPause?: () => void;
  onClose?: () => void;
  onToggleExpanded?: () => void;
  expanded?: boolean;
  onForceNext?: () => void; // 强制继续下一步
  hasContextIssue?: boolean; // 是否有上下文问题
}


// 获取任务类型文本
function getTaskTypeText(taskType: TodoTaskType): string {
  const typeMap = {
    'action': '执行动作',
    'llm': '大模型处理',
    'user_input': '用户输入'
  };
  
  return typeMap[taskType] || '未知类型';
}

// 获取进度条图标
function getProgressIcon(status: SimpleTodoStatus) {
  switch (status) {
    case 'completed':
      return <CompletedIcon sx={{ color: 'success.main', fontSize: 16 }} />;
    case 'running':
    case 'waiting_user':
      return <ProgressIcon sx={{ color: 'warning.main', fontSize: 16 }} />; // 漏斗图标表示正在进行
    case 'failed':
      return <FailedIcon sx={{ color: 'error.main', fontSize: 16 }} />;
    case 'pending':
    default:
      return <PendingIcon sx={{ color: 'text.secondary', fontSize: 16 }} />;
  }
}

export default function BottomTodoPanel({ 
  todoList, 
  onStart, 
  onPause, 
  onClose,
  onToggleExpanded,
  expanded = false,
  onForceNext,
  hasContextIssue = false
}: BottomTodoPanelProps) {
  if (!todoList) return null;
  
  const progress = todoList.totalSteps > 0 ? (todoList.currentStep / todoList.totalSteps) * 100 : 0;
  const isRunning = todoList.status === 'running';
  const isCompleted = todoList.status === 'completed';
  const isPaused = todoList.status === 'paused';
  const isDraft = todoList.status === 'draft'; // 新增：判断是否为初始状态
  
  // 检查是否有失败的任务
  const hasFailed = todoList.items.some(item => item.status === 'failed');
  
  const isInitialDraft = isDraft && !todoList.hasStarted && !hasFailed; // 真正的初始状态：从未开始过且没有失败的draft
  
  // 调试日志
  console.log('BottomTodoPanel 状态:', {
    status: todoList.status,
    hasStarted: todoList.hasStarted,
    hasFailed,
    isInitialDraft,
    items: todoList.items.map(i => ({ id: i.id, text: i.text, status: i.status }))
  });
  
  return (
    <Paper 
      elevation={4}
      sx={{ 
        position: 'relative',
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: isRunning ? 'warning.main' : 
                     isCompleted ? 'success.main' : 
                     isPaused ? 'error.main' : 'primary.main',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* 头部信息 - 紧凑版 */}
      <Box sx={{ p: 1.5, backgroundColor: 'primary.50' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center" flex={1}>
            <Typography variant="subtitle2" fontWeight="bold" noWrap>
              📋 {todoList.title}
            </Typography>
            
            <Chip 
              label={`${todoList.currentStep}/${todoList.totalSteps}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.75rem', height: 20 }}
            />
            
          </Stack>
          
          <Stack direction="row" spacing={0.5} alignItems="center">
            {/* 初始状态：显示开始按钮和移除按钮 */}
            {isInitialDraft && (
              <>
                <Button 
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={onStart}
                  startIcon={<PlayIcon />}
                  sx={{ 
                    fontSize: '0.75rem',
                    px: 1.5,
                    py: 0.5,
                    minWidth: 'auto'
                  }}
                >
                  开始执行
                </Button>
                
                {/* 移除按钮 */}
                <IconButton 
                  size="small"
                  onClick={onClose}
                  title="移除计划表"
                  sx={{ ml: 0.5 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            )}
            
            {/* 执行状态：显示完整控制按钮 */}
            {!isInitialDraft && (
              <>
                {/* 控制按钮 - 根据状态显示不同按钮 */}
                {!isCompleted && (
                  <>
                    {isRunning ? (
                      <IconButton 
                        size="small" 
                        color="warning"
                        onClick={onPause}
                        title="暂停执行"
                      >
                        <PauseIcon fontSize="small" />
                      </IconButton>
                    ) : isPaused ? (
                      <>
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={onStart}
                          title="继续执行"
                        >
                          <PlayIcon fontSize="small" />
                        </IconButton>
                        
                        {/* 强制继续按钮 - 只在有上下文问题时显示 */}
                        {hasContextIssue && onForceNext && (
                          <IconButton 
                            size="small" 
                            color="warning"
                            onClick={onForceNext}
                            title="强制继续（忽略上下文问题）"
                            sx={{ ml: 0.5 }}
                          >
                            <ForceNextIcon fontSize="small" />
                          </IconButton>
                        )}
                      </>
                    ) : hasFailed ? (
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={onStart}
                        title="继续执行"
                      >
                        <PlayIcon fontSize="small" />
                      </IconButton>
                    ) : (
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={onStart}
                        title="重新开始"
                      >
                        <PlayIcon fontSize="small" />
                      </IconButton>
                    )}
                  </>
                )}
                
                {/* 展开/折叠按钮 */}
                <IconButton 
                  size="small"
                  onClick={onToggleExpanded}
                  title={expanded ? "折叠" : "展开"}
                >
                  {expanded ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
                </IconButton>
                
                {/* 关闭按钮 */}
                <IconButton 
                  size="small"
                  onClick={onClose}
                  title="移除计划表"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Stack>
        </Stack>
        
        {/* 进度条 - 紧凑版 */}
        <Box sx={{ mt: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 4, 
              borderRadius: 2,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: isCompleted ? 'success.main' : 
                                isPaused ? 'error.main' : 'primary.main'
              }
            }} 
          />
        </Box>
      </Box>
      
      {/* 任务列表 - 可折叠，只有初始draft状态且从未执行过才默认展开 */}
      <Collapse in={isInitialDraft ? true : expanded}>
        <Box sx={{ p: 1.5, pt: 0 }}>
          <Stack spacing={1}>
            {todoList.items.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <Divider />}
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 1,
                    backgroundColor: item.status === 'completed' ? 'success.50' : 
                                    item.status === 'running' ? 'warning.50' : 'transparent',
                    border: item.status === 'running' ? '1px solid' : 'none',
                    borderColor: 'warning.main'
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    {/* 左侧进度图标 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 20 }}>
                      {getProgressIcon(item.status)}
                    </Box>
                    
                    {/* 步骤编号 */}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        minWidth: 20,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: 'primary.main'
                      }}
                    >
                      {item.order}
                    </Typography>
                    
                    {/* 任务文本 */}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        flex: 1,
                        textDecoration: item.status === 'completed' ? 'line-through' : 'none',
                        color: item.status === 'completed' ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {item.text}
                    </Typography>
                    
                    {/* 任务类型标签 */}
                    <Chip 
                      label={getTaskTypeText(item.taskType)}
                      size="small"
                      variant="filled"
                      sx={{ 
                        fontSize: '0.7rem',
                        height: 18,
                        fontWeight: 500,
                        '& .MuiChip-label': { px: 0.8 },
                        // 自定义颜色 - 更柔和的色调
                        ...(item.taskType === 'action' && {
                          backgroundColor: '#e3f2fd',
                          color: '#1565c0',
                          border: '1px solid #bbdefb',
                          '&:hover': { backgroundColor: '#bbdefb' }
                        }),
                        ...(item.taskType === 'llm' && {
                          backgroundColor: '#f3e5f5',
                          color: '#7b1fa2',
                          border: '1px solid #e1bee7',
                          '&:hover': { backgroundColor: '#e1bee7' }
                        }),
                        ...(item.taskType === 'user_input' && {
                          backgroundColor: '#fff3e0',
                          color: '#f57c00',
                          border: '1px solid #ffcc80',
                          '&:hover': { backgroundColor: '#ffcc80' }
                        })
                      }}
                    />
                  </Stack>
                </Box>
              </React.Fragment>
            ))}
          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
}
