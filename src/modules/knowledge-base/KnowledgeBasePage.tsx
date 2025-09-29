import React, { useState, useEffect } from 'react';
import {
  Stack,
  Typography,
  Tabs,
  Tab,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  Divider,
  Switch,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  UploadFile as UploadFileIcon,
  TableChart as TableChartIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  InsertDriveFile as InsertDriveFileIcon
} from '@mui/icons-material';
import { 
  embeddingService, 
  vectorizeContent, 
  ragSearch, 
  EmbeddedChunk, 
  RAGSearchResult 
} from '../../services/embeddingService';

// 知识源类型
type KnowledgeSourceType = 'file' | 'google_sheet';

// 知识库类别
type KnowledgeCategory = 'personal' | 'project' | 'public' | 'skills';

// 知识源接口
interface KnowledgeSource {
  id: string;
  name: string;
  type: KnowledgeSourceType;
  category: KnowledgeCategory;
  enabled: boolean; // 用于控制开关状态
  status: 'active' | 'processing' | 'error';
  createdAt: string;
  updatedAt: string;
  // 文件相关
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  content?: string; // 文档内容
  // Google Sheet相关
  sheetUrl?: string;
  sheetId?: string;
  range?: string;
  // 向量化信息
  chunks?: number;
  embeddings?: number;
}

// 搜索结果接口
interface SearchResult {
  id: string;
  sourceId: string;
  sourceName: string;
  content: string;
  score: number;
  metadata?: Record<string, any>;
}

const STORAGE_KEY = 'launchbox_knowledge_sources_v2';

export default function KnowledgeBasePage(): JSX.Element {
  const [activeCategory, setActiveCategory] = useState<KnowledgeCategory>('personal');
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RAGSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState<'unloaded' | 'loading' | 'ready' | 'error'>('unloaded');
  
  // 向量化数据缓存
  const [embeddedChunks, setEmbeddedChunks] = useState<EmbeddedChunk[]>([]);
  
  // 搜索参数
  const [searchParams, setSearchParams] = useState({
    similarityThreshold: 0.3,
    maxResults: 5
  });

  
  // 弹窗状态
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [editContentDialogOpen, setEditContentDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<KnowledgeSource | null>(null);
  const [editingContent, setEditingContent] = useState('');
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    type: 'file' as KnowledgeSourceType,
    category: 'personal' as KnowledgeCategory,
    file: null as File | null,
    sheetUrl: '',
    range: 'A:Z'
  });
  
  // 菜单状态
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSourceId, setMenuSourceId] = useState<string>('');

  // 初始化embedding模型
  useEffect(() => {
    const initializeModel = async () => {
      if (embeddingService.isReady()) {
        setModelStatus('ready');
        return;
      }

      setModelStatus('loading');
      try {
        await embeddingService.initialize();
        setModelStatus('ready');
        console.log('RAG模型初始化完成');
      } catch (error) {
        console.error('RAG模型初始化失败:', error);
        setModelStatus('error');
      }
    };

    initializeModel();
  }, []);

  // 向量化知识库内容
  const vectorizeKnowledgeBase = async (sources: KnowledgeSource[]) => {
    if (modelStatus !== 'ready') return;

    const allChunks: EmbeddedChunk[] = [];
    
    for (const source of sources) {
      if (source.content && source.enabled && source.status === 'active') {
        try {
          const chunks = await vectorizeContent(source.id, source.name, source.content);
          allChunks.push(...chunks);
        } catch (error) {
          console.error(`向量化源 ${source.name} 失败:`, error);
        }
      }
    }
    
    setEmbeddedChunks(allChunks);
    console.log(`已向量化 ${allChunks.length} 个内容块`);
  };

  // 加载数据
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSources(JSON.parse(stored));
    } else {
      // 初始化模拟数据
      const mockSources: KnowledgeSource[] = [
        // 我的知识
        {
          id: '1',
          name: '手机游戏类型大全',
          type: 'file',
          category: 'personal',
          enabled: true,
          status: 'active',
          createdAt: '2024-01-15',
          updatedAt: '2024-01-15',
          fileName: '手机游戏类型大全.md',
          fileSize: 2048,
          fileType: 'text/markdown',
          chunks: 12,
          embeddings: 12,
          content: `# 手机游戏类型大全

## 动作游戏 (Action Games)
- **简写**: ACT
- **特点**: 需要玩家快速反应和精确操作
- **代表游戏**: 王者荣耀、绝地求生手游
- **核心玩法**: 实时战斗、技能操作

## 角色扮演游戏 (Role-Playing Games)
- **简写**: RPG
- **特点**: 角色成长、剧情体验
- **代表游戏**: 原神、明日方舟
- **核心玩法**: 角色培养、装备收集

## 策略游戏 (Strategy Games)
- **简写**: SLG
- **特点**: 需要策略思考和规划
- **代表游戏**: 部落冲突、率土之滨
- **核心玩法**: 资源管理、战略布局

## 休闲游戏 (Casual Games)
- **简写**: CAS
- **特点**: 简单易上手、碎片化时间
- **代表游戏**: 开心消消乐、汤姆猫跑酷
- **核心玩法**: 简单操作、轻松娱乐

## 模拟游戏 (Simulation Games)
- **简写**: SIM
- **特点**: 模拟现实场景或系统
- **代表游戏**: 模拟人生手游、梦想城镇
- **核心玩法**: 建造管理、经营策略

## 益智游戏 (Puzzle Games)
- **简写**: PUZ
- **特点**: 锻炼逻辑思维
- **代表游戏**: 纪念碑谷、俄罗斯方块
- **核心玩法**: 解谜、逻辑推理

## 体育游戏 (Sports Games)
- **简写**: SPG
- **特点**: 体育运动模拟
- **代表游戏**: FIFA手游、NBA 2K手游
- **核心玩法**: 运动竞技、团队管理

## 音乐游戏 (Music Games)
- **简写**: MUG
- **特点**: 音乐节拍配合
- **代表游戏**: 节奏大师、QQ炫舞手游
- **核心玩法**: 节拍配合、音乐体验`
        },
        {
          id: '2',
          name: '巴西用户和市场分析',
          type: 'file',
          category: 'personal',
          enabled: true,
          status: 'active',
          createdAt: '2024-01-10',
          updatedAt: '2024-01-20',
          fileName: '巴西用户和市场分析.md',
          fileSize: 3072,
          fileType: 'text/markdown',
          chunks: 18,
          embeddings: 18,
          content: `# 巴西用户和市场分析

## 市场概况
- **人口**: 2.15亿，拉美最大市场
- **智能手机普及率**: 78%
- **游戏玩家数量**: 8400万
- **年收入增长率**: 12.8%

## 用户特征

### 年龄分布
- **18-34岁**: 45% (主力用户群)
- **35-44岁**: 28% (消费能力强)
- **45岁以上**: 27% (增长最快)

### 性别分布
- **男性**: 52%
- **女性**: 48%

### 设备偏好
- **Android**: 85% (主导地位)
- **iOS**: 15% (高端用户)

## 游戏偏好

### 热门游戏类型
1. **足球游戏**: FIFA Mobile, eFootball
2. **大逃杀**: Free Fire, PUBG Mobile
3. **MOBA**: Mobile Legends
4. **休闲游戏**: Candy Crush系列

### 付费特点
- **ARPPU**: $12.5/月
- **付费率**: 3.2%
- **主要付费原因**: 角色皮肤、武器装备
- **付费方式**: 信用卡(45%), 预付卡(35%), 数字钱包(20%)

## 文化特点
- **社交性强**: 喜欢多人对战游戏
- **足球文化**: 足球游戏接受度极高
- **音乐节拍**: 对音乐游戏有独特偏好
- **家庭观念**: 家庭聚会时常一起玩游戏

## 营销建议

### 本地化策略
- **语言**: 葡萄牙语必须精准
- **文化元素**: 融入足球、桑巴等元素
- **节日营销**: 嘉年华、圣诞节重点推广

### 渠道策略
- **Google Play**: 主要下载渠道
- **社交媒体**: WhatsApp、Instagram营销
- **网红合作**: 与本地游戏主播合作

### 定价策略
- **价格敏感**: 需要考虑汇率波动
- **促销活动**: 频繁的折扣活动效果好
- **分期付款**: 支持分期购买增加转化`
        },
        // 项目知识
        {
          id: '3',
          name: '项目运营手册',
          type: 'file',
          category: 'project',
          enabled: true,
          status: 'active',
          createdAt: '2024-01-05',
          updatedAt: '2024-01-25',
          fileName: '项目运营手册.pdf',
          fileSize: 3048576,
          fileType: 'application/pdf',
          chunks: 156,
          embeddings: 156
        },
        {
          id: '4',
          name: '团队协作规范',
          type: 'file',
          category: 'project',
          enabled: false,
          status: 'active',
          createdAt: '2024-01-08',
          updatedAt: '2024-01-22',
          fileName: '团队协作规范.docx',
          fileSize: 524288,
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          chunks: 32,
          embeddings: 32
        },
        // 公开知识
        {
          id: '5',
          name: '游戏行业白皮书',
          type: 'file',
          category: 'public',
          enabled: true,
          status: 'active',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-30',
          fileName: '游戏行业白皮书.pdf',
          fileSize: 5048576,
          fileType: 'application/pdf',
          chunks: 234,
          embeddings: 234
        },
        {
          id: '6',
          name: '最佳实践案例库',
          type: 'google_sheet',
          category: 'public',
          enabled: false,
          status: 'active',
          createdAt: '2023-12-15',
          updatedAt: '2024-01-28',
          sheetUrl: 'https://docs.google.com/spreadsheets/d/1public123/edit',
          sheetId: '1public123',
          range: 'A:G',
          chunks: 167,
          embeddings: 167
        },
        
        // 技能知识
        {
          id: '7',
          name: 'React开发最佳实践',
          type: 'file',
          category: 'skills',
          enabled: true,
          status: 'active',
          createdAt: '2024-01-20',
          updatedAt: '2024-01-25',
          fileName: 'React开发最佳实践.md',
          fileSize: 3072,
          fileType: 'text/markdown',
          chunks: 15,
          embeddings: 15,
          content: `# React开发最佳实践指南

## 组件设计原则

### 1. 单一职责原则
每个组件应该只负责一个功能或UI区域。避免创建过于复杂的组件，这样可以提高代码的可读性和可维护性。

### 2. Props接口设计
- 使用TypeScript定义清晰的Props接口
- 为可选属性提供默认值
- 使用描述性的属性名称

## 状态管理

### 3. 状态提升
当多个组件需要共享状态时，将状态提升到它们的最近公共父组件中。

### 4. useReducer vs useState
- 对于简单状态使用useState
- 对于复杂状态逻辑使用useReducer
- 考虑使用Context API进行跨组件状态共享

## 性能优化

### 5. memo和回调优化
- 使用React.memo包装纯组件
- 使用useCallback缓存回调函数
- 使用useMemo缓存计算结果

### 6. 懒加载
- 使用React.lazy进行代码分割
- 配合Suspense实现优雅的加载状态

## 错误处理

### 7. 错误边界
实现错误边界组件来捕获子组件树中的JavaScript错误，记录错误并显示备用UI。`
        },
        {
          id: '8',
          name: 'JavaScript进阶技巧',
          type: 'file',
          category: 'skills',
          enabled: true,
          status: 'active',
          createdAt: '2024-01-18',
          updatedAt: '2024-01-22',
          fileName: 'JavaScript进阶技巧.md',
          fileSize: 2560,
          fileType: 'text/markdown',
          chunks: 12,
          embeddings: 12,
          content: `# JavaScript进阶技巧

## 异步编程

### 1. Promise链式调用
使用Promise处理异步操作，避免回调地狱。合理使用.then()、.catch()和.finally()方法。

### 2. async/await最佳实践
- 总是在async函数中使用try-catch处理错误
- 并行执行独立的异步操作使用Promise.all()
- 顺序执行依赖的异步操作使用await

## 函数式编程

### 3. 高阶函数
掌握map、filter、reduce等数组方法的使用，它们是函数式编程的核心。

### 4. 闭包应用
理解闭包的概念和应用场景，如模块模式、函数工厂等。

## ES6+特性

### 5. 解构赋值
充分利用对象和数组的解构赋值来编写更简洁的代码。

### 6. 模板字符串
使用模板字符串进行字符串拼接和多行字符串处理。

## 错误处理和调试

### 7. 错误类型和处理
- 理解不同类型的错误：语法错误、运行时错误、逻辑错误
- 使用适当的错误处理机制
- 编写有意义的错误信息`
        }
      ];
      setSources(mockSources);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSources));
    }
  }, []);

  // 当数据加载或模型就绪时，进行向量化
  useEffect(() => {
    if (modelStatus === 'ready' && sources.length > 0) {
      vectorizeKnowledgeBase(sources);
    }
  }, [modelStatus, sources]);

  // 保存数据
  const saveSources = (newSources: KnowledgeSource[]) => {
    setSources(newSources);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSources));
  };

  // 生成ID
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取分类标签
  const getCategoryLabel = (category: KnowledgeCategory) => {
    switch (category) {
      case 'personal': return '我的知识';
      case 'project': return '项目知识';
      case 'public': return '公开知识';
      case 'skills': return '技能知识';
      default: return '未知';
    }
  };

  // 检查是否可编辑
  const canEdit = (category: KnowledgeCategory) => {
    return category === 'personal';
  };

  // 切换开关状态
  const handleToggleEnabled = (id: string) => {
    const newSources = sources.map(source => 
      source.id === id ? { ...source, enabled: !source.enabled } : source
    );
    saveSources(newSources);
  };

  // 获取状态颜色
  const getStatusColor = (status: KnowledgeSource['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'processing': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (status: KnowledgeSource['status']) => {
    switch (status) {
      case 'active': return '已激活';
      case 'processing': return '处理中';
      case 'error': return '错误';
      default: return '未知';
    }
  };

  // 处理文件上传
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file, name: file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  // 添加知识源
  const handleAddSource = () => {
    if (!formData.name.trim()) return;
    
    const newSource: KnowledgeSource = {
      id: generateId(),
      name: formData.name,
      type: formData.type,
      category: formData.category,
      enabled: true,
      status: 'processing',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      chunks: 0,
      embeddings: 0
    };

    if (formData.type === 'file' && formData.file) {
      newSource.fileName = formData.file.name;
      newSource.fileSize = formData.file.size;
      newSource.fileType = formData.file.type;
    } else if (formData.type === 'google_sheet') {
      newSource.sheetUrl = formData.sheetUrl;
      newSource.sheetId = extractSheetId(formData.sheetUrl);
      newSource.range = formData.range;
    }

    const newSources = [...sources, newSource];
    saveSources(newSources);
    
    // 模拟处理过程
    setTimeout(() => {
      const updatedSources = newSources.map(source => 
        source.id === newSource.id 
          ? { ...source, status: 'active' as const, chunks: Math.floor(Math.random() * 100) + 50, embeddings: Math.floor(Math.random() * 100) + 50 }
          : source
      );
      saveSources(updatedSources);
    }, 3000);

    setAddDialogOpen(false);
    resetForm();
  };

  // 提取Google Sheet ID
  const extractSheetId = (url: string): string => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'file',
      category: activeCategory, // 使用当前活跃的category
      file: null,
      sheetUrl: '',
      range: 'A:Z'
    });
  };

  // 删除知识源
  const handleDeleteSource = (id: string) => {
    const newSources = sources.filter(source => source.id !== id);
    saveSources(newSources);
    setMenuAnchor(null);
  };

  // 处理在线预览
  const handlePreviewContent = (source: KnowledgeSource) => {
    setSelectedSource(source);
    setPreviewDialogOpen(true);
  };

  // 处理在线编辑
  const handleEditContent = (source: KnowledgeSource) => {
    setSelectedSource(source);
    setEditingContent(source.content || '');
    setEditContentDialogOpen(true);
  };

  // 保存编辑内容
  const handleSaveContent = () => {
    if (!selectedSource) return;
    
    const newSources = sources.map(source => 
      source.id === selectedSource.id 
        ? { ...source, content: editingContent, updatedAt: new Date().toISOString().split('T')[0] }
        : source
    );
    saveSources(newSources);
    setEditContentDialogOpen(false);
    setEditingContent('');
  };

  // RAG语义搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    if (modelStatus !== 'ready') {
      alert('RAG模型还未就绪，请稍后重试');
      return;
    }
    
    setSearchLoading(true);
    
    try {
      // 过滤当前分类下的向量化内容
      const categoryChunks = embeddedChunks.filter(chunk => {
        const source = sources.find(s => s.id === chunk.sourceId);
        return source && source.category === activeCategory && source.enabled;
      });
      
      if (categoryChunks.length === 0) {
        setSearchResults([]);
        return;
      }
      
      // 执行RAG搜索
      const results = await ragSearch(
        searchQuery,
        categoryChunks,
        searchParams.similarityThreshold,
        searchParams.maxResults
      );
      
      setSearchResults(results);
      
      console.log(`RAG搜索完成: 查询"${searchQuery}", 找到${results.length}个结果`);
    } catch (error) {
      console.error('RAG搜索失败:', error);
      alert('搜索失败: ' + (error as Error).message);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      {/* 页面标题 */}
      <Stack>
        <Typography variant="h5">知识</Typography>
        <Typography variant="body2" color="text.secondary">
          管理文档和数据源，支持语义检索和RAG问答
        </Typography>
      </Stack>

      {/* 标签页 */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeCategory} 
          onChange={(_, newValue) => {
            setActiveCategory(newValue);
            setSearchQuery('');
            setSearchResults([]);
          }}
        >
          <Tab value="personal" label="我的知识" />
          <Tab value="project" label="项目知识" />
          <Tab value="skills" label="技能知识" />
          <Tab value="public" label="公开知识" />
        </Tabs>
      </Box>

      {/* 知识源管理 */}
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{getCategoryLabel(activeCategory)}</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={modelStatus === 'loading' ? <CircularProgress size={16} /> : <SearchIcon />}
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setSearchDialogOpen(true);
              }}
              disabled={modelStatus !== 'ready'}
              sx={{ minWidth: 140 }}
            >
              {modelStatus === 'loading' ? 'RAG加载中' : 
               modelStatus === 'error' ? 'RAG错误' : 
               modelStatus === 'ready' ? 'RAG搜索' : '准备中'}
            </Button>
            {canEdit(activeCategory) && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setFormData(prev => ({ ...prev, category: activeCategory }));
                  setAddDialogOpen(true);
                }}
              >
                添加知识源
              </Button>
            )}
          </Box>
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: 2, elevation: 0, border: 1, borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>名称</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>类型</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>内容块数</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>启用状态</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sources.filter(source => source.category === activeCategory).map((source) => (
                <TableRow key={source.id} sx={{ '&:hover': { backgroundColor: 'grey.25' } }}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {source.type === 'file' ? <InsertDriveFileIcon fontSize="small" /> : <TableChartIcon fontSize="small" />}
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {source.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {source.type === 'file' ? '文件' : 'Google Sheet'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{source.chunks || 0}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Switch
                        checked={source.enabled}
                        onChange={() => handleToggleEnabled(source.id)}
                        size="small"
                      />
                      <Typography variant="body2" sx={{ ml: 1, color: source.enabled ? 'success.main' : 'text.secondary' }}>
                        {source.enabled ? '已启用' : '已关闭'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setMenuAnchor(e.currentTarget);
                        setMenuSourceId(source.id);
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      {/* 操作菜单 */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            const source = sources.find(s => s.id === menuSourceId);
            if (source) {
              setSelectedSource(source);
              setViewDialogOpen(true);
            }
            setMenuAnchor(null);
          }}
        >
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          查看详情
        </MenuItem>
        {(() => {
          const source = sources.find(s => s.id === menuSourceId);
          return source && (
            <>
              {source.content && (
                <>
                  <MenuItem
                    onClick={() => {
                      handlePreviewContent(source);
                      setMenuAnchor(null);
                    }}
                  >
                    <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
                    在线预览
                  </MenuItem>
                  {canEdit(source.category) && (
                    <MenuItem
                      onClick={() => {
                        handleEditContent(source);
                        setMenuAnchor(null);
                      }}
                    >
                      <EditIcon fontSize="small" sx={{ mr: 1 }} />
                      在线编辑
                    </MenuItem>
                  )}
                  <Divider />
                </>
              )}
              {canEdit(source.category) && (
                <>
                  <MenuItem
                    onClick={() => {
                      setSelectedSource(source);
                      setFormData({
                        name: source.name,
                        type: source.type,
                        category: source.category,
                        file: null,
                        sheetUrl: source.sheetUrl || '',
                        range: source.range || 'A:Z'
                      });
                      setEditDialogOpen(true);
                      setMenuAnchor(null);
                    }}
                  >
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    编辑配置
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleDeleteSource(menuSourceId)}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    删除
                  </MenuItem>
                </>
              )}
            </>
          );
        })()}
      </Menu>

      {/* 添加知识源对话框 */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加知识源</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="名称"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>类型</InputLabel>
              <Select
                value={formData.type}
                label="类型"
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as KnowledgeSourceType }))}
              >
                <MenuItem value="file">文件上传</MenuItem>
                <MenuItem value="google_sheet">Google Sheet</MenuItem>
              </Select>
            </FormControl>

            {formData.type === 'file' && (
              <Box>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{ height: 56 }}
                >
                  {formData.file ? formData.file.name : '选择文件'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
                    onChange={handleFileChange}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  支持 PDF, Word, TXT, CSV, Excel 文件
                </Typography>
              </Box>
            )}

            {formData.type === 'google_sheet' && (
              <>
                <TextField
                  label="Google Sheet URL"
                  value={formData.sheetUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, sheetUrl: e.target.value }))}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  fullWidth
                />
                <TextField
                  label="数据范围"
                  value={formData.range}
                  onChange={(e) => setFormData(prev => ({ ...prev, range: e.target.value }))}
                  placeholder="A:Z"
                  fullWidth
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>取消</Button>
          <Button 
            variant="contained" 
            onClick={handleAddSource}
            disabled={!formData.name.trim() || (formData.type === 'file' && !formData.file) || (formData.type === 'google_sheet' && !formData.sheetUrl.trim())}
          >
            添加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 查看详情对话框 */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>知识源详情</DialogTitle>
        <DialogContent>
          {selectedSource && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">名称</Typography>
                <Typography variant="body1">{selectedSource.name}</Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">类型</Typography>
                <Chip
                  label={selectedSource.type === 'file' ? '文件' : 'Google Sheet'}
                  variant="outlined"
                  size="small"
                  color={selectedSource.type === 'file' ? 'primary' : 'secondary'}
                />
              </Box>

              {selectedSource.type === 'file' && (
                <>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">文件信息</Typography>
                    <Typography variant="body2">
                      文件名: {selectedSource.fileName}<br/>
                      大小: {selectedSource.fileSize ? formatFileSize(selectedSource.fileSize) : 'N/A'}<br/>
                      类型: {selectedSource.fileType}
                    </Typography>
                  </Box>
                </>
              )}

              {selectedSource.type === 'google_sheet' && (
                <>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Sheet信息</Typography>
                    <Typography variant="body2">
                      URL: {selectedSource.sheetUrl}<br/>
                      Sheet ID: {selectedSource.sheetId}<br/>
                      数据范围: {selectedSource.range}
                    </Typography>
                  </Box>
                </>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary">向量化信息</Typography>
                <Typography variant="body2">
                  内容块数: {selectedSource.chunks || 0}<br/>
                  向量数: {selectedSource.embeddings || 0}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">时间信息</Typography>
                <Typography variant="body2">
                  创建时间: {selectedSource.createdAt}<br/>
                  更新时间: {selectedSource.updatedAt}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* RAG语义搜索对话框 */}
      <Dialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{getCategoryLabel(activeCategory)} - RAG语义搜索</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  基于Universal Sentence Encoder的RAG语义检索，支持自然语言查询当前分类下的知识源
                  {embeddedChunks.length > 0 && (
                    <span style={{ color: '#1976d2', marginLeft: 8 }}>
                      (已向量化 {embeddedChunks.filter(chunk => {
                        const source = sources.find(s => s.id === chunk.sourceId);
                        return source && source.category === activeCategory && source.enabled;
                      }).length} 个内容块)
                    </span>
                  )}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="输入查询内容，例如：如何提升用户留存率？"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleSearch}
                    disabled={searchLoading || !searchQuery.trim()}
                    sx={{ minWidth: 120, whiteSpace: 'nowrap' }}
                  >
                    搜索
                  </Button>
                </Box>

                {/* 搜索参数调整 */}
                <Stack direction="row" spacing={3} sx={{ mt: 3, mb: 2 }}>
                  <TextField
                    label="相似度阈值"
                    type="number"
                    size="small"
                    value={searchParams.similarityThreshold}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 1) {
                        setSearchParams(prev => ({ ...prev, similarityThreshold: value }));
                      }
                    }}
                    inputProps={{ min: 0, max: 1, step: 0.01 }}
                    helperText="范围: 0.00 - 1.00"
                    sx={{ width: 160 }}
                  />
                  
                  <TextField
                    label="最大结果数"
                    type="number"
                    size="small"
                    value={searchParams.maxResults}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 1 && value <= 50) {
                        setSearchParams(prev => ({ ...prev, maxResults: value }));
                      }
                    }}
                    inputProps={{ min: 1, max: 50, step: 1 }}
                    helperText="范围: 1 - 50"
                    sx={{ width: 140 }}
                  />
                </Stack>
                
                {searchLoading && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      正在检索 {getCategoryLabel(activeCategory)} 中的相关信息...
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* 搜索结果 */}
            {searchResults.length > 0 && (
              <Stack spacing={2}>
                <Typography variant="h6">
                  搜索结果 ({searchResults.length})
                </Typography>
                
                {searchResults.map((result, index) => {
                  // 提取块编号
                  const chunkNumber = result.metadata?.chunkIndex !== undefined 
                    ? result.metadata.chunkIndex + 1 
                    : index + 1;
                  
                  // 清理源名称，移除块编号后缀
                  const cleanSourceName = result.sourceName.replace(/\s*\(第\d+块\)/, '');
                  
                  return (
                    <Card key={result.id} variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {/* 左侧编号标识 */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'flex-start',
                            pt: 0.5
                          }}>
                            <Box sx={{
                              backgroundColor: 'primary.main',
                              color: 'white',
                              borderRadius: '6px',
                              px: 1,
                              py: 0.5,
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              minWidth: '32px',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              #{chunkNumber}
                            </Box>
                          </Box>
                          
                          {/* 右侧内容区域 */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack spacing={1}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                                <Typography variant="subtitle2" color="primary" sx={{ 
                                  wordBreak: 'break-word',
                                  flex: 1
                                }}>
                                  {cleanSourceName}
                                </Typography>
                                <Chip
                                  label={`${(result.similarity * 100).toFixed(0)}%`}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ flexShrink: 0 }}
                                />
                              </Box>
                              
                              <Typography variant="body2" sx={{ 
                                wordBreak: 'break-word',
                                lineHeight: 1.5
                              }}>
                                {result.content}
                              </Typography>
                              
                              {result.metadata && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    类型: {result.metadata.type}
                                    {result.metadata.totalChunks && 
                                      ` | 共${result.metadata.totalChunks}块内容`
                                    }
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}

            {searchQuery && searchResults.length === 0 && !searchLoading && (
              <Alert severity="info">
                在 {getCategoryLabel(activeCategory)} 中未找到相关内容，请尝试其他关键词。
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 在线预览对话框 */}
      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DescriptionIcon />
            {selectedSource?.name} - 在线预览
          </Box>
        </DialogTitle>
        <DialogContent>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 3, 
              mt: 1, 
              bgcolor: 'grey.50', 
              minHeight: 400,
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto'
            }}
          >
            {selectedSource?.content || '暂无内容'}
          </Paper>
        </DialogContent>
        <DialogActions>
          {selectedSource && canEdit(selectedSource.category) && (
            <Button 
              variant="contained" 
              startIcon={<EditIcon />}
              onClick={() => {
                setPreviewDialogOpen(false);
                handleEditContent(selectedSource);
              }}
            >
              编辑内容
            </Button>
          )}
          <Button onClick={() => setPreviewDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 在线编辑对话框 */}
      <Dialog open={editContentDialogOpen} onClose={() => setEditContentDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon />
            {selectedSource?.name} - 在线编辑
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={20}
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            placeholder="请输入文档内容..."
            sx={{ 
              mt: 1,
              '& .MuiInputBase-input': {
                fontFamily: 'monospace',
                fontSize: '14px'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            支持 Markdown 格式。编辑完成后点击"保存"按钮。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditContentDialogOpen(false)}>取消</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveContent}
            disabled={!editingContent.trim()}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
