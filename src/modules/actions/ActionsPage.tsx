import React from 'react';
import { Paper, Chip, IconButton, Stack, TextField, Typography, Button, Tabs, Tab, InputAdornment, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Box, Dialog, DialogTitle, DialogContent, DialogActions, Divider, CircularProgress } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CodeIcon from '@mui/icons-material/Code';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { backendApiService } from '../../services/backendApiService';
import { ACTION_LIBRARY } from '../../../shared/action-library';
import type { ActionDefinition } from '../../../shared/action-types';

// 使用统一的ActionDefinition类型
type ActionItem = ActionDefinition;

// 直接使用ACTION_LIBRARY，不需要中间变量

function getPromptData(action: ActionItem) {
  const prompts: Record<string, { prompt: string; inputExample: string; outputExample: string }> = {
    '用户评论情感分析': {
      prompt: `你是一个专业的情感分析助手。请分析用户评论的情感倾向。

输入格式：JSON
{
  "text": "用户评论内容",
  "context": "评论上下文"
}

任务要求：
分析评论的情感倾向，判断为正面、负面或中性，并给出置信度。

输出格式：JSON
{
  "sentiment": "正面/负面/中性",
  "confidence": 0.95,
  "keywords": ["关键词1", "关键词2"],
  "reason": "判断理由"
}`,
      inputExample: `{"text": "这款游戏画面精美，操作流畅，非常好玩！", "context": "游戏评论"}`,
      outputExample: `{"sentiment": "正面", "confidence": 0.92, "keywords": ["画面精美", "操作流畅", "非常好玩"], "reason": "用户使用多个正面词汇表达对游戏的喜爱"}`
    },
    '游戏标签分类': {
      prompt: `你是一个游戏分类专家。请根据游戏描述自动标注游戏类型。

输入格式：JSON
{
  "title": "游戏名称",
  "description": "游戏描述",
  "features": "游戏特性"
}

任务要求：
根据描述内容分析游戏类型，选择最合适的标签。

输出格式：JSON
{
  "primary_category": "主要类别",
  "secondary_categories": ["次要类别1", "次要类别2"],
  "tags": ["标签1", "标签2", "标签3"],
  "confidence": 0.88
}`,
      inputExample: `{"title": "王者荣耀", "description": "5v5公平竞技MOBA手游", "features": "团队作战,策略对抗,实时竞技"}`,
      outputExample: `{"primary_category": "MOBA", "secondary_categories": ["竞技", "策略"], "tags": ["多人在线", "团队作战", "实时对战"], "confidence": 0.95}`
    },
    '关键词提取': {
      prompt: `你是一个文本分析专家。请从用户反馈中提取核心关键词。

输入格式：JSON
{
  "text": "用户反馈内容",
  "max_keywords": 5
}

任务要求：
提取最重要的关键词和主题，按重要性排序。

输出格式：JSON
{
  "keywords": [
    {"word": "关键词", "weight": 0.9, "category": "类别"},
    {"word": "关键词2", "weight": 0.7, "category": "类别"}
  ],
  "themes": ["主题1", "主题2"],
  "summary": "简要总结"
}`,
      inputExample: `{"text": "游戏卡顿严重，经常掉线，客服态度也不好，希望尽快修复网络问题", "max_keywords": 5}`,
      outputExample: `{"keywords": [{"word": "卡顿", "weight": 0.9, "category": "性能"}, {"word": "掉线", "weight": 0.8, "category": "网络"}, {"word": "客服", "weight": 0.6, "category": "服务"}], "themes": ["技术问题", "服务质量"], "summary": "用户反映游戏性能和服务问题"}`
    },
    '文本摘要生成': {
      prompt: `你是一个文本摘要专家。请为长篇内容生成简洁摘要。

输入格式：JSON
{
  "text": "原始长文本",
  "max_length": 100,
  "focus": "摘要重点"
}

任务要求：
生成简洁准确的摘要，突出核心要点。

输出格式：JSON
{
  "summary": "摘要内容",
  "key_points": ["要点1", "要点2", "要点3"],
  "word_count": 85,
  "compression_ratio": 0.15
}`,
      inputExample: `{"text": "这款RPG游戏拥有精美的3D画面和丰富的剧情设定。玩家可以选择不同职业，在广阔的开放世界中冒险。游戏包含PVP和PVE玩法，装备系统复杂多样，社交功能完善。", "max_length": 50, "focus": "游戏特色"}`,
      outputExample: `{"summary": "精美3D画面的开放世界RPG，多职业选择，包含PVP/PVE玩法和复杂装备系统", "key_points": ["开放世界", "多职业", "PVP/PVE"], "word_count": 32, "compression_ratio": 0.4}`
    },
    '内容质量评分': {
      prompt: `你是一个内容质量评估专家。请评估用户生成内容的质量。

输入格式：JSON
{
  "content": "用户内容",
  "type": "内容类型",
  "criteria": ["评估维度1", "评估维度2"]
}

任务要求：
从多个维度评估内容质量，给出综合评分。

输出格式：JSON
{
  "overall_score": 8.5,
  "dimension_scores": {
    "originality": 9.0,
    "clarity": 8.0,
    "usefulness": 8.5
  },
  "strengths": ["优点1", "优点2"],
  "improvements": ["改进建议1", "改进建议2"]
}`,
      inputExample: `{"content": "这个游戏的战斗系统很有趣，不过新手引导做得不够好，建议加强教程部分", "type": "游戏评价", "criteria": ["原创性", "清晰度", "有用性"]}`,
      outputExample: `{"overall_score": 7.5, "dimension_scores": {"originality": 7.0, "clarity": 8.5, "usefulness": 7.0}, "strengths": ["表达清晰", "提出建设性意见"], "improvements": ["可以更详细描述问题", "提供具体改进方案"]}`
    }
  };
  return prompts[action.name] || prompts['用户评论情感分析'];
}

export default function ActionsPage(): JSX.Element {
  const [query, setQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'api_call' | 'llm_task' | 'code_execution' | 'image_generation'>('all');
  const [viewDialogOpen, setViewDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [testDialogOpen, setTestDialogOpen] = React.useState(false);
  const [selectedAction, setSelectedAction] = React.useState<ActionItem | null>(null);
  const [testInput, setTestInput] = React.useState('');
  const [jsonParams, setJsonParams] = React.useState('');
  const [testOutput, setTestOutput] = React.useState('');
  const [testLoading, setTestLoading] = React.useState(false);
  const [convertLoading, setConvertLoading] = React.useState(false);
  const [apiTestParams, setApiTestParams] = React.useState<Record<string, string>>({});

  // 🆕 类型显示映射：英文type → 中文显示
  const typeDisplayMap: Record<string, string> = {
    'code_execution': '执行代码',
    'api_call': 'API调用',
    'llm_task': '提示工程',
    'image_generation': '图像生成',
    'clarify': '信息收集'
  };

  const filtered = React.useMemo(() => {
    const q = query.trim();
    return ACTION_LIBRARY.filter(a => {
      const byQuery = !q || a.name.includes(q) || a.description.includes(q);
      const byType = typeFilter === 'all' || a.type === typeFilter;
      return byQuery && byType;
    });
  }, [query, typeFilter]);

  const handleViewAction = (action: ActionItem) => {
    setSelectedAction(action);
    setViewDialogOpen(true);
  };

  const handleEditAction = (action: ActionItem) => {
    setSelectedAction(action);
    setEditDialogOpen(true);
  };

  const handleTestAction = (action: ActionItem) => {
    setSelectedAction(action);
    setTestInput('');
    setJsonParams('');
    setTestOutput('');
    setApiTestParams({});
    setTestDialogOpen(true);
  };

  const runPromptTest = async () => {
    if (!selectedAction || !testInput.trim()) return;
    
    setTestLoading(true);
    setTestOutput('');

    try {
      const promptData = getPromptData(selectedAction);
      const fullPrompt = `${promptData.prompt}\n\n用户输入：\n${testInput}\n\n请严格按照上述格式要求输出结果：`;

      const messages = [{ role: 'user' as const, content: fullPrompt }];
      
      // 使用后端API进行聊天
      const response = await backendApiService.getChatCompletion(
        messages,
        0.7,  // temperature
        2000  // max_tokens
      );

      if (response.success && response.content) {
        setTestOutput(response.content);
      } else {
        setTestOutput(`{"error": "${response.error || '未收到有效响应'}"}`);
      }
    } catch (error) {
      console.error('测试失败:', error);
      setTestOutput('{"error": "测试失败，请检查网络连接和后端服务状态"}');
    } finally {
      setTestLoading(false);
    }
  };

  const runApiTest = async () => {
    if (!selectedAction || !selectedAction.apiConfig) return;
    
    setTestLoading(true);
    setTestOutput('');

    try {
      // 模拟API调用测试
      const config = selectedAction.apiConfig;
      let endpoint = config.endpoint;
      
      // 替换URL中的参数
      Object.entries(apiTestParams).forEach(([key, value]) => {
        endpoint = endpoint.replace(`{${key}}`, value);
      });

      const testResult = {
        request: {
          method: config.method,
          url: endpoint,
          headers: config.headers,
          params: { ...config.params, ...apiTestParams },
          body: config.body
        },
        response: {
          status: 200,
          message: "API测试模拟成功",
          data: "这是模拟的API响应数据",
          timestamp: new Date().toISOString()
        }
      };

      setTestOutput(JSON.stringify(testResult, null, 2));
    } catch (error) {
      console.error('API测试失败:', error);
      setTestOutput(JSON.stringify({ error: "API测试失败", details: (error as Error).message }, null, 2));
    } finally {
      setTestLoading(false);
    }
  };

  // 转换自然语言为JSON参数
  const handleConvertToJson = async () => {
    if (!selectedAction || !testInput.trim()) return;
    
    setConvertLoading(true);
    
    try {
      const convertedParams = await convertNaturalLanguageToParams(testInput, selectedAction);
      if (convertedParams.error) {
        alert(`转换失败: ${convertedParams.error}`);
        setConvertLoading(false);
        return;
      }
      
      setJsonParams(JSON.stringify(convertedParams, null, 2));
    } catch (error) {
      alert(`转换失败: ${error}`);
    } finally {
      setConvertLoading(false);
    }
  };

  const runCodeTest = async () => {
    if (!selectedAction?.pythonCode || !jsonParams.trim()) return;
    
    setTestLoading(true);
    setTestOutput('');
    
    try {
      // 解析JSON参数
      let params;
      try {
        params = JSON.parse(jsonParams);
      } catch (e) {
        setTestOutput(`JSON解析错误: ${e}`);
        setTestLoading(false);
        return;
      }
      
      // 模拟代码执行
      let result;
      if (selectedAction.name === '数学计算器') {
        result = await simulateCalculator(params.expression);
      } else if (selectedAction.name === '文本处理工具') {
        result = await simulateTextProcessor(params.text, params.operation);
      } else if (selectedAction.name === 'JSON数据处理') {
        result = await simulateJsonHandler(params.data, params.operation);
      } else if (selectedAction.name === '日期时间处理') {
        result = await simulateDateTimeHandler(params.input_data, params.operation);
      } else if (selectedAction.name === '数据分析工具') {
        result = await simulateDataAnalyzer(params.numbers, params.operation);
      } else if (selectedAction.name === '游戏数据分析') {
        result = await simulateGameDataAnalyzer(params.data, params.analysis_type);
      } else {
        result = { error: '未知的函数' };
      }
      
      setTestOutput(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestOutput(`代码执行失败: ${error}`);
    } finally {
      setTestLoading(false);
    }
  };

  // 使用LLM将自然语言转换为函数参数
  const convertNaturalLanguageToParams = async (input: string, action: ActionItem) => {
    try {
      const systemPrompt = `你是一个智能代码助手，需要将用户的自然语言描述转换为函数调用参数。

函数信息：
- 函数名：${action.name}
- 描述：${action.description}

${action.name === '数学计算器' ? `
参数格式：{"expression": "数学表达式"}
支持的操作：+, -, *, /, **, sin, cos, tan, log, sqrt, abs, round, min, max, sum, pi, e
示例：
- "计算2+3乘以4" -> {"expression": "2+3*4"}
- "求平方根16" -> {"expression": "sqrt(16)"}
- "计算正弦值pi/2" -> {"expression": "sin(pi/2)"}
` : action.name === '文本处理工具' ? `
参数格式：{"text": "文本内容", "operation": "操作类型"}
支持的操作：count(统计), upper(大写), lower(小写), reverse(反转), words(分词), chars(字符分析)
示例：
- "统计Hello World的字符数" -> {"text": "Hello World", "operation": "count"}
- "将Python转换为大写" -> {"text": "Python", "operation": "upper"}
- "分析这段文字的字符统计" -> {"text": "这段文字", "operation": "chars"}
` : action.name === 'JSON数据处理' ? `
参数格式：{"data": JSON数据, "operation": "操作类型"}
支持的操作：validate(验证), format(格式化), extract(提取)
示例：
- "验证这个JSON格式" -> {"data": {"key": "value"}, "operation": "validate"}
- "格式化JSON数据" -> {"data": {"name":"test"}, "operation": "format"}
` : action.name === '日期时间处理' ? `
参数格式：{"input_data": "日期字符串", "operation": "操作类型"}
支持的操作：current(当前时间), format(格式转换), calculate(计算)
示例：
- "获取当前时间" -> {"input_data": "", "operation": "current"}
- "转换日期格式2024-01-01" -> {"input_data": "2024-01-01", "operation": "format"}
` : action.name === '数据分析工具' ? `
参数格式：{"numbers": [数字数组], "operation": "操作类型"}
支持的操作：stats(统计), trend(趋势), distribution(分布), compare(比较)
示例：
- "分析这些数据的统计信息" -> {"numbers": [1,2,3,4,5], "operation": "stats"}
- "分析数据趋势" -> {"numbers": [10,12,15,18], "operation": "trend"}
` : action.name === '游戏数据分析' ? `
参数格式：{"data": 游戏数据对象, "analysis_type": "分析类型"}
支持的分析：player_stats(玩家统计), revenue(收益分析), retention(留存分析)
示例：
- "分析玩家数据" -> {"data": {"players": [{"level": 10, "playtime": 120}]}, "analysis_type": "player_stats"}
- "分析收益数据" -> {"data": {"daily_revenue": [100,120,110]}, "analysis_type": "revenue"}
` : `
参数格式：{"text": "文本内容", "operation": "操作类型"}
支持的操作：count(统计), upper(大写), lower(小写), reverse(反转), words(分词), chars(字符分析)
示例：
- "统计Hello World的字符数" -> {"text": "Hello World", "operation": "count"}
`}

请将用户输入转换为正确的JSON格式参数。只返回JSON，不要其他解释。`;

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: input }
      ];
      
      // 使用后端API获取响应
      const response = await backendApiService.getChatCompletion(
        messages,
        0.7,  // temperature
        1000  // max_tokens
      );
      
      if (!response.success || !response.content) {
        return { error: response.error || '无法获取LLM响应' };
      }
      
      const llmResponse = response.content;
      
      // 尝试从LLM响应中提取JSON
      const jsonMatch = llmResponse.match(/\{[^{}]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // 如果没有找到JSON，尝试直接解析整个响应
        return JSON.parse(llmResponse.trim());
      }
    } catch (error) {
      console.error('LLM转换失败:', error);
      return { error: `无法理解输入内容: ${error}` };
    }
  };

  // 模拟计算器函数
  const simulateCalculator = async (expression: string) => {
    try {
      // 基本的安全检查
      if (!expression || typeof expression !== 'string') {
        return { error: "表达式无效" };
      }
      
      // 简单的数学表达式计算（实际项目中需要更安全的实现）
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      if (sanitized !== expression) {
        return { error: "表达式包含不安全字符" };
      }
      
      const result = Function(`"use strict"; return (${sanitized})`)();
      return { result, expression };
    } catch (e) {
      return { error: `计算错误: ${e}` };
    }
  };

  // 模拟文本处理函数
  const simulateTextProcessor = async (text: string, operation: string = 'count') => {
    try {
      if (!text || typeof text !== 'string') {
        return { error: "输入必须是字符串" };
      }
      
      switch (operation) {
        case 'count':
          return {
            "字符数": text.length,
            "单词数": text.split(/\s+/).filter(w => w).length,
            "行数": text.split('\n').length,
            "段落数": text.split('\n\n').filter(p => p.trim()).length
          };
        case 'upper':
          return { result: text.toUpperCase() };
        case 'lower':
          return { result: text.toLowerCase() };
        case 'reverse':
          return { result: text.split('').reverse().join('') };
        case 'words':
          const words = text.split(/\s+/).filter(w => w);
          return {
            "单词列表": words,
            "单词数量": words.length,
            "去重单词": [...new Set(words)]
          };
        case 'chars':
          const charCount: Record<string, number> = {};
          for (const char of text.toLowerCase()) {
            charCount[char] = (charCount[char] || 0) + 1;
          }
          const sorted = Object.entries(charCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
          return {
            "字符统计": Object.fromEntries(sorted),
            "最常见字符": sorted[0] || null
          };
        default:
          return { error: `不支持的操作: ${operation}` };
      }
    } catch (e) {
      return { error: `处理错误: ${e}` };
    }
  };

  // 模拟JSON处理函数
  const simulateJsonHandler = async (data: any, operation: string = 'validate') => {
    try {
      if (operation === 'validate') {
        return { valid: true, type: typeof data, message: 'JSON格式有效' };
      } else if (operation === 'format') {
        return { formatted: JSON.stringify(data, null, 2) };
      } else if (operation === 'extract') {
        const keys = typeof data === 'object' ? Object.keys(data) : [];
        return { keys, count: keys.length };
      }
      return { error: '不支持的操作' };
    } catch (e) {
      return { error: `处理错误: ${e}` };
    }
  };

  // 模拟日期时间处理函数
  const simulateDateTimeHandler = async (input_data: string, operation: string = 'current') => {
    try {
      const now = new Date();
      if (operation === 'current') {
        return {
          当前时间: now.toLocaleString('zh-CN'),
          时间戳: Math.floor(now.getTime() / 1000),
          星期: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()]
        };
      } else if (operation === 'format') {
        return {
          标准格式: input_data,
          时间戳: Math.floor(Date.parse(input_data) / 1000) || '无效日期'
        };
      }
      return { result: `已处理: ${input_data}` };
    } catch (e) {
      return { error: `处理错误: ${e}` };
    }
  };

  // 模拟数据分析函数
  const simulateDataAnalyzer = async (numbers: number[], operation: string = 'stats') => {
    try {
      if (!Array.isArray(numbers)) return { error: '输入必须是数组' };
      const data = numbers.filter(n => typeof n === 'number');
      
      if (operation === 'stats') {
        const sum = data.reduce((a, b) => a + b, 0);
        const avg = sum / data.length;
        return {
          数据量: data.length,
          总和: sum,
          平均值: Math.round(avg * 100) / 100,
          最大值: Math.max(...data),
          最小值: Math.min(...data)
        };
      } else if (operation === 'trend') {
        const trend = data.length > 1 && data[data.length - 1] > data[0] ? '上升' : '下降';
        return { 趋势: trend, 变化: data[data.length - 1] - data[0] };
      }
      return { result: '分析完成' };
    } catch (e) {
      return { error: `分析错误: ${e}` };
    }
  };

  // 模拟游戏数据分析函数
  const simulateGameDataAnalyzer = async (data: any, analysis_type: string = 'player_stats') => {
    try {
      if (analysis_type === 'player_stats') {
        const players = data.players || [];
        return {
          总玩家数: players.length,
          活跃玩家: Math.floor(players.length * 0.7),
          新手玩家: Math.floor(players.length * 0.3)
        };
      } else if (analysis_type === 'revenue') {
        const revenues = data.daily_revenue || [];
        const total = revenues.reduce((a: number, b: number) => a + b, 0);
        return {
          总收益: total,
          日均收益: Math.round(total / revenues.length * 100) / 100,
          预计月收益: Math.round(total / revenues.length * 30 * 100) / 100
        };
      }
      return { result: '分析完成' };
    } catch (e) {
      return { error: `游戏数据分析错误: ${e}` };
    }
  };

  return (
    <Stack spacing={2}>
      <Stack>
        <Typography variant="h5">动作库</Typography>
        <Typography variant="body2" color="text.secondary">常用运营与分析动作的集合</Typography>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={typeFilter} 
            onChange={(_, v) => setTypeFilter(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="全部" value="all" />
            <Tab label="API调用" value="api_call" />
            <Tab label="提示工程" value="llm_task" />
            <Tab label="执行代码" value="code_execution" />
            <Tab label="图像生成" value="image_generation" />
          </Tabs>
        </Box>
        <TextField
          placeholder="搜索动作..."
          variant="outlined"
          size="small"
          value={query}
          onChange={e => setQuery(e.target.value)}
          sx={{ maxWidth: 280 }}
          InputProps={{ 
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            )
          }}
        />
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', py: 2 }}>名称</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', width: 140, py: 2 }}>类型</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', py: 2 }}>描述</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', width: 120, py: 2 }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(item => (
              <TableRow 
                key={item.id} 
                sx={{ 
                  '&:hover': { backgroundColor: 'grey.25' },
                  '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' }
                }}
              >
                <TableCell sx={{ py: 2.5 }}>
                  <Typography variant="body1" fontWeight={600} sx={{ color: 'text.primary' }}>
                    {item.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2.5 }}>
                  <Chip 
                    label={typeDisplayMap[item.type] || item.type} 
                    size="small" 
                    variant="filled"
                    sx={{ 
                      backgroundColor: item.type === 'api_call' 
                        ? 'rgba(25, 118, 210, 0.08)' 
                        : item.type === 'code_execution'
                        ? 'rgba(255, 152, 0, 0.08)'
                        : item.type === 'image_generation'
                        ? 'rgba(76, 175, 80, 0.08)'
                        : 'rgba(156, 39, 176, 0.08)',
                      color: item.type === 'api_call' 
                        ? 'primary.main' 
                        : item.type === 'code_execution'
                        ? 'orange.main'
                        : item.type === 'image_generation'
                        ? 'success.main'
                        : 'secondary.main',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      height: 24,
                      border: 'none'
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 2.5 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                    {item.description}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ py: 2.5 }}>
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    <Button 
                      size="small" 
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      sx={{ 
                        minWidth: 80,
                        px: 1,
                        color: 'grey.600',
                        borderColor: 'grey.300',
                        '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                      }}
                      onClick={() => handleViewAction(item)}
                    >
                      查看
                    </Button>
                    <Button 
                      size="small" 
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      sx={{ 
                        minWidth: 80,
                        px: 1
                      }}
                      onClick={() => handleTestAction(item)}
                    >
                      测试
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} sx={{ py: 6 }}>
                  <Typography align="center" color="text.secondary">无匹配结果</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>


      {/* 测试对话框 */}
      <Dialog open={testDialogOpen} onClose={() => setTestDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedAction?.type === 'code_execution' ? <CodeIcon color="primary" /> : <PlayArrowIcon color="primary" />}
            {selectedAction?.type === 'api_call' ? '测试API' : selectedAction?.type === 'code_execution' ? '测试代码执行' : '测试提示词'} - {selectedAction?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {selectedAction?.type === 'api_call' && selectedAction.apiConfig && (
              <>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    API 参数配置
                  </Typography>
                  <Stack spacing={2}>
                    {selectedAction.apiConfig.params && Object.keys(selectedAction.apiConfig.params).map(paramKey => (
                      <TextField
                        key={paramKey}
                        label={paramKey}
                        placeholder={selectedAction.apiConfig!.params![paramKey]}
                        value={apiTestParams[paramKey] || ''}
                        onChange={(e) => setApiTestParams(prev => ({ ...prev, [paramKey]: e.target.value }))}
                        fullWidth
                        size="small"
                      />
                    ))}
                    {selectedAction.apiConfig.authentication.keyName && (
                      <TextField
                        label={`${selectedAction.apiConfig.authentication.type} Key`}
                        placeholder="输入API密钥"
                        value={apiTestParams[selectedAction.apiConfig.authentication.keyName] || ''}
                        onChange={(e) => setApiTestParams(prev => ({ 
                          ...prev, 
                          [selectedAction.apiConfig!.authentication.keyName!]: e.target.value 
                        }))}
                        fullWidth
                        size="small"
                        type="password"
                      />
                    )}
                  </Stack>
                </Box>
              </>
            )}
            
            {selectedAction?.type === 'llm_task' && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  输入测试数据 (自然语言)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder={selectedAction ? getPromptData(selectedAction).inputExample : ''}
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                />
              </Box>
            )}
            
            {selectedAction?.type === 'code_execution' && (
              <>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    输入测试数据 (自然语言)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder={
                      selectedAction?.name === '数学计算器' 
                        ? '计算 2+3*4 的结果\n计算 sqrt(16) + sin(pi/2)\n求解 log10(100)' 
                        : selectedAction?.name === '文本处理工具'
                        ? '统计这段文字的字符数\n将"Hello World"转换为大写\n分析"Python代码"的字符统计'
                        : selectedAction?.name === 'JSON数据处理'
                        ? '验证这个JSON格式是否正确\n格式化JSON数据\n提取JSON中的所有键值对'
                        : selectedAction?.name === '日期时间处理'
                        ? '获取当前时间和星期几\n转换日期格式2024-01-01\n计算2024-01-01距今多少天'
                        : selectedAction?.name === '数据分析工具'
                        ? '分析这些数据的统计信息：[1,2,3,4,5,6,7,8,9,10]\n分析数据趋势：[100,120,110,150,140]\n比较数据分布：[85,92,78,95,88,91,87]'
                        : selectedAction?.name === '游戏数据分析'
                        ? '分析玩家数据统计\n分析每日收益趋势\n分析用户留存情况'
                        : '输入要处理的数据...'
                    }
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                  />
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      用自然语言描述你想要执行的操作
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleConvertToJson}
                      disabled={convertLoading || !testInput.trim()}
                      startIcon={convertLoading ? <CircularProgress size={16} /> : null}
                    >
                      {convertLoading ? '转换中...' : '转换为JSON'}
                    </Button>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    函数调用参数 (JSON格式)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder={
                      selectedAction?.name === '数学计算器' 
                        ? '{"expression": "2+3*4"}' 
                        : selectedAction?.name === '文本处理工具'
                        ? '{"text": "Hello World", "operation": "count"}'
                        : selectedAction?.name === 'JSON数据处理'
                        ? '{"data": {"name": "test", "value": 123}, "operation": "validate"}'
                        : selectedAction?.name === '日期时间处理'
                        ? '{"input_data": "2024-01-01", "operation": "format"}'
                        : selectedAction?.name === '数据分析工具'
                        ? '{"numbers": [1,2,3,4,5], "operation": "stats"}'
                        : selectedAction?.name === '游戏数据分析'
                        ? '{"data": {"players": [{"level": 10, "playtime": 120}]}, "analysis_type": "player_stats"}'
                        : '{"parameter": "value"}'
                    }
                    value={jsonParams}
                    onChange={(e) => setJsonParams(e.target.value)}
                    sx={{ fontFamily: 'monospace' }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    可以直接编辑JSON参数，或通过上方的自然语言自动生成
                  </Typography>
                </Box>
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                onClick={() => {
                  setTestInput('');
                  setJsonParams('');
                  setTestOutput('');
                  setApiTestParams({});
                }}
                disabled={testLoading}
              >
                清空
              </Button>
              <Button
                variant="contained"
                startIcon={testLoading ? <CircularProgress size={16} /> : 
                  (selectedAction?.type === 'code_execution' ? <CodeIcon /> : <PlayArrowIcon />)}
                onClick={selectedAction?.type === 'api_call' ? runApiTest : 
                  selectedAction?.type === 'code_execution' ? runCodeTest : runPromptTest}
                disabled={testLoading || (selectedAction?.type === 'llm_task' && !testInput.trim()) || (selectedAction?.type === 'code_execution' && !jsonParams.trim())}
                sx={{ minWidth: 120 }}
              >
                {testLoading ? '测试中...' : '运行测试'}
              </Button>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                输出结果
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', minHeight: 120 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    whiteSpace: 'pre-wrap',
                    color: testOutput ? 'text.primary' : 'text.disabled'
                  }}
                >
                  {testOutput || '运行测试后将显示输出结果...'}
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>关闭</Button>
          <Button 
            variant="outlined" 
            onClick={() => { 
              setTestInput(''); 
              setTestOutput(''); 
              setApiTestParams({});
            }}
            disabled={!testInput && !testOutput && Object.keys(apiTestParams).length === 0}
          >
            清空
          </Button>
        </DialogActions>
      </Dialog>

      {/* 查看对话框 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 1 }}>
          {selectedAction?.name}
          <IconButton 
            onClick={() => setViewDialogOpen(false)}
            size="small"
            sx={{ color: 'grey.500' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">类型</Typography>
              <Chip label={selectedAction?.type} size="small" sx={{ mt: 0.5 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">描述</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>{selectedAction?.description}</Typography>
            </Box>
            {selectedAction?.type === 'api_call' && selectedAction.apiConfig && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">API 配置</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">请求方法</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                          {selectedAction.apiConfig.method}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">接口地址</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          {selectedAction.apiConfig.endpoint}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">认证方式</Typography>
                        <Typography variant="body2">
                          {selectedAction.apiConfig.authentication.type} 
                          {selectedAction.apiConfig.authentication.keyName && 
                            ` (${selectedAction.apiConfig.authentication.keyName})`
                          }
                        </Typography>
                      </Box>
                      {selectedAction.apiConfig.params && Object.keys(selectedAction.apiConfig.params).length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">请求参数</Typography>
                          <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'background.paper' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {JSON.stringify(selectedAction.apiConfig.params, null, 2)}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                      {selectedAction.apiConfig.body && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">请求体</Typography>
                          <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'background.paper' }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {selectedAction.apiConfig.body}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                </Box>
              </>
            )}
            {selectedAction?.type === 'image_generation' && selectedAction.imageConfig && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">图像生成配置</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">模型</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>
                          {selectedAction.imageGenConfig.model}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">默认尺寸</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {selectedAction.imageGenConfig.defaultSize}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">支持的尺寸</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          {selectedAction.imageGenConfig.supportedSizes.map(size => (
                            <Chip key={size} label={size} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              </>
            )}
            {selectedAction?.type === 'code_execution' && selectedAction.codeConfig && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Python 代码</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                      {selectedAction.pythonCode}
                    </Typography>
                  </Paper>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">使用说明</Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {selectedAction.name === '数学计算器' ? 
                        '这是一个安全的数学计算器，支持基本运算(+, -, *, /, **)和数学函数(sin, cos, tan, log, sqrt等)。使用时需要传入expression参数。' :
                      selectedAction.name === '文本处理工具' ?
                        '这是一个文本处理工具，支持多种文本操作。使用时需要传入text和operation参数，operation可以是count、upper、lower、reverse、words、chars等。' :
                      selectedAction.name === 'JSON数据处理' ?
                        '这是一个JSON数据处理工具，支持验证、格式化、提取等操作。使用时需要传入data和operation参数，operation可以是validate、format、extract等。' :
                      selectedAction.name === '日期时间处理' ?
                        '这是一个日期时间处理工具，支持当前时间获取、格式转换、日期计算等。使用时需要传入input_data和operation参数，operation可以是current、format、calculate、parse等。' :
                      selectedAction.name === '数据分析工具' ?
                        '这是一个数据分析工具，支持统计分析、趋势分析、分布分析等。使用时需要传入numbers数组和operation参数，operation可以是stats、trend、distribution、compare等。' :
                      selectedAction.name === '游戏数据分析' ?
                        '这是一个游戏数据分析工具，支持玩家统计、收益分析、留存分析等。使用时需要传入data对象和analysis_type参数，analysis_type可以是player_stats、revenue、retention等。' :
                        '这是一个代码执行工具，请查看代码了解具体用法。'
                      }
                    </Typography>
                  </Paper>
                </Box>
              </>
            )}
            {selectedAction?.type === 'llm_task' && (() => {
              const promptData = getPromptData(selectedAction);
              return (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">提示词模板</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {promptData.prompt}
                      </Typography>
                    </Paper>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">示例输入</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {promptData.inputExample}
                      </Typography>
                    </Paper>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">示例输出</Typography>
                    <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {promptData.outputExample}
                      </Typography>
                    </Paper>
                  </Box>
                </>
              );
            })()}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: (selectedAction?.type === 'llm_task' || selectedAction?.type === 'api_call' || selectedAction?.type === 'code_execution' || selectedAction?.type === 'image_generation') ? 'flex-start' : 'flex-end' }}>
          {(selectedAction?.type === 'llm_task' || selectedAction?.type === 'api_call' || selectedAction?.type === 'code_execution' || selectedAction?.type === 'image_generation') && (
            <Button 
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => {
                setViewDialogOpen(false);
                setEditDialogOpen(true);
              }}
            >
              编辑配置
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>编辑 - {selectedAction?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="名称" defaultValue={selectedAction?.name} fullWidth />
            <TextField label="描述" defaultValue={selectedAction?.description} fullWidth multiline rows={2} />
            {selectedAction?.type === 'api_call' && selectedAction.apiConfig && (
              <>
                <TextField 
                  label="请求方法" 
                  defaultValue={selectedAction.apiConfig.method}
                  fullWidth
                />
                <TextField 
                  label="接口地址" 
                  defaultValue={selectedAction.apiConfig.endpoint}
                  fullWidth
                />
                <TextField 
                  label="认证类型" 
                  defaultValue={selectedAction.apiConfig.authentication.type}
                  fullWidth
                />
                <TextField 
                  label="认证密钥名称" 
                  defaultValue={selectedAction.apiConfig.authentication.keyName || ''}
                  fullWidth
                />
                <TextField 
                  label="请求参数 (JSON)" 
                  multiline 
                  rows={4} 
                  fullWidth
                  defaultValue={selectedAction.apiConfig.params ? JSON.stringify(selectedAction.apiConfig.params, null, 2) : '{}'}
                />
                {selectedAction.apiConfig.body && (
                  <TextField 
                    label="请求体 (JSON)" 
                    multiline 
                    rows={4} 
                    fullWidth
                    defaultValue={selectedAction.apiConfig.body}
                  />
                )}
              </>
            )}
            {selectedAction?.type === 'code_execution' && (
              <TextField 
                label="Python 代码" 
                multiline 
                rows={15} 
                fullWidth
                defaultValue={selectedAction.pythonCode}
                sx={{ fontFamily: 'monospace' }}
                helperText="编辑Python代码，确保代码安全且符合预期功能"
              />
            )}
            {selectedAction?.type === 'llm_task' && (() => {
              const promptData = getPromptData(selectedAction);
              return (
                <>
                  <TextField 
                    label="提示词模板" 
                    multiline 
                    rows={10} 
                    fullWidth
                    defaultValue={promptData.prompt}
                  />
                  <TextField 
                    label="示例输入" 
                    multiline 
                    rows={3} 
                    fullWidth
                    defaultValue={promptData.inputExample}
                  />
                  <TextField 
                    label="示例输出" 
                    multiline 
                    rows={3} 
                    fullWidth
                    defaultValue={promptData.outputExample}
                  />
                </>
              );
            })()}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={() => setEditDialogOpen(false)}>保存</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}


