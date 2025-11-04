// 动作执行结果展示组件

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Collapse,
  IconButton,
  Chip,
  Stack,
  Divider,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Code as CodeIcon,
  Api as ApiIcon,
  Psychology as PromptIcon,
  Psychology as ReasoningIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { TodoStepResult } from '../services/todoExecutionService';

interface ActionResultDisplayProps {
  result: TodoStepResult;
  defaultExpanded?: boolean;
}

export default function ActionResultDisplay({
  result,
  defaultExpanded = false
}: ActionResultDisplayProps): JSX.Element {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  // 检查是否是用户询问或LLM任务，这些任务只显示标题
  const isSimpleTask = result.executionResult?.result?.waitingForInput || 
                      result.executionResult?.result?.isLLMTask;

  // 获取动作类型图标
  const getActionIcon = () => {
    if (!result.actionUsed) return <CodeIcon sx={{ fontSize: 16 }} />;
    
    switch (result.actionUsed.type) {
      case 'code_execution':
        return <CodeIcon sx={{ fontSize: 16, color: 'info.main' }} />;
      case 'api_call':
        return <ApiIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
      case 'llm_task':
        return <PromptIcon sx={{ fontSize: 16, color: 'secondary.main' }} />;
      case 'image_generation':
        return <PromptIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'clarify':
        return <PromptIcon sx={{ fontSize: 16, color: 'primary.main' }} />;
      default:
        return <CodeIcon sx={{ fontSize: 16 }} />;
    }
  };

  // 获取原始执行结果
  const getRawExecutionResult = () => {
    if (!result.executionResult?.result) {
      return result.error || '无执行结果';
    }

    const resultData = result.executionResult.result;
    
    // 直接返回原始结果，如果是对象则格式化为JSON
    if (typeof resultData === 'object') {
      return JSON.stringify(resultData, null, 2);
    }
    
    return String(resultData);
  };

  // 检查结果是否为JSON格式
  const isJsonResult = () => {
    if (!result.executionResult?.result) return false;
    return typeof result.executionResult.result === 'object';
  };

  // 如果是简单任务（用户询问或LLM任务），只显示简化的标题栏
  if (isSimpleTask) {
    return (
      <Paper 
        variant="outlined" 
        sx={{ 
          mt: 1,
          mb: 1,
          backgroundColor: (result.success || result.executionResult?.result?.partialSuccess) ? 'success.50' : 'error.50',
          borderColor: (result.success || result.executionResult?.result?.partialSuccess) ? 'success.200' : 'error.200',
          borderRadius: 2
        }}
      >
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            {/* 状态图标 */}
            {(result.success || result.executionResult?.result?.partialSuccess) ? (
              <SuccessIcon sx={{ fontSize: 18, color: 'success.main' }} />
            ) : (
              <ErrorIcon sx={{ fontSize: 18, color: 'error.main' }} />
            )}
            
            {/* 步骤信息 */}
            <Typography variant="body2" fontWeight="medium">
              {result.stepText}
            </Typography>
            
            {/* 任务类型标签 */}
            <Chip
              label={result.waitingForContext ? '等待上下文' : 
                     result.executionResult?.result?.waitingForInput ? '等待中' : 
                     result.executionResult?.result?.reasoningApplied ? 'LLM处理(增强)' : 'LLM处理'}
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem',
                height: 20,
                '& .MuiChip-label': { px: 0.5 }
              }}
              color={result.waitingForContext ? 'warning' :
                     result.executionResult?.result?.waitingForInput ? 'info' : 
                     (result.success || result.executionResult?.result?.partialSuccess) ? 'success' : 'error'}
            />
            
            {/* 推理状态标签 */}
            {result.reasoning && (
              <Chip
                icon={<ReasoningIcon sx={{ fontSize: '12px !important' }} />}
                label={result.reasoning.shouldProceed ? '推理通过' : '需要更多信息'}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem',
                  height: 20,
                  '& .MuiChip-label': { px: 0.5 },
                  '& .MuiChip-icon': { fontSize: 12, ml: 0.5 }
                }}
                color={result.reasoning.shouldProceed ? 'success' : 'warning'}
              />
            )}
            
            {/* 执行时间 */}
            <Typography variant="caption" color="text.secondary">
              {result.executionTime}ms
            </Typography>
          </Stack>
        </Box>
      </Paper>
    );
  }

  // 对于其他任务（action类型），显示完整的可展开面板
  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        mt: 1,
        mb: 1,
        backgroundColor: result.success ? 'success.50' : 'error.50',
        borderColor: result.success ? 'success.200' : 'error.200',
        borderRadius: 2
      }}
    >
      {/* 头部 - 可点击展开/收起 */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 1.5,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {/* 状态图标 */}
          {result.success ? (
            <SuccessIcon sx={{ fontSize: 18, color: 'success.main' }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 18, color: 'error.main' }} />
          )}
          
          {/* 步骤信息 */}
          <Typography variant="body2" fontWeight="medium">
            {result.stepText}
          </Typography>
          
          {/* 工具标签 */}
          {result.actionUsed && (
            <Chip
              label={result.actionUsed.name}
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: '0.7rem',
                height: 20,
                '& .MuiChip-label': { px: 0.5 }
              }}
              color={result.success ? 'success' : 'error'}
            />
          )}
          
          {/* 执行时间 */}
          <Typography variant="caption" color="text.secondary">
            {result.executionTime}ms
          </Typography>
        </Stack>

        {/* 展开/收起图标 */}
        <IconButton size="small" sx={{ ml: 1 }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* 详细结果 - 可展开 */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 1.5, pt: 1 }}>
          {result.success ? (
            <Box>
              {/* 执行结果 */}
              <Typography variant="subtitle2" gutterBottom>
                原始执行结果
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  backgroundColor: isJsonResult() ? 'grey.900' : 'background.default',
                  color: isJsonResult() ? 'common.white' : 'text.primary',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: isJsonResult() ? 'grey.700' : 'divider',
                  borderRadius: 1
                }}
              >
                {getRawExecutionResult()}
              </Paper>
              
              {/* 工具详情 */}
              {result.actionUsed && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    工具: {result.actionUsed.name} ({result.actionUsed.type})
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="error" sx={{ mt: 0 }}>
              <Typography variant="subtitle2" gutterBottom>
                执行失败
              </Typography>
              <Typography variant="body2">
                {result.error}
              </Typography>
            </Alert>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

// 导出类型以供其他组件使用
export type { TodoStepResult };
