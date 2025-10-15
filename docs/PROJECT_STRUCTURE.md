# LaunchBox 项目结构设计方案

## 新的目录结构

```
GameAgent/
├── README.md                          # 项目主文档
├── docs/                              # 文档目录
│   ├── PROJECT_STRUCTURE.md          # 项目结构说明
│   ├── API.md                        # API文档
│   ├── DEVELOPMENT.md                # 开发指南
│   └── DEPLOYMENT.md                 # 部署指南
│
├── frontend/                          # 前端应用 (React + TypeScript)
│   ├── public/                       # 静态资源
│   │   ├── logo.svg                  # Logo图标
│   │   └── favicon.ico               # 网站图标
│   │
│   ├── src/
│   │   ├── assets/                   # 资源文件
│   │   │   ├── images/              # 图片资源
│   │   │   ├── styles/              # 全局样式
│   │   │   └── theme/               # 主题配置
│   │   │
│   │   ├── components/              # 通用组件
│   │   │   ├── common/             # 基础组件
│   │   │   ├── layout/             # 布局组件
│   │   │   └── ui/                 # UI组件
│   │   │
│   │   ├── features/                # 功能模块
│   │   │   ├── chat/               # 聊天功能
│   │   │   ├── eventPlanner/       # 活动策划
│   │   │   ├── imageGeneration/    # 图像生成
│   │   │   ├── knowledgeBase/      # 知识库
│   │   │   └── settings/           # 设置
│   │   │
│   │   ├── hooks/                   # 自定义Hooks
│   │   ├── services/                # 服务层
│   │   │   ├── api/                # API服务
│   │   │   ├── storage/            # 存储服务
│   │   │   └── utils/              # 工具函数
│   │   │
│   │   ├── types/                   # TypeScript类型定义
│   │   ├── config/                  # 配置文件
│   │   ├── App.tsx                  # 主应用组件
│   │   └── main.tsx                 # 入口文件
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
│
├── backend/                           # 后端应用 (FastAPI + Python)
│   ├── api/                          # API路由
│   │   ├── __init__.py
│   │   ├── chat.py                  # 聊天API
│   │   ├── event_planning.py       # 活动策划API
│   │   └── image.py                 # 图像生成API
│   │
│   ├── core/                         # 核心模块
│   │   ├── __init__.py
│   │   ├── config.py                # 配置管理
│   │   └── security.py              # 安全相关
│   │
│   ├── services/                     # 服务层
│   │   ├── __init__.py
│   │   ├── openai_service.py       # OpenAI服务
│   │   ├── event_planning_service.py # 活动策划服务
│   │   └── image_service.py        # 图像服务
│   │
│   ├── models/                       # 数据模型
│   │   └── __init__.py
│   │
│   ├── utils/                        # 工具函数
│   │   └── __init__.py
│   │
│   ├── tests/                        # 测试文件
│   │   └── __init__.py
│   │
│   ├── main.py                       # 应用入口
│   ├── requirements.txt
│   └── README.md
│
├── scripts/                           # 脚本文件
│   ├── setup.sh                      # 安装脚本
│   ├── dev.sh                        # 开发启动脚本
│   └── deploy.sh                     # 部署脚本
│
└── .gitignore

```

## 模块功能说明

### Frontend (前端)

#### features/ - 功能模块
- **chat/**: 聊天对话功能
  - 支持实时流式对话
  - 对话历史管理
  - 消息渲染和展示
  
- **eventPlanner/**: 活动策划助手
  - 表单输入
  - 方案生成
  - UI原型图生成
  - 详细策划案输出
  
- **imageGeneration/**: 图像生成
  - GPT图像生成
  - 图片预览和下载
  
- **knowledgeBase/**: 知识库管理
  - 文档上传
  - RAG检索
  - 知识源管理
  
- **settings/**: 设置管理
  - API配置
  - 主题设置
  - 用户偏好

#### services/ - 服务层
- **api/**: API调用服务
  - backendApiService: 后端API封装
  - WebSocket连接管理
  
- **storage/**: 本地存储
  - localStorage管理
  - 图片缓存
  
- **utils/**: 工具函数
  - 日期处理
  - 文本处理
  - Markdown渲染

### Backend (后端)

#### api/ - API路由
- 统一的路由管理
- RESTful API设计
- WebSocket支持

#### services/ - 服务层
- **openai_service**: OpenAI API集成
- **event_planning_service**: 活动策划逻辑
- **image_service**: 图像生成服务

#### core/ - 核心模块
- 配置管理
- 安全认证
- 中间件

## 迁移计划

### 阶段1: 创建新目录结构
1. 创建docs/目录及文档
2. 重组frontend目录
3. 重组backend目录
4. 创建scripts目录

### 阶段2: 移动文件
1. 移动临时脚本到scripts/
2. 重组前端组件到features/
3. 重组后端服务到新结构

### 阶段3: 更新导入
1. 更新所有import路径
2. 更新配置文件
3. 测试功能完整性

### 阶段4: 编写文档
1. README.md
2. API文档
3. 开发指南
4. 部署说明

## 注意事项

1. **保持功能完整**: 所有修改不影响现有功能
2. **渐进式迁移**: 逐步移动文件，保证可运行性
3. **充分测试**: 每次改动后测试相关功能
4. **版本控制**: 使用git管理每个阶段的变更

