import React, { useState, useCallback, useRef } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  LinearProgress, 
  Stack,
  IconButton,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Container,
  Menu,
  MenuItem,
  Tooltip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { 
  Assignment as TaskIcon,
  Image as ImageIcon,
  Analytics as DataIcon,
  Notifications as NotificationIcon,
  Today as ReportIcon,
  CheckCircle as CheckIcon,
  Schedule as PendingIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  TrendingUp as TrendIcon,
  WorkOutline as WorkIcon,
  DragIndicator as DragIcon,
  AspectRatio as ResizeIcon,
  Palette as PaletteIcon,
  CameraAlt as CameraIcon,
  Brush as BrushIcon,
  Wallpaper as WallpaperIcon,
  Psychology as AIIcon
} from '@mui/icons-material';

// 模拟数据
const mockTasks = [
  // 工作文档
  { id: 1, title: '9月网页活动推广方案', status: 'completed', type: 'work', progress: 100, time: '2小时前' },
  { id: 2, title: 'TikTok短视频营销策略', status: 'completed', type: 'work', progress: 100, time: '4小时前' },
  { id: 3, title: 'Instagram游戏广告创意文案', status: 'completed', type: 'work', progress: 100, time: '6小时前' },
  { id: 4, title: 'Google Play商店优化方案', status: 'pending', type: 'work', progress: 75, time: '进行中' },
  { id: 5, title: 'Facebook游戏社群运营计划', status: 'pending', type: 'work', progress: 45, time: '进行中' },
  // 市场趋势
  { id: 6, title: '巴西手游市场分析报告', status: 'completed', type: 'market', progress: 100, time: '1天前' },
  { id: 7, title: '墨西哥移动游戏用户研究', status: 'completed', type: 'market', progress: 100, time: '8小时前' },
  { id: 8, title: '东南亚三国游戏市场对比', status: 'completed', type: 'market', progress: 100, time: '1天前' },
  { id: 9, title: '越南手游付费习惯调研', status: 'completed', type: 'market', progress: 100, time: '2天前' },
  { id: 10, title: '泰国游戏本地化策略分析', status: 'pending', type: 'market', progress: 60, time: '进行中' },
  { id: 11, title: '印尼移动游戏竞品研究', status: 'pending', type: 'market', progress: 30, time: '进行中' },
  // 待完成
  { id: 12, title: 'YouTube游戏频道内容规划', status: 'pending', type: 'work', progress: 0, time: '待开始' },
  { id: 13, title: '拉美地区游戏推广预算分配', status: 'pending', type: 'work', progress: 0, time: '待开始' },
  { id: 14, title: '东南亚游戏市场准入研究', status: 'pending', type: 'market', progress: 0, time: '待开始' }
];

const mockImages = [
  { id: 1, title: '产品Logo设计', type: 'Logo', status: 'completed', time: '2小时前' },
  { id: 2, title: '营销海报制作', type: '海报', status: 'completed', time: '4小时前' },
  { id: 3, title: '用户头像生成', type: '头像', status: 'pending', time: '进行中' },
  { id: 4, title: '品牌横幅设计', type: '横幅', status: 'completed', time: '3小时前' },
  { id: 5, title: '社交媒体封面', type: '封面', status: 'completed', time: '5小时前' },
  { id: 6, title: '产品展示图', type: '展示图', status: 'completed', time: '6小时前' },
  { id: 7, title: '图标设计集合', type: '图标', status: 'pending', time: '30分钟前' },
  { id: 8, title: '背景纹理生成', type: '纹理', status: 'completed', time: '7小时前' },
  { id: 9, title: '插画风格图片', type: '插画', status: 'completed', time: '8小时前' }
];

const mockData = [
  { 
    id: 1, 
    title: '游戏内IP联名活动', 
    description: '本次联名活动表现优异，用户参与度和付费转化都超出预期目标。', 
    status: 'excellent',
    metrics: {
      participationRate: { label: '活动参与率', value: '78.5%', trend: '+15.2%', target: '65%' },
      conversionRate: { label: '付费转化率', value: '12.8%', trend: '+3.4%', target: '10%' },
      revenueGrowth: { label: '收入增长', value: '156%', trend: '+42%', target: '120%' },
      userEngagement: { label: '用户互动', value: '2.3M', trend: '+28%', target: '2M' }
    }
  },
  { 
    id: 2, 
    title: '社交媒体皮肤设计大赛', 
    description: '大赛热度持续上升，社区活跃度良好，但需要加强优质作品的曝光推广。', 
    status: 'good',
    metrics: {
      submissions: { label: '作品投稿数', value: '1,247', trend: '+8.3%', target: '1,200' },
      socialEngagement: { label: '社交互动量', value: '456K', trend: '+12.1%', target: '400K' },
      qualityScore: { label: '作品质量评分', value: '4.2/5', trend: '+0.2', target: '4.0' },
      mediaCoverage: { label: '媒体曝光', value: '125', trend: '-5.2%', target: '150' }
    }
  },
  { 
    id: 3, 
    title: '新手引导优化实验', 
    description: '数据显示新手引导还需要进一步优化，用户在第三步的流失率偏高。', 
    status: 'warning',
    metrics: {
      completionRate: { label: '引导完成率', value: '67.3%', trend: '-2.8%', target: '75%' },
      stepThreeDropoff: { label: '第三步流失率', value: '24.1%', trend: '+3.2%', target: '<20%' },
      timeToComplete: { label: '平均完成时间', value: '8.5分钟', trend: '+1.2分钟', target: '7分钟' },
      feedbackScore: { label: '用户反馈评分', value: '3.6/5', trend: '-0.3', target: '4.0' }
    }
  },
  { 
    id: 4, 
    title: '周末双倍经验活动', 
    description: '活动效果符合预期，用户在线时长和游戏频次都有显著提升。', 
    status: 'good',
    metrics: {
      onlineTime: { label: '平均在线时长', value: '3.2小时', trend: '+45%', target: '2.8小时' },
      gameFrequency: { label: '游戏频次', value: '4.8次/日', trend: '+22%', target: '4次/日' },
      expGained: { label: '经验获取量', value: '2.1M', trend: '+89%', target: '1.8M' },
      retentionBoost: { label: '活动期间留存', value: '85.2%', trend: '+8.7%', target: '80%' }
    }
  }
];

const mockNotifications = [
  { id: 1, title: '新用户注册激增', message: '今日新用户注册量比昨日增长45%', time: '10分钟前', type: 'info' },
  { id: 2, title: '系统性能异常', message: '检测到API响应时间超过阈值', time: '1小时前', type: 'warning' },
  { id: 3, title: '任务完成提醒', message: '竞品分析报告已生成完毕', time: '2小时前', type: 'success' }
];

// 社媒热点数据
const mockSocialHotspots = {
  tiktok: [
    { id: 1, topic: '#GameOn挑战赛', heat: 2840000, trend: '+15%' },
    { id: 2, topic: '#手游攻略分享', heat: 1950000, trend: '+8%' },
    { id: 3, topic: '#游戏高光时刻', heat: 1720000, trend: '+22%' },
    { id: 4, topic: '#新手玩家日常', heat: 1580000, trend: '+12%' },
    { id: 5, topic: '#游戏音效神还原', heat: 1340000, trend: '+6%' },
    { id: 6, topic: '#游戏角色COS', heat: 1220000, trend: '+18%' },
    { id: 7, topic: '#手游PK大赛', heat: 1100000, trend: '+9%' },
    { id: 8, topic: '#游戏彩蛋发现', heat: 980000, trend: '+14%' },
    { id: 9, topic: '#移动游戏测评', heat: 870000, trend: '+7%' },
    { id: 10, topic: '#游戏社区互动', heat: 760000, trend: '+11%' },
    { id: 11, topic: '#游戏直播精选', heat: 650000, trend: '+5%' },
    { id: 12, topic: '#手游充值攻略', heat: 580000, trend: '+3%' },
    { id: 13, topic: '#游戏Bug趣闻', heat: 520000, trend: '+16%' },
    { id: 14, topic: '#新游戏预告', heat: 480000, trend: '+25%' },
    { id: 15, topic: '#游戏装备展示', heat: 420000, trend: '+8%' },
    { id: 16, topic: '#手游联盟战', heat: 380000, trend: '+12%' },
    { id: 17, topic: '#游戏配音模仿', heat: 340000, trend: '+19%' },
    { id: 18, topic: '#移动端操作技巧', heat: 310000, trend: '+6%' },
    { id: 19, topic: '#游戏剧情解析', heat: 280000, trend: '+10%' },
    { id: 20, topic: '#手游充值优惠', heat: 250000, trend: '+4%' }
  ],
  instagram: [
    { id: 1, topic: '#GameAesthetics', heat: 1850000, trend: '+20%' },
    { id: 2, topic: '#MobileGaming', heat: 1620000, trend: '+13%' },
    { id: 3, topic: '#GameScreenshot', heat: 1490000, trend: '+17%' },
    { id: 4, topic: '#GamingSetup', heat: 1320000, trend: '+9%' },
    { id: 5, topic: '#GameCharacter', heat: 1180000, trend: '+24%' },
    { id: 6, topic: '#InGamePhotography', heat: 1050000, trend: '+11%' },
    { id: 7, topic: '#GameUI设计', heat: 920000, trend: '+15%' },
    { id: 8, topic: '#手游皮肤展示', heat: 840000, trend: '+7%' },
    { id: 9, topic: '#GameArt', heat: 780000, trend: '+18%' },
    { id: 10, topic: '#MobileGamer', heat: 720000, trend: '+6%' },
    { id: 11, topic: '#GameCommunity', heat: 660000, trend: '+12%' },
    { id: 12, topic: '#Gaming生活方式', heat: 590000, trend: '+8%' },
    { id: 13, topic: '#手游收藏', heat: 540000, trend: '+14%' },
    { id: 14, topic: '#GameInfluencer', heat: 480000, trend: '+21%' },
    { id: 15, topic: '#移动游戏评测', heat: 430000, trend: '+9%' },
    { id: 16, topic: '#GameMerchandise', heat: 390000, trend: '+16%' },
    { id: 17, topic: '#手游竞技', heat: 350000, trend: '+5%' },
    { id: 18, topic: '#GameNostalgia', heat: 320000, trend: '+13%' },
    { id: 19, topic: '#移动端游戏', heat: 290000, trend: '+7%' },
    { id: 20, topic: '#GamingLifestyle', heat: 260000, trend: '+11%' }
  ],
  youtube: [
    { id: 1, topic: '#手游攻略教程', heat: 3200000, trend: '+28%' },
    { id: 2, topic: '#移动游戏评测', heat: 2850000, trend: '+16%' },
    { id: 3, topic: '#新游戏试玩', heat: 2640000, trend: '+22%' },
    { id: 4, topic: '#手游直播回放', heat: 2380000, trend: '+11%' },
    { id: 5, topic: '#游戏解说视频', heat: 2150000, trend: '+19%' },
    { id: 6, topic: '#手游PK精彩集锦', heat: 1920000, trend: '+14%' },
    { id: 7, topic: '#移动游戏新闻', heat: 1780000, trend: '+8%' },
    { id: 8, topic: '#手游充值指南', heat: 1640000, trend: '+25%' },
    { id: 9, topic: '#游戏音乐MV', heat: 1520000, trend: '+12%' },
    { id: 10, topic: '#手游官方预告', heat: 1390000, trend: '+31%' },
    { id: 11, topic: '#移动游戏对比', heat: 1280000, trend: '+7%' },
    { id: 12, topic: '#手游技巧分享', heat: 1170000, trend: '+15%' },
    { id: 13, topic: '#游戏幕后制作', heat: 1080000, trend: '+18%' },
    { id: 14, topic: '#手游社区活动', heat: 990000, trend: '+9%' },
    { id: 15, topic: '#移动端电竞', heat: 910000, trend: '+23%' },
    { id: 16, topic: '#手游更新解析', heat: 830000, trend: '+13%' },
    { id: 17, topic: '#游戏角色介绍', heat: 760000, trend: '+6%' },
    { id: 18, topic: '#手游联动活动', heat: 700000, trend: '+17%' },
    { id: 19, topic: '#移动游戏历史', heat: 640000, trend: '+11%' },
    { id: 20, topic: '#手游开发日志', heat: 590000, trend: '+20%' }
  ],
  twitter: [
    { id: 1, topic: '#MobileGameUpdate', heat: 1650000, trend: '+24%' },
    { id: 2, topic: '#HandheldGaming', heat: 1420000, trend: '+18%' },
    { id: 3, topic: '#GameCommunity', heat: 1280000, trend: '+12%' },
    { id: 4, topic: '#MobileESports', heat: 1150000, trend: '+29%' },
    { id: 5, topic: '#GameDev', heat: 1040000, trend: '+15%' },
    { id: 6, topic: '#IndieGame', heat: 960000, trend: '+21%' },
    { id: 7, topic: '#GameNews', heat: 880000, trend: '+8%' },
    { id: 8, topic: '#MobileGamer', heat: 810000, trend: '+16%' },
    { id: 9, topic: '#GameReview', heat: 750000, trend: '+11%' },
    { id: 10, topic: '#手游热议', heat: 690000, trend: '+19%' },
    { id: 11, topic: '#GameLaunch', heat: 640000, trend: '+33%' },
    { id: 12, topic: '#MobileTech', heat: 590000, trend: '+7%' },
    { id: 13, topic: '#GameIndustry', heat: 540000, trend: '+14%' },
    { id: 14, topic: '#PlayerFeedback', heat: 500000, trend: '+9%' },
    { id: 15, topic: '#GameEvent', heat: 460000, trend: '+22%' },
    { id: 16, topic: '#MobileFirst', heat: 420000, trend: '+13%' },
    { id: 17, topic: '#GameTech', heat: 390000, trend: '+17%' },
    { id: 18, topic: '#手游推荐', heat: 360000, trend: '+6%' },
    { id: 19, topic: '#GameCulture', heat: 330000, trend: '+12%' },
    { id: 20, topic: '#MobileInnovation', heat: 300000, trend: '+25%' }
  ]
};

// 游戏热点数据
const mockGameHotspots = {
  myProject: [
    { id: 1, topic: '#征途手游新版本', heat: 1850000, trend: '+32%' },
    { id: 2, topic: '#夏日活动倒计时', heat: 1640000, trend: '+18%' },
    { id: 3, topic: '#新英雄技能预览', heat: 1520000, trend: '+25%' },
    { id: 4, topic: '#工会战争开启', heat: 1380000, trend: '+14%' },
    { id: 5, topic: '#限时皮肤上线', heat: 1260000, trend: '+22%' },
    { id: 6, topic: '#跨服竞技赛', heat: 1140000, trend: '+16%' },
    { id: 7, topic: '#新地图探索', heat: 1050000, trend: '+11%' },
    { id: 8, topic: '#周年庆典预热', heat: 960000, trend: '+28%' },
    { id: 9, topic: '#玩家创作大赛', heat: 870000, trend: '+9%' },
    { id: 10, topic: '#装备强化活动', heat: 790000, trend: '+19%' },
    { id: 11, topic: '#新手福利升级', heat: 720000, trend: '+13%' },
    { id: 12, topic: '#社区互动挑战', heat: 650000, trend: '+21%' },
    { id: 13, topic: '#游戏音效更新', heat: 590000, trend: '+7%' },
    { id: 14, topic: '#UI界面优化', heat: 540000, trend: '+15%' },
    { id: 15, topic: '#服务器维护通知', heat: 480000, trend: '+5%' },
    { id: 16, topic: '#BUG修复报告', heat: 430000, trend: '+12%' },
    { id: 17, topic: '#开发者访谈', heat: 390000, trend: '+24%' },
    { id: 18, topic: '#玩家反馈收集', heat: 350000, trend: '+8%' },
    { id: 19, topic: '#游戏数据统计', heat: 320000, trend: '+17%' },
    { id: 20, topic: '#未来规划展望', heat: 290000, trend: '+26%' }
  ],
  gameIndustry: [
    { id: 1, topic: '#手游市场增长', heat: 2450000, trend: '+35%' },
    { id: 2, topic: '#AI游戏开发', heat: 2180000, trend: '+42%' },
    { id: 3, topic: '#云游戏技术', heat: 1960000, trend: '+28%' },
    { id: 4, topic: '#元宇宙游戏', heat: 1780000, trend: '+31%' },
    { id: 5, topic: '#区块链游戏', heat: 1620000, trend: '+19%' },
    { id: 6, topic: '#5G移动游戏', heat: 1480000, trend: '+24%' },
    { id: 7, topic: '#跨平台开发', heat: 1350000, trend: '+16%' },
    { id: 8, topic: '#游戏引擎更新', heat: 1240000, trend: '+21%' },
    { id: 9, topic: '#独立游戏崛起', heat: 1130000, trend: '+14%' },
    { id: 10, topic: '#游戏直播经济', heat: 1050000, trend: '+29%' },
    { id: 11, topic: '#电竞产业发展', heat: 970000, trend: '+18%' },
    { id: 12, topic: '#游戏本地化', heat: 890000, trend: '+12%' },
    { id: 13, topic: '#订阅制游戏', heat: 820000, trend: '+26%' },
    { id: 14, topic: '#游戏安全防护', heat: 760000, trend: '+8%' },
    { id: 15, topic: '#用户隐私保护', heat: 700000, trend: '+33%' },
    { id: 16, topic: '#游戏监管政策', heat: 650000, trend: '+15%' },
    { id: 17, topic: '#绿色游戏倡议', heat: 590000, trend: '+22%' },
    { id: 18, topic: '#游戏教育应用', heat: 540000, trend: '+11%' },
    { id: 19, topic: '#游戏心理研究', heat: 490000, trend: '+17%' },
    { id: 20, topic: '#未来游戏趋势', heat: 450000, trend: '+38%' }
  ]
};

// 卡片宽度选项
const CARD_WIDTHS = {
  small: 4,    // 1/3 宽度
  medium: 6,   // 1/2 宽度
  large: 8,    // 2/3 宽度
  full: 12     // 全宽
};

// 卡片配置类型
interface CardConfig {
  id: string;
  type: 'report' | 'tasks' | 'images' | 'data' | 'socialHotspots' | 'gameHotspots';
  title: string;
  width: keyof typeof CARD_WIDTHS;
  row: number;
  col: number;
}

// 初始卡片配置 - 使用行列定位
const initialCards: CardConfig[] = [
  { id: 'report', type: 'report', title: '今日工作日报', width: 'full', row: 0, col: 0 },
  { id: 'tasks', type: 'tasks', title: '任务文档', width: 'medium', row: 1, col: 0 },
  { id: 'images', type: 'images', title: '生成图片', width: 'medium', row: 1, col: 6 },
  { id: 'data', type: 'data', title: '数据监控', width: 'medium', row: 2, col: 0 },
  { id: 'socialHotspots', type: 'socialHotspots', title: '社媒热点', width: 'medium', row: 2, col: 6 },
  { id: 'gameHotspots', type: 'gameHotspots', title: '游戏热点', width: 'medium', row: 3, col: 0 }
];

export default function AcceptancePage(): JSX.Element {
  // 从localStorage加载保存的卡片状态，如果没有则使用默认配置
  const [cards, setCards] = useState<CardConfig[]>(() => {
    try {
      const savedCards = localStorage.getItem('acceptancePageCards');
      return savedCards ? JSON.parse(savedCards) : initialCards;
    } catch (error) {
      console.warn('Failed to load saved cards from localStorage:', error);
      return initialCards;
    }
  });
  const [resizeMenuAnchor, setResizeMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<CardConfig | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [reportTabValue, setReportTabValue] = useState(0);
  const [imageViewTabValue, setImageViewTabValue] = useState(0);
  const [documentTabValue, setDocumentTabValue] = useState(0);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [dataMonitorOpen, setDataMonitorOpen] = useState(false);
  const [selectedDataModule, setSelectedDataModule] = useState<any>(null);
  const [socialHotspotTabValue, setSocialHotspotTabValue] = useState(0);
  const [gameHotspotTabValue, setGameHotspotTabValue] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // 自动保存卡片配置到localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem('acceptancePageCards', JSON.stringify(cards));
      console.log('💾 自动保存卡片配置:', cards.length, '个卡片');
    } catch (error) {
      console.warn('保存卡片配置失败:', error);
    }
  }, [cards]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckIcon sx={{ color: 'success.main' }} />;
      case 'pending': return <PendingIcon sx={{ color: 'warning.main' }} />;
      case 'error': return <ErrorIcon sx={{ color: 'error.main' }} />;
      default: return <PendingIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  // 处理拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent, card: CardConfig) => {
    setDraggedCard(card);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    
    // 创建拖拽预览
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setDraggedCard(null);
    setIsDragging(false);
    // 注意：卡片位置的保存已经在handleDrop中处理了
    // 这里不需要重复保存，避免使用过时的状态
  }, []);

  // 处理放置
  const handleDrop = useCallback((e: React.DragEvent, targetRow: number, targetCol: number) => {
    e.preventDefault();
    if (!draggedCard) return;

    // 检查目标位置是否有足够空间
    const targetWidth = CARD_WIDTHS[draggedCard.width];
    if (targetCol + targetWidth > 12) return; // 超出网格边界

    // 检查是否与其他卡片冲突
    const hasConflict = cards.some(card => {
      if (card.id === draggedCard.id) return false;
      
      const cardWidth = CARD_WIDTHS[card.width];
      const cardEndCol = card.col + cardWidth;
      const targetEndCol = targetCol + targetWidth;
      
      return card.row === targetRow && 
             ((targetCol >= card.col && targetCol < cardEndCol) ||
              (targetEndCol > card.col && targetEndCol <= cardEndCol) ||
              (targetCol <= card.col && targetEndCol >= cardEndCol));
    });

    if (hasConflict) return; // 有冲突，不允许放置

    // 更新卡片位置
    const updatedCards = cards.map(card => 
      card.id === draggedCard.id 
        ? { ...card, row: targetRow, col: targetCol }
        : card
    );
    setCards(updatedCards);
  }, [draggedCard, cards]);

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // 处理卡片宽度调整
  const handleResizeCard = useCallback((cardId: string, newWidth: keyof typeof CARD_WIDTHS) => {
    const updatedCards = cards.map(card => 
      card.id === cardId ? { ...card, width: newWidth } : card
    );
    setCards(updatedCards);
    setResizeMenuAnchor(null);
  }, [cards]);

  // 打开调整大小菜单
  const handleOpenResizeMenu = useCallback((event: React.MouseEvent<HTMLElement>, cardId: string) => {
    event.stopPropagation();
    setResizeMenuAnchor(event.currentTarget);
    setSelectedCardId(cardId);
  }, []);

  // 关闭调整大小菜单
  const handleCloseResizeMenu = useCallback(() => {
    setResizeMenuAnchor(null);
    setSelectedCardId(null);
  }, []);

  // 处理AI总结
  const handleAISummary = useCallback((task: any) => {
    setSelectedDocument(task);
    setAiSummaryOpen(true);
  }, []);

  const handleCloseAISummary = useCallback(() => {
    setAiSummaryOpen(false);
    setSelectedDocument(null);
  }, []);

  // 数据监控弹窗处理函数
  const handleDataModuleClick = useCallback((dataModule: any) => {
    setSelectedDataModule(dataModule);
    setDataMonitorOpen(true);
  }, []);

  const handleCloseDataMonitor = useCallback(() => {
    setDataMonitorOpen(false);
    setSelectedDataModule(null);
  }, []);

  // 生成AI总结内容
  const getAISummary = (task: any) => {
    const summaries: { [key: string]: string } = {
      // 工作文档
      '9月网页活动推广方案': '本方案针对9月新游戏上线制定了全方位的网页推广策略。重点围绕游戏核心玩法和视觉特色，设计了多层次的营销漏斗。首页采用沉浸式视频背景展示游戏画面，配合倒计时和预约注册功能提升转化率。活动页面包含游戏介绍、角色展示、玩法说明和社区互动模块。针对不同用户群体设计了差异化的落地页，休闲玩家强调简单易上手，核心玩家突出策略深度和竞技性。整合了社交媒体分享、邀请好友和预约奖励等病毒式传播机制。预计通过精准的SEO优化和付费广告投放，可实现100万UV访问量和15%的预约转化率，为游戏正式上线积累优质用户基础。',
      'TikTok短视频营销策略': 'TikTok作为Z世代主要娱乐平台，是手游推广的重要阵地。策略核心是打造"游戏+娱乐"的内容矩阵，通过多样化视频形式触达目标用户。内容规划包括游戏高光时刻剪辑、搞笑游戏bug合集、玩家UGC挑战赛和KOL合作推广四大板块。重点打造15-30秒的短视频，突出游戏的爽快感和社交属性。与头部游戏博主合作，制作"新手7天成长记录"系列内容，展示游戏的成长曲线和成就感。发起#我的游戏高光时刻#话题挑战，鼓励玩家分享精彩操作视频。通过数据分析优化发布时间和内容标签，预计单条视频平均播放量达到50万，整体营销活动可带来200万曝光和8%的下载转化率。',
      'Instagram游戏广告创意文案': 'Instagram视觉化特性要求广告创意必须在3秒内抓住用户注意力。文案策略采用"情感共鸣+行动召唤"的双重驱动模式。针对不同用户画像设计了多套创意方案：对于竞技类玩家，文案强调"证明实力的时刻到了"，配合激烈战斗场面；对于休闲玩家，突出"10分钟放松时光"，展示轻松愉快的游戏氛围；对于社交型玩家，主打"和朋友一起冒险"，突出团队合作乐趣。每套创意包含静态图片、轮播图和短视频三种格式，确保在不同展示位置都有最佳效果。文案长度控制在125字符以内，使用emoji增加视觉吸引力，CTA按钮采用"立即体验"、"免费下载"等直接行动词汇。A/B测试显示，情感化文案比功能性文案的点击率高出35%，转化成本降低20%。',
      'Google Play商店优化方案': 'ASO优化是提升游戏自然下载量的关键策略。方案从关键词优化、视觉素材和用户评价三个维度全面提升游戏在Google Play的排名表现。关键词策略结合游戏类型、核心玩法和目标市场特点，选择了"策略游戏"、"多人在线"、"卡牌收集"等高搜索量词汇，同时布局长尾关键词提升精准流量。应用图标采用鲜明的色彩对比和简洁的设计语言，在小尺寸显示时仍能清晰传达游戏主题。截图和视频预览重新设计，前3张截图展示核心玩法，后续截图突出社交功能和成长系统。应用描述优化为"痛点-解决方案-收益"的结构，前80字符包含主要关键词和核心卖点。建立用户反馈收集机制，及时回复评价并持续优化游戏体验，目标是将评分提升至4.5分以上，预计整体下载量可提升40%。',
      'Facebook游戏社群运营计划': 'Facebook社群是培养忠实玩家和促进用户留存的重要平台。运营计划以"内容为王，互动为本"为核心理念，构建活跃的游戏社区生态。内容策略包括每日游戏攻略分享、玩家作品展示、开发团队幕后故事和版本更新预告四大类型。建立"新手指导-进阶攻略-高端技巧"的内容梯度，满足不同水平玩家的需求。设置每周固定活动：周一分享攻略、周三玩家作品展示、周五开发日志、周日社区问答。引入积分奖励机制，活跃用户可获得游戏内道具和限定皮肤。培养核心玩家成为社群管理员，建立玩家自治体系。通过Facebook Live定期举办开发者访谈和玩家PK赛，增强社群凝聚力。预计3个月内社群成员达到5万人，月活跃度保持在60%以上，社群用户的7日留存率比普通用户高出25%。',
      'YouTube游戏频道内容规划': 'YouTube作为全球最大的视频平台，是游戏长视频内容的主要阵地。频道定位为"专业游戏攻略+娱乐解说"，目标打造游戏垂直领域的权威内容品牌。内容矩阵包括新手教程、高端攻略、版本解析、玩家故事和游戏评测五大板块。每周更新计划：周一发布新手教程，周三上传高端攻略，周五推出版本解析，周日制作玩家故事专题。视频时长控制在8-15分钟，确保内容深度的同时保持观看完成率。与知名游戏UP主合作，制作联合攻略和对战视频，扩大频道影响力。建立观众互动机制，定期举办"观众挑战赛"和"攻略征集"活动。优化视频SEO，标题包含热门关键词，缩略图采用高对比度设计突出重点信息。预计6个月内频道订阅数达到10万，平均视频播放量5万次，为游戏带来稳定的用户增长和品牌曝光。',
      '拉美地区游戏推广预算分配': '拉美市场具有巨大的增长潜力，但各国经济水平和用户习惯差异显著，需要精细化的预算分配策略。总预算100万美元，按市场规模和增长潜力分配：巴西40%、墨西哥25%、阿根廷15%、哥伦比亚10%、其他国家10%。渠道分配策略：Facebook和Instagram占50%预算，主要用于精准定向广告；Google Ads占30%，重点投放搜索和YouTube广告；本地化渠道占20%，包括当地社交平台和游戏媒体合作。时间分配采用"测试-优化-放量"三阶段策略：前2个月30%预算用于小规模测试，中间2个月40%预算优化投放策略，最后2个月30%预算大规模投放。重点关注CPI、留存率和ROAS三个核心指标，设定CPI目标2.5美元，7日留存率35%，30日ROAS达到120%。建立实时监控体系，每周调整预算分配，确保投放效果最大化。',
      
      // 市场趋势
      '巴西手游市场分析报告': '巴西作为拉美最大的游戏市场，2024年手游收入达到23亿美元，同比增长18%。市场特点呈现明显的本土化需求和社交化趋势。用户画像显示，25-34岁群体占比最高达35%，女性玩家比例持续上升至48%。付费习惯方面，巴西玩家更偏好小额多次付费，平均单次付费金额为8美元，但付费频次较高。热门游戏类型集中在休闲益智、体育竞技和社交模拟三大类，其中足球主题游戏具有天然优势。本地化要求极高，葡萄牙语适配是基础门槛，文化元素融入是成功关键。支付方式多样化，信用卡、借记卡、数字钱包和运营商计费并存，需要全面支持。竞争格局相对集中，前10名游戏占据60%市场份额，但中腰部产品仍有机会。建议重点关注社交功能设计、本地化运营和多元化变现模式，预计未来3年市场规模将突破35亿美元。',
      '墨西哥移动游戏用户研究': '墨西哥移动游戏用户呈现年轻化、社交化和多元化特征。用户规模达到5800万，渗透率72%，仍有较大增长空间。年龄分布集中在18-35岁，占总用户的68%，这一群体具有较强的付费意愿和社交需求。性别比例趋于平衡，男性52%，女性48%，女性用户增长速度更快。游戏偏好呈现明显的文化特色，策略类、角色扮演和音乐舞蹈类游戏最受欢迎。用户行为分析显示，平均每日游戏时长2.3小时，主要集中在晚上7-10点和午休时间。付费转化率为4.2%，ARPPU值为45美元，付费用户生命周期平均8个月。社交功能使用率极高，85%用户会与朋友分享游戏内容，78%用户参与过公会或团队活动。语言本地化至关重要，西班牙语适配可提升用户留存率25%。推广渠道方面，Facebook和YouTube效果最佳，本地网红营销也具有很好的转化效果。',
      '东南亚三国游戏市场对比': '越南、泰国、印尼三国构成东南亚手游市场的核心区域，总市场规模达到45亿美元。越南市场规模12亿美元，用户付费意愿强，ARPU值在东南亚地区最高，达到38美元。泰国市场规模15亿美元，用户基数大但付费转化率相对较低，更偏好免费游戏模式。印尼市场规模18亿美元，用户增长最快但ARPU值较低，主要依靠广告变现。游戏类型偏好存在显著差异：越南用户偏爱策略和RPG类游戏，泰国用户喜欢休闲和社交类游戏，印尼用户对动作和冒险类游戏需求旺盛。本地化要求各不相同，越南需要越南语适配和本土文化元素，泰国注重佛教文化的尊重和融入，印尼需要考虑宗教敏感性和多元文化特点。支付生态差异明显，越南以银行卡和电子钱包为主，泰国移动支付普及率高，印尼运营商计费仍占重要地位。竞争环境方面，三国都有强势的本土发行商，国际化产品需要寻找合适的本地合作伙伴。',
      '越南手游付费习惯调研': '越南手游用户付费习惯呈现"高频小额"的特点，反映了当地经济水平和消费观念。付费转化率达到6.8%，在东南亚地区位居前列，但单次付费金额相对较小，平均为12美元。付费动机主要集中在提升游戏体验和社交展示两个方面，其中购买装备道具占45%，外观皮肤占30%，加速道具占25%。付费时机分析显示，新用户在注册后3-7天内的付费概率最高，达到15%，之后逐渐下降。节假日和游戏活动期间付费活跃度显著提升，春节期间付费金额比平时高出40%。支付方式偏好呈现多元化趋势，银行卡占35%，电子钱包占30%，运营商计费占20%，游戏点卡占15%。价格敏感度较高，0.99-4.99美元的商品最受欢迎，超过20美元的商品购买率急剧下降。付费用户生命周期平均10个月，忠诚度较高。建议采用阶梯式定价策略，设置更多小额付费点，同时通过限时优惠和节日活动刺激付费转化。',
      '泰国游戏本地化策略分析': '泰国游戏市场本地化需求独特，文化敏感度高，成功的本地化策略是产品成功的关键因素。语言本地化是基础要求，泰语翻译需要考虑语言习惯和文化内涵，避免直译造成的理解偏差。视觉设计需要融入泰国文化元素，如传统图案、宗教符号和节日主题，但必须确保使用得当，避免文化冒犯。游戏内容本地化包括角色设定、故事背景和节日活动的调整，泰国玩家对本土化内容接受度很高。支付本地化至关重要，需要支持泰国主流支付方式，包括银行转账、7-Eleven便利店支付和移动钱包。营销本地化要求深度理解泰国社交媒体生态，Facebook、Line和TikTok是主要推广渠道，KOL营销效果显著。客服本地化需要提供泰语支持，响应时间和服务质量直接影响用户满意度。法规合规方面，需要关注泰国对游戏内容的审查要求，特别是涉及宗教和政治内容的限制。建议与本地发行商合作，借助其本土化经验和渠道资源，降低市场进入风险。',
      '印尼移动游戏竞品研究': '印尼移动游戏市场竞争激烈，本土和国际产品并存，呈现多元化竞争格局。市场领导者包括Garena Free Fire、Mobile Legends和PUBG Mobile三款产品，合计占据40%市场份额。本土优势产品如Higgs Domino和Ludo King在休闲游戏领域表现突出，深度融合了印尼本土文化和社交习惯。国际产品成功案例分析显示，本地化程度是关键成功因素，成功产品都进行了深度的语言、文化和支付本地化。竞品变现模式呈现多样化趋势，广告变现占比较高，达到55%，内购占35%，订阅制占10%。用户获取成本持续上升，CPI平均达到3.2美元，但用户生命周期价值也在提升。竞争策略方面，头部产品注重品牌建设和社区运营，中腰部产品更多依靠创新玩法和精准营销。新进入者面临的主要挑战包括用户获取成本高、本地化要求严格和监管环境复杂。建议采用差异化竞争策略，专注细分市场，通过独特的游戏体验和精准的用户定位获得竞争优势。',
      '东南亚游戏市场准入研究': '东南亚游戏市场准入涉及法规合规、技术标准和商业模式三个核心层面。法规环境各国差异显著，新加坡和马来西亚监管相对宽松，主要关注内容审查和数据保护；泰国和越南对游戏内容审查较严，需要获得相关许可证；印尼和菲律宾除内容审查外，还有本地化运营要求。技术准入门槛包括服务器本地化部署、数据存储合规和网络安全认证。商业准入要求涉及税务登记、支付牌照和本地合作伙伴选择。内容合规是重点关注领域，需要避免涉及政治、宗教和文化敏感内容，建立完善的内容审核机制。数据保护合规要求日益严格，需要建立用户隐私保护体系和数据跨境传输合规流程。知识产权保护策略包括商标注册、版权保护和反盗版措施。建议采用分阶段准入策略，优先进入监管环境相对友好的市场，积累经验后再拓展到其他国家。与当地法律顾问和合规专家建立合作关系，确保准入过程的合规性和效率。'
    };
    return summaries[task.title] || '暂无AI总结内容，请稍后重试。';
  };

  // 生成网格布局
  const generateGridLayout = useCallback(() => {
    const maxRow = Math.max(...cards.map(card => card.row), 2) + 1;
    const layout: (CardConfig | null)[][] = Array(maxRow).fill(null).map(() => Array(12).fill(null));
    
    // 填充已有卡片
    cards.forEach(card => {
      const width = CARD_WIDTHS[card.width];
      for (let i = 0; i < width; i++) {
        if (layout[card.row] && layout[card.row][card.col + i] !== undefined) {
          layout[card.row][card.col + i] = card;
        }
      }
    });
    
    return layout;
  }, [cards]);


  // 渲染卡片内容
  const renderCardContent = (cardType: CardConfig['type']) => {
    switch (cardType) {
      case 'report':
        return (
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ 
                  width: 4, 
                  height: 24, 
                  bgcolor: 'primary.main', 
                  borderRadius: 2 
                }} />
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  color: 'text.primary',
                  position: 'relative'
                }}>
                  AI每日报告
                </Typography>
              </Stack>
            </Stack>
            
            {/* 小型 Tab 页签 - 左侧对齐 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Tabs 
                value={reportTabValue} 
                onChange={(_, newValue) => setReportTabValue(newValue)}
                aria-label="工作日报标签页"
                variant="standard"
                sx={{
                  minHeight: 'auto',
                  '& .MuiTabs-indicator': {
                    height: 2
                  },
                  '& .MuiTab-root': {
                    minHeight: 'auto',
                    minWidth: 'auto',
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'none'
                  }
                }}
              >
                <Tab label="当前进度" />
                <Tab label="已完成" />
                <Tab label="待完成" />
              </Tabs>
            </Box>

            {/* Tab 内容 - 固定高度 */}
            <Box sx={{ height: '320px', py: 1, overflow: 'auto' }}>
              {reportTabValue === 0 && (
                // 进度页面 - 精美设计
                <Stack spacing={2} sx={{ width: '100%' }}>
                  {/* 主要进度展示 */}
                  <Box sx={{ 
                    p: 2.5, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          今日完成度
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          85%
                        </Typography>
                      </Stack>
                      
                      {/* 线性进度条 */}
                      <Box sx={{ width: '100%' }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={85} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              bgcolor: 'primary.main'
                            }
                          }} 
                        />
                      </Box>
                      
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          已完成 12/14 项任务
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          还剩 2 项
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  {/* 今日总结 */}
                  <Box sx={{ 
                    p: 2.5, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <Stack spacing={2}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        今日总结
                      </Typography>
                      
                      {/* 工作总结内容 */}
                      <Typography variant="body2" sx={{ 
                        color: 'text.primary',
                        lineHeight: 1.5,
                        fontSize: '0.875rem'
                      }}>
                        成功处理8项图像生成任务，完成5个文本分析项目，整理2份数据表格，执行3次系统监控检查。整体工作效率较高，各项任务按计划推进。
                      </Typography>

                    </Stack>
                  </Box>
                </Stack>
              )}
              
              {reportTabValue === 1 && (
                // 已完成的任务页面 - 优化布局
                <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
                  <Stack spacing={1.5}>
                    {[
                      { name: '图像处理任务', count: 8, color: 'primary.main', desc: '图片生成与优化' },
                      { name: '文本分析任务', count: 5, color: 'secondary.main', desc: '内容理解与生成' },
                      { name: '表格数据任务', count: 2, color: 'success.main', desc: '数据整理与分析' },
                      { name: '系统监控任务', count: 3, color: 'info.main', desc: '状态检测与报告' }
                    ].map((task, index) => (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          bgcolor: 'grey.50',
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'grey.100',
                            borderColor: task.color,
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600,
                              color: 'text.primary',
                              mb: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {task.name}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {task.desc}
                            </Typography>
                          </Box>
                          <Box sx={{ ml: 2, flexShrink: 0 }}>
                            <Chip 
                              label={`${task.count}份`} 
                              size="small" 
                              sx={{ 
                                bgcolor: task.color,
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }} 
                            />
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {reportTabValue === 2 && (
                // 待完成的任务页面
                <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
                  <Stack spacing={1.5}>
                    {[
                      { name: '图像优化任务', priority: '高', color: 'error.main', desc: '批量图片压缩处理', deadline: '今日 18:00' },
                      { name: '文档整理任务', priority: '中', color: 'warning.main', desc: '项目文档归档', deadline: '明日 12:00' }
                    ].map((task, index) => (
                      <Paper
                        key={index}
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          bgcolor: 'grey.50',
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          borderLeft: `4px solid ${task.color}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: 'grey.100',
                            borderColor: task.color,
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 600,
                                color: 'text.primary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {task.name}
                              </Typography>
                            </Box>
                            <Box sx={{ ml: 2, flexShrink: 0 }}>
                              <Chip 
                                label={task.priority} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  borderColor: task.color,
                                  color: task.color,
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }} 
                              />
                            </Box>
                          </Stack>
                          
                          <Typography variant="caption" sx={{ 
                            color: 'text.secondary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {task.desc}
                          </Typography>
                          
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ 
                              width: 6, 
                              height: 6, 
                              bgcolor: task.color, 
                              borderRadius: '50%' 
                            }} />
                            <Typography variant="caption" sx={{ 
                              color: 'text.secondary',
                              fontWeight: 500
                            }}>
                              截止时间：{task.deadline}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                    
                    {/* 空状态提示 */}
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 3,
                      color: 'text.secondary'
                    }}>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        其他任务已全部完成 ✨
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        );

      case 'tasks':
        return (
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ 
                  width: 4, 
                  height: 24, 
                  bgcolor: 'secondary.main', 
                  borderRadius: 2 
                }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  文档报告
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {mockTasks.filter(t => t.status === 'completed').length} / {mockTasks.length}
              </Typography>
            </Stack>
            
            {/* Tab 页签 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Tabs 
                value={documentTabValue} 
                onChange={(_, newValue) => setDocumentTabValue(newValue)}
                aria-label="文档交付物标签页"
                variant="standard"
                sx={{
                  minHeight: 'auto',
                  '& .MuiTabs-indicator': {
                    height: 2
                  },
                  '& .MuiTab-root': {
                    minHeight: 'auto',
                    minWidth: 'auto',
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'none'
                  }
                }}
              >
                <Tab label="工作文档" />
                <Tab label="市场趋势" />
                <Tab label="待完成" />
              </Tabs>
            </Box>

            {/* Tab 内容 */}
            <Box sx={{ height: '320px', overflow: 'auto' }}>
              {documentTabValue === 0 && (
                // 工作文档
                <Stack spacing={1}>
                  {mockTasks
                    .filter(task => task.type === 'work' && task.status === 'completed')
                    .map((task) => (
                      <Paper
                        key={task.id}
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          '&:hover': { 
                            bgcolor: 'grey.100',
                            borderColor: 'grey.300',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          },
                          transition: 'all 0.2s ease-in-out',
                          cursor: 'pointer'
                        }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600, 
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {task.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {task.time}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0, ml: 1 }}>
                            <IconButton 
                              size="small"
                              sx={{ 
                                color: 'text.secondary',
                                '&:hover': { 
                                  color: 'primary.main',
                                  bgcolor: 'primary.50'
                                }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small"
                              sx={{ 
                                color: 'text.secondary',
                                '&:hover': { 
                                  color: 'success.main',
                                  bgcolor: 'success.50'
                                }
                              }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                            <Button
                              size="small"
                              onClick={() => handleAISummary(task)}
                              sx={{
                                minWidth: 'auto',
                                px: 1,
                                py: 0.5,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: 'text.secondary',
                                border: '1px solid',
                                borderColor: 'grey.300',
                                borderRadius: 1,
                                '&:hover': {
                                  color: 'secondary.main',
                                  borderColor: 'secondary.main',
                                  bgcolor: 'secondary.50'
                                }
                              }}
                            >
                              AI
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}

              {documentTabValue === 1 && (
                // 市场趋势
                <Stack spacing={1}>
                  {mockTasks
                    .filter(task => task.type === 'market' && task.status === 'completed')
                    .map((task) => (
                      <Paper
                        key={task.id}
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.200',
                          '&:hover': { 
                            bgcolor: 'grey.100',
                            borderColor: 'grey.300',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          },
                          transition: 'all 0.2s ease-in-out',
                          cursor: 'pointer'
                        }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600, 
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {task.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {task.time}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0, ml: 1 }}>
                            <IconButton 
                              size="small"
                              sx={{ 
                                color: 'text.secondary',
                                '&:hover': { 
                                  color: 'primary.main',
                                  bgcolor: 'primary.50'
                                }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small"
                              sx={{ 
                                color: 'text.secondary',
                                '&:hover': { 
                                  color: 'success.main',
                                  bgcolor: 'success.50'
                                }
                              }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                            <Button
                              size="small"
                              onClick={() => handleAISummary(task)}
                              sx={{
                                minWidth: 'auto',
                                px: 1,
                                py: 0.5,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: 'text.secondary',
                                border: '1px solid',
                                borderColor: 'grey.300',
                                borderRadius: 1,
                                '&:hover': {
                                  color: 'secondary.main',
                                  borderColor: 'secondary.main',
                                  bgcolor: 'secondary.50'
                                }
                              }}
                            >
                              AI
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}

              {documentTabValue === 2 && (
                // 待完成
                <Stack spacing={1}>
                  {mockTasks
                    .filter(task => task.status === 'pending')
                    .map((task) => (
                      <Paper
                        key={task.id}
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.300',
                          '&:hover': { 
                            bgcolor: 'grey.100',
                            borderColor: 'grey.400',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          },
                          transition: 'all 0.2s ease-in-out',
                          cursor: 'pointer'
                        }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600, 
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {task.title}
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                {task.time}
                              </Typography>
                              <Chip 
                                label="待完成"
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  height: 20, 
                                  fontSize: '0.7rem',
                                  borderColor: 'warning.300',
                                  color: 'warning.600',
                                  bgcolor: 'transparent'
                                }}
                              />
                            </Stack>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0, ml: 1 }}>
                            <IconButton 
                              size="small"
                              sx={{ 
                                color: 'text.secondary',
                                '&:hover': { 
                                  color: 'primary.main',
                                  bgcolor: 'primary.50'
                                }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Box>
          </Stack>
        );

      case 'images':
        return (
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ 
                  width: 4, 
                  height: 24, 
                  bgcolor: 'info.main', 
                  borderRadius: 2 
                }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  图像生成
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {mockImages.filter(img => img.status === 'completed').length} / {mockImages.length}
              </Typography>
            </Stack>
            
            {/* Tab 页签 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Tabs 
                value={imageViewTabValue} 
                onChange={(_, newValue) => setImageViewTabValue(newValue)}
                aria-label="图像视图标签页"
                variant="standard"
                sx={{
                  minHeight: 'auto',
                  '& .MuiTabs-indicator': {
                    height: 2
                  },
                  '& .MuiTab-root': {
                    minHeight: 'auto',
                    minWidth: 'auto',
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'none'
                  }
                }}
              >
                <Tab label="卡片视图" />
                <Tab label="列表视图" />
              </Tabs>
            </Box>

            {/* Tab 内容 */}
            <Box sx={{ height: '320px', overflow: 'auto' }}>
              {imageViewTabValue === 0 && (
                // 卡片视图 - 只显示已完成的图片缩略图
                <Box sx={{ width: '100%' }}>
                  <Grid container spacing={1.5}>
                    {mockImages.filter(img => img.status === 'completed').map((image) => (
                      <Grid item xs={6} key={image.id}>
                        <Paper
                          elevation={0}
                          sx={{ 
                            position: 'relative',
                            aspectRatio: '4/3',
                            borderRadius: 1.5,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'grey.200',
                            cursor: 'pointer',
                            '&:hover': { 
                              borderColor: 'primary.main',
                              transform: 'scale(1.02)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* 模拟图片缩略图 */}
                          <Box sx={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}>
                            {/* 根据图片类型显示不同图标 */}
                            {image.type === 'Logo' && <PaletteIcon sx={{ fontSize: 32, color: 'rgba(0,0,0,0.4)' }} />}
                            {image.type === '海报' && <WallpaperIcon sx={{ fontSize: 32, color: 'rgba(0,0,0,0.4)' }} />}
                            {image.type === '头像' && <CameraIcon sx={{ fontSize: 32, color: 'rgba(0,0,0,0.4)' }} />}
                            {image.type === '横幅' && <ImageIcon sx={{ fontSize: 32, color: 'rgba(0,0,0,0.4)' }} />}
                            {image.type === '封面' && <WallpaperIcon sx={{ fontSize: 32, color: 'rgba(0,0,0,0.4)' }} />}
                            {image.type === '展示图' && <CameraIcon sx={{ fontSize: 32, color: 'rgba(0,0,0,0.4)' }} />}
                            {image.type === '图标' && <PaletteIcon sx={{ fontSize: 32, color: 'rgba(0,0,0,0.4)' }} />}
                            {image.type === '纹理' && <BrushIcon sx={{ fontSize: 32, color: 'rgba(0,0,0,0.4)' }} />}
                            {image.type === '插画' && <BrushIcon sx={{ fontSize: 32, color: 'rgba(0,0,0,0.4)' }} />}
                            
                            {/* 图片信息覆盖层 */}
                            <Box sx={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                              color: 'white',
                              p: 1
                            }}>
                              <Typography variant="caption" sx={{ 
                                fontWeight: 600,
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {image.title}
                              </Typography>
                              <Typography variant="caption" sx={{ 
                                opacity: 0.8,
                                fontSize: '0.65rem'
                              }}>
                                {image.type} • {image.time}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                  
                  {mockImages.filter(img => img.status === 'completed').length === 0 && (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      color: 'text.secondary'
                    }}>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        暂无已完成的图像
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {imageViewTabValue === 1 && (
                // 列表视图 - 待完成任务在上方，已完成任务弱化显示
                <Stack spacing={1}>
                  {/* 先显示待完成的任务 */}
                  {mockImages
                    .filter(image => image.status === 'pending')
                    .map((image) => (
                      <Paper
                        key={image.id}
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          bgcolor: 'grey.50',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.300',
                          '&:hover': { 
                            bgcolor: 'grey.100',
                            borderColor: 'grey.400',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          },
                          transition: 'all 0.2s ease-in-out',
                          cursor: 'pointer'
                        }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600, 
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {image.title}
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                {image.time}
                              </Typography>
                              <Chip 
                                label="待完成"
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  height: 20, 
                                  fontSize: '0.7rem',
                                  borderColor: 'warning.300',
                                  color: 'warning.600',
                                  bgcolor: 'transparent'
                                }}
                              />
                            </Stack>
                          </Stack>
                          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 1 }}>
                            <IconButton 
                              size="small"
                              sx={{ 
                                color: 'text.secondary',
                                '&:hover': { 
                                  color: 'primary.main',
                                  bgcolor: 'primary.50'
                                }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  
                  {/* 然后显示已完成的任务（弱化显示） */}
                  {mockImages
                    .filter(image => image.status === 'completed')
                    .map((image) => (
                      <Paper
                        key={image.id}
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          bgcolor: 'grey.25',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'grey.100',
                          opacity: 0.7,
                          '&:hover': { 
                            opacity: 1,
                            bgcolor: 'grey.50',
                            borderColor: 'grey.200',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          },
                          transition: 'all 0.2s ease-in-out',
                          cursor: 'pointer'
                        }}
                      >
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 500, 
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {image.title}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {image.time}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 1 }}>
                            <IconButton 
                              size="small"
                              sx={{ 
                                color: 'text.disabled',
                                '&:hover': { 
                                  color: 'primary.main',
                                  bgcolor: 'primary.50'
                                }
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small"
                              sx={{ 
                                color: 'text.disabled',
                                '&:hover': { 
                                  color: 'success.main',
                                  bgcolor: 'success.50'
                                }
                              }}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                </Stack>
              )}
            </Box>
          </Stack>
        );

      case 'data':
        return (
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ 
                width: 4, 
                height: 24, 
                bgcolor: 'success.main', 
                borderRadius: 2 
              }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                数据监控
              </Typography>
            </Stack>
            
            {/* 内容区域 - 固定高度 */}
            <Box sx={{ height: '320px', overflow: 'auto' }}>
              <Stack spacing={2}>
                {mockData.map((data) => (
                <Paper
                  key={data.id}
                  elevation={0}
                  onClick={() => handleDataModuleClick(data)}
                  sx={{ 
                    p: 2.5, 
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.200',
                    cursor: 'pointer',
                    '&:hover': { 
                      bgcolor: 'grey.100',
                      borderColor: 'grey.300',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {data.title}
                      </Typography>
                      <Box sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: data.status === 'excellent' ? 'success.main' : 
                                data.status === 'good' ? 'info.main' : 
                                data.status === 'warning' ? 'warning.main' : 'error.main'
                      }} />
                    </Stack>
                    <Typography variant="body2" sx={{ 
                      color: 'text.secondary',
                      lineHeight: 1.4,
                      fontSize: '0.85rem'
                    }}>
                      {data.description}
                    </Typography>
                  </Stack>
                </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        );

      case 'socialHotspots':
        return (
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ 
                width: 4, 
                height: 24, 
                bgcolor: 'secondary.main', 
                borderRadius: 2 
              }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                社媒热点
              </Typography>
            </Stack>
            
            {/* Tab 页签 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={socialHotspotTabValue}
                onChange={(_, newValue) => setSocialHotspotTabValue(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 'auto',
                  '& .MuiTab-root': {
                    minHeight: 'auto',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    py: 1,
                    px: 2
                  }
                }}
              >
                <Tab label="TikTok" />
                <Tab label="Instagram" />
                <Tab label="YouTube" />
                <Tab label="Twitter" />
              </Tabs>
            </Box>

            {/* Tab 内容 */}
            <Box sx={{ height: '320px', overflow: 'auto' }}>
              <Stack spacing={1}>
                {Object.values(mockSocialHotspots)[socialHotspotTabValue]?.map((hotspot: any) => (
                  <Paper
                    key={hotspot.id}
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      '&:hover': { 
                        bgcolor: 'grey.100',
                        borderColor: 'grey.300',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease-in-out',
                      cursor: 'pointer'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                        {hotspot.topic}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                          {hotspot.heat.toLocaleString()}
                        </Typography>
                        <Chip 
                          label={hotspot.trend}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        );

      case 'gameHotspots':
        return (
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ 
                width: 4, 
                height: 24, 
                bgcolor: 'primary.main', 
                borderRadius: 2 
              }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                游戏热点
              </Typography>
            </Stack>
            
            {/* Tab 页签 */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={gameHotspotTabValue}
                onChange={(_, newValue) => setGameHotspotTabValue(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 'auto',
                  '& .MuiTab-root': {
                    minHeight: 'auto',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    py: 1,
                    px: 2
                  }
                }}
              >
                <Tab label="我的项目" />
                <Tab label="游戏行业" />
              </Tabs>
            </Box>

            {/* Tab 内容 */}
            <Box sx={{ height: '320px', overflow: 'auto' }}>
              <Stack spacing={1}>
                {Object.values(mockGameHotspots)[gameHotspotTabValue]?.map((hotspot: any) => (
                  <Paper
                    key={hotspot.id}
                    elevation={0}
                    sx={{ 
                      p: 2, 
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      '&:hover': { 
                        bgcolor: 'grey.100',
                        borderColor: 'grey.300',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      },
                      transition: 'all 0.2s ease-in-out',
                      cursor: 'pointer'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                        {hotspot.topic}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                          {hotspot.heat.toLocaleString()}
                        </Typography>
                        <Chip 
                          label={hotspot.trend}
                          size="small"
                          color="success"
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        );

      default:
        return null;
    }
  };

  const gridLayout = generateGridLayout();

  return (
    <Box sx={{ p: 0 }}>
      {/* 页面标题 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
          验收台
        </Typography>
        <Typography variant="body2" color="text.secondary">
          实时监控工作成果，智能化任务验收与数据洞察 • 可拖拽调整布局
        </Typography>
      </Box>

      {/* 网格布局容器 */}
      <Box
        ref={gridRef}
        sx={{
          position: 'relative',
          minHeight: '600px',
          bgcolor: isDragging ? 'grey.50' : 'transparent',
          borderRadius: 2,
          transition: 'background-color 0.2s ease'
        }}
      >
        {/* 渲染网格 */}
        {gridLayout.map((row, rowIndex) => (
          <Box key={rowIndex} sx={{ display: 'flex', mb: 3, minHeight: '200px' }}>
            {Array.from({ length: 12 }, (_, colIndex) => {
              const cell = row[colIndex];
              const isFirstCellOfCard = cell && cards.find(c => c.id === cell.id && c.col === colIndex);
              
              if (isFirstCellOfCard) {
                const card = isFirstCellOfCard;
                const cardWidth = CARD_WIDTHS[card.width];
                
                return (
                  <Box
                    key={`${rowIndex}-${colIndex}`}
                    sx={{
                      flex: `0 0 ${(cardWidth / 12) * 100}%`,
                      pr: 2
                    }}
                  >
                    <Paper
                      draggable
                      onDragStart={(e) => handleDragStart(e, card)}
                      onDragEnd={handleDragEnd}
                      variant="outlined"
                      sx={{
                        p: 2,
                        height: '100%',
                        borderRadius: 2,
                        position: 'relative',
                        cursor: 'grab',
                        overflow: 'hidden', // 防止内容溢出
                        '&:active': {
                          cursor: 'grabbing'
                        },
                        '&:hover': {
                          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                          borderColor: 'primary.main',
                          '& .card-controls': {
                            opacity: 1
                          }
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      {/* 右上角控制按钮 */}
                      <Box
                        className="card-controls"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          zIndex: 10,
                          bgcolor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: 1,
                          backdropFilter: 'blur(4px)',
                          border: '1px solid',
                          borderColor: 'grey.200',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      >
                        <Stack direction="row" spacing={0.5} sx={{ p: 0.5 }}>
                          <Tooltip title="拖拽移动">
                            <IconButton 
                              size="small" 
                              sx={{ 
                                color: 'grey.600',
                                cursor: 'grab',
                                '&:active': { cursor: 'grabbing' },
                                '&:hover': { 
                                  bgcolor: 'primary.50',
                                  color: 'primary.main'
                                }
                              }}
                            >
                              <DragIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="调整尺寸">
                            <IconButton 
                              size="small" 
                              onClick={(e) => handleOpenResizeMenu(e, card.id)}
                              sx={{ 
                                color: 'grey.600',
                                '&:hover': { 
                                  bgcolor: 'secondary.50',
                                  color: 'secondary.main'
                                }
                              }}
                            >
                              <ResizeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>

                      {/* 卡片内容 - 添加溢出控制 */}
                      <Box 
                        sx={{ 
                          mt: 1,
                          height: 'calc(100% - 8px)',
                          overflow: 'auto', // 允许滚动
                          '&::-webkit-scrollbar': {
                            width: '6px'
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'transparent'
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: 'grey.300',
                            borderRadius: '3px'
                          }
                        }}
                      >
                        {renderCardContent(card.type)}
                      </Box>
                    </Paper>
                  </Box>
                );
              } else if (!cell) {
                // 空白区域 - 可以作为放置目标
                return (
                  <Box
                    key={`${rowIndex}-${colIndex}`}
                    onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                    onDragOver={handleDragOver}
                    sx={{
                      flex: '0 0 8.333333%', // 1/12 宽度
                      minHeight: '100%',
                      border: isDragging ? '2px dashed' : '1px solid transparent',
                      borderColor: isDragging ? 'primary.main' : 'transparent',
                      borderRadius: 1,
                      transition: 'border-color 0.2s ease',
                      '&:hover': {
                        borderColor: isDragging ? 'primary.main' : 'grey.300'
                      }
                    }}
                  />
                );
              } else {
                // 被卡片占用的其他列
                return null;
              }
            })}
          </Box>
        ))}
      </Box>

      {/* 调整大小菜单 */}
      <Menu
        anchorEl={resizeMenuAnchor}
        open={Boolean(resizeMenuAnchor)}
        onClose={handleCloseResizeMenu}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'grey.200'
          }
        }}
      >
        <MenuItem onClick={() => selectedCardId && handleResizeCard(selectedCardId, 'small')}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 20, height: 12, bgcolor: 'grey.300', borderRadius: 0.5 }} />
            <Typography variant="body2">小 (1/3 宽度)</Typography>
          </Stack>
        </MenuItem>
        <MenuItem onClick={() => selectedCardId && handleResizeCard(selectedCardId, 'medium')}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 30, height: 12, bgcolor: 'grey.400', borderRadius: 0.5 }} />
            <Typography variant="body2">中 (1/2 宽度)</Typography>
          </Stack>
        </MenuItem>
        <MenuItem onClick={() => selectedCardId && handleResizeCard(selectedCardId, 'large')}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 40, height: 12, bgcolor: 'grey.500', borderRadius: 0.5 }} />
            <Typography variant="body2">大 (2/3 宽度)</Typography>
          </Stack>
        </MenuItem>
        <MenuItem onClick={() => selectedCardId && handleResizeCard(selectedCardId, 'full')}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 50, height: 12, bgcolor: 'grey.600', borderRadius: 0.5 }} />
            <Typography variant="body2">全宽 (100% 宽度)</Typography>
          </Stack>
        </MenuItem>
      </Menu>

      {/* AI总结弹窗 */}
      <Dialog
        open={aiSummaryOpen}
        onClose={handleCloseAISummary}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 3,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: 'secondary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Typography variant="caption" sx={{ 
                color: 'white', 
                fontWeight: 700,
                fontSize: '0.75rem'
              }}>
                AI
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AI智能总结
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 8, pb: 4, px: 4, mt: 2 }}>
          <Typography variant="body1" sx={{
            lineHeight: 1.8,
            color: 'text.primary',
            fontSize: '1rem',
            mt: 2
          }}>
            {selectedDocument && getAISummary(selectedDocument)}
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 2, justifyContent: 'center' }}>
          <Button
            onClick={handleCloseAISummary}
            variant="contained"
            sx={{ 
              borderRadius: 2,
              bgcolor: 'secondary.main',
              '&:hover': {
                bgcolor: 'secondary.dark'
              }
            }}
          >
            关闭
          </Button>
        </DialogActions>
      </Dialog>

      {/* 数据监控详情弹窗 */}
      <Dialog
        open={dataMonitorOpen}
        onClose={handleCloseDataMonitor}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 3,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: selectedDataModule?.status === 'excellent' ? 'success.main' : 
                      selectedDataModule?.status === 'good' ? 'info.main' : 
                      selectedDataModule?.status === 'warning' ? 'warning.main' : 'error.main'
            }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedDataModule?.title} - 详细数据
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 4, pb: 4, px: 4 }}>
          {selectedDataModule && (
            <Stack spacing={3}>
              <Typography variant="body1" sx={{
                lineHeight: 1.6,
                color: 'text.secondary',
                fontSize: '0.95rem',
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 1
              }}>
                {selectedDataModule.description}
              </Typography>
              
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                关键指标
              </Typography>
              
              <Grid container spacing={2}>
                {Object.entries(selectedDataModule.metrics || {}).map(([key, metric]: [string, any]) => (
                  <Grid item xs={6} key={key}>
                    <Paper elevation={0} sx={{ 
                      p: 2.5, 
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200'
                    }}>
                      <Stack spacing={1}>
                        <Typography variant="body2" sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.8rem'
                        }}>
                          {metric.label}
                        </Typography>
                        <Typography variant="h5" sx={{ 
                          fontWeight: 700,
                          color: 'text.primary'
                        }}>
                          {metric.value}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Chip 
                            label={metric.trend}
                            size="small"
                            color={metric.trend.startsWith('+') ? 'success' : 'error'}
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                          <Typography variant="caption" sx={{ 
                            color: 'text.disabled',
                            fontSize: '0.7rem'
                          }}>
                            目标: {metric.target}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 2, justifyContent: 'center' }}>
          <Button
            onClick={handleCloseDataMonitor}
            variant="contained"
            sx={{ 
              borderRadius: 2,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
