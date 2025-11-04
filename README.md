# 🚀 LaunchBox - AI游戏活动策划助手

<div align="center">

![LaunchBox Logo](https://via.placeholder.com/200x80/4A90E2/FFFFFF?text=LaunchBox)

**智能化游戏活动策划与设计平台**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.2.0-green.svg)](package.json)
[![Status](https://img.shields.io/badge/status-active-success.svg)]()

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [技术栈](#-技术栈) • [项目结构](#-项目结构) • [开发指南](#-开发指南)

</div>

---

## 📖 项目简介

LaunchBox 是一个基于大语言模型的智能游戏活动策划助手，旨在帮助游戏运营团队快速生成高质量的活动策划方案、UI设计原型和营销方案。通过AI技术，大幅提升活动策划效率和创意质量。

### 核心价值

- 🎯 **智能策划**: 基于业务目标和玩家画像，自动生成个性化活动方案
- 🎨 **UI原型生成**: 自动生成低保真和高保真UI设计原型
- 💬 **对话式交互**: 自然语言交互，支持翻译、代码解释等多种功能
- 📚 **知识库管理**: RAG检索增强，利用历史数据优化方案
- ⚡ **工作流引擎**: 多步骤任务自动编排和执行
- 🔌 **Action库**: 丰富的工具集，支持计算、文本处理、API调用等

---

## ✨ 功能特性

### 1. 💬 智能对话 (Chat)

**对话能力**:
- ✅ 通用对话交流
- ✅ 意图智能识别（文本回答/工具调用/工作流/信息补齐）
- ✅ 流式响应，实时展示
- ✅ 支持Markdown渲染
- ✅ 思考过程展示

**意图分类系统**:
- **text_answer**: 直接文本回答
- **tool_call**: 单工具调用（计算器、文本处理等）
- **workflow**: 多步骤工作流
- **clarify**: 信息补齐（如Event Planner表单）

---

### 2. 🛠️ Action库 (Actions)

**代码执行类**:
- 📊 **数学计算器**: 支持复杂表达式计算
- 📝 **文本处理**: 字数统计、大小写转换、分析
- 🔤 **JSON处理**: 格式化、key提取、验证
- 📅 **日期时间**: 当前时间、日期解析、格式转换

**API调用类**:
- 🔍 **Google搜索**: 网络信息检索（Mock）

**LLM任务类**:
- 😊 **情感分析**: 用户评论情感倾向分析
- 🎮 **游戏分类**: 游戏类型自动标注

**图像生成类**:
- 🎨 **GPT图像生成**: 基于DALL-E的图像生成

**特性**:
- ✅ 统一的执行接口
- ✅ 参数验证和错误处理
- ✅ 详细的执行日志
- ✅ 前后端协同

---

### 3. 🎮 活动策划助手 (Event Planner)

**核心功能**:
- **智能表单**: 输入活动主题、概要、业务目标等基本信息
- **方案生成**: AI自动生成3个差异化的活动概览方案
- **完整策划案**: 包含11个专业模块的详细策划文档
  - 活动概览
  - 背景与目标
  - 主题与故事线
  - 核心玩法设计
  - UI界面方案
  - 奖励体系（基于T1-T6皮肤等级体系）
  - 时间规划
  - 推广策略
  - 素材需求
  - 效果监测
  - 风险管控
- **UI原型生成**: 
  - 低保真线框图
  - 高保真设计稿
  - 支持图片下载

**业务目标支持**:
- 留存类: 对战竞技、签到、提升DAU
- 拉新类: 吸引新用户、回流用户
- 商业化: 大R/中R/小R/未付费玩家分层

---

### 4. 🎯 指挥中心 (Command Center)

**工作流编排**:
- **预设工作流**: 常用的多步骤任务模板
  - 📊 数学计算助手
  - 📝 文本分析助手
  - 📅 日期时间助手
  - 🔍 信息检索助手
- **自定义工作流**: 用户可创建自己的工作流
- **Todo执行**: 
  - 自动拆解任务步骤
  - 智能上下文推理
  - 步骤间数据传递
  - 实时执行状态

**特性**:
- ✅ 可视化执行进度
- ✅ 步骤级别错误处理
- ✅ 暂停/继续/取消
- ✅ 执行结果追踪

---

### 5. 📚 知识库管理 (Knowledge Base)

**RAG检索增强**:
- 文档上传和向量化
- 语义检索
- 上下文增强
- 知识源管理

**技术栈**:
- TensorFlow.js + Universal Sentence Encoder
- 向量相似度搜索
- 本地化处理

---

### 6. ⚙️ 系统设置 (Settings)

**配置管理**:
- 后端API地址配置
- 启用/禁用后端API
- 配置持久化（localStorage）

---

## 🚀 快速开始

### 前置要求

- **Node.js** >= 18.0.0
- **Python** >= 3.11
- **npm** or **yarn**
- **OpenAI API Key** （必需）

### 安装步骤

#### 1. 克隆项目

\`\`\`bash
git clone https://github.com/NancyXu12138/launchbox.git
cd launchbox
\`\`\`

#### 2. 安装前端依赖

\`\`\`bash
npm install
\`\`\`

#### 3. 安装后端依赖

\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
\`\`\`

#### 4. 配置环境变量

编辑 `backend/config.py`，配置你的API密钥：

\`\`\`python
OPENAI_API_KEY = "your-api-key-here"  # 必需
OPENAI_MODEL = "gpt-4o"               # 默认模型
OPENAI_BASE_URL = "https://api.openai.com/v1"  # 可选，使用代理时配置
\`\`\`

#### 5. 启动应用

**启动后端服务器**:
\`\`\`bash
cd backend
python main.py
# 服务运行在: http://localhost:8001
\`\`\`

**启动前端开发服务器**:
\`\`\`bash
npm run dev
# 应用运行在: http://localhost:5174
\`\`\`

#### 6. 访问应用

在浏览器中打开 `http://localhost:5174`

---

## 🛠️ 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI框架 |
| TypeScript | 5.6.2 | 类型安全 |
| Vite | 5.4.6 | 构建工具 |
| Material-UI | 6.1.7 | UI组件库 |
| React Router | 6.26.2 | 路由管理 |
| React Markdown | 10.1.0 | Markdown渲染 |
| TensorFlow.js | 4.22.0 | 向量嵌入（可选） |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.13 | 后端语言 |
| FastAPI | 0.115.6 | Web框架 |
| OpenAI | 1.57.2 | LLM API |
| Pydantic | 2.10.4 | 数据验证 |
| Uvicorn | 0.32.1 | ASGI服务器 |
| WebSockets | 14.1 | 实时通信 |

---

## 📁 项目结构

\`\`\`
GameAgent/
├── 📄 README.md                      # 项目文档
│
├── 📂 docs/                           # 详细文档
│   ├── ARCHITECTURE.md               # 系统架构
│   ├── ARCHITECTURE_REVIEW.md        # 架构审查报告
│   ├── SERVICES_GUIDE.md             # Services指南
│   ├── OLLAMA_CLEANUP_SUMMARY.md     # Ollama清理总结
│   └── ...
│
├── 📂 src/ (前端代码)
│   ├── components/                   # 通用组件
│   │   ├── ActionResultDisplay.tsx  # Action结果展示
│   │   ├── BottomTodoPanel.tsx      # Todo面板
│   │   └─ MarkdownRenderer.tsx      # Markdown渲染
│   │
│   ├── modules/                      # 功能模块
│   │   ├── chat/                    # 聊天页面 ✅
│   │   ├── actions/                 # Action管理 ✅
│   │   ├── command-center/          # 指挥中心 ✅
│   │   ├── knowledge-base/          # 知识库 ✅
│   │   └── app/                     # 应用设置 ✅
│   │
│   ├── services/                     # 服务层（核心）
│   │   ├── backendApiService.ts    # 后端API通信 ✅
│   │   ├── intentClassifier.ts     # 意图识别 ✅
│   │   ├── actionExecutorService.ts # Action执行 ✅
│   │   ├── simpleTodoGenerator.ts  # Todo生成 ✅
│   │   ├── todoExecutionService.ts # Todo执行 ✅
│   │   ├── contextualReasoning.ts  # 上下文推理 ✅
│   │   ├── commandService.ts       # 指令管理 ✅
│   │   ├── settings.ts             # 设置管理 ✅
│   │   ├── knowledgeBase.ts        # 知识库 ✅
│   │   ├── embeddingService.ts     # 向量化 ⚠️
│   │   ├── modelConfig.ts          # 模型配置 ✅
│   │   └── gptImageService.ts      # 图像生成 ✅
│   │
│   └── utils/                        # 工具函数
│       └── thinking.ts              # 思考过程解析
│
├── 📂 shared/                         # 前后端共享
│   ├── action-types.ts              # Action类型定义
│   └── action-library.ts            # Action库定义
│
├── 📂 backend/ (后端代码)
│   ├── services/                     # 服务层
│   │   ├── openai_service.py       # OpenAI集成 ✅
│   │   ├── action_executor_service.py # Action执行 ✅
│   │   ├── event_planning_service.py # 活动策划 ✅
│   │   ├── gpt_image_service.py    # 图像生成 ✅
│   │   └── mock_openai_service.py  # Mock服务 ✅
│   │
│   ├── main.py                       # 应用入口
│   ├── config.py                     # 配置文件
│   ├── requirements.txt              # Python依赖
│   └── run.py                        # 启动脚本
│
├── 📂 config/                         # 配置文件
│   └── 【TOOL】活动构思生图.yml
│
├── 📂 tests/                          # 测试文件
│   ├── test_dify_api.cjs
│   └── test_event_planner.html
│
├── 📦 package.json                    # 前端依赖
└── ⚙️ vite.config.ts                  # Vite配置
\`\`\`

**图例**: ✅ 已完成  ⚠️ 需优化  🚧 开发中

---

## 🏗️ 系统架构

### 三层架构

\`\`\`
┌────────────────────────────────────────┐
│     前端层 (Frontend - React/TS)      │
│  - UI组件                              │
│  - 页面路由                            │
│  - 状态管理                            │
└──────────────┬─────────────────────────┘
               │ HTTP / WebSocket
┌──────────────┴─────────────────────────┐
│     后端层 (Backend - FastAPI)        │
│  - API路由                             │
│  - 业务逻辑                            │
│  - Action执行                          │
└──────────────┬─────────────────────────┘
               │ API调用
┌──────────────┴─────────────────────────┐
│   AI服务层 (OpenAI API)               │
│  - GPT-4 / GPT-4o                      │
│  - DALL-E                              │
└────────────────────────────────────────┘
\`\`\`

### 核心服务

#### 前端服务

| 服务 | 职责 | 状态 |
|-----|------|------|
| `backendApiService` | 后端API通信 | ✅ |
| `intentClassifier` | 意图识别 | ✅ |
| `actionExecutorService` | Action执行 | ✅ |
| `simpleTodoGenerator` | Todo生成 | ✅ |
| `todoExecutionService` | Todo执行 | ✅ |
| `contextualReasoning` | 上下文推理 | ✅ |

#### 后端服务

| 服务 | 职责 | 状态 |
|-----|------|------|
| `openai_service` | OpenAI API封装 | ✅ |
| `action_executor_service` | 统一Action执行 | ✅ |
| `event_planning_service` | 活动策划 | ✅ |
| `gpt_image_service` | 图像生成 | ✅ |

---

## 👨‍💻 开发指南

### 开发模式

1. **前端开发**:
\`\`\`bash
npm run dev
# 支持热重载，修改即刷新
# 访问: http://localhost:5174
\`\`\`

2. **后端开发**:
\`\`\`bash
cd backend
python main.py
# FastAPI自动重载
# API文档: http://localhost:8001/docs
\`\`\`

### 构建生产版本

\`\`\`bash
# 构建前端
npm run build

# 预览构建结果
npm run preview
\`\`\`

### 代码规范

- **TypeScript**: 使用ESLint和Prettier
- **Python**: 遵循PEP 8规范
- **Git提交**: 使用语义化提交信息

### 测试

\`\`\`bash
# 前端类型检查
npm run typecheck

# 后端健康检查
curl http://localhost:8001/health
\`\`\`

---

## 📊 核心功能模块说明

### 1. 意图识别系统 (Intent Classification)

**工作流程**:
\`\`\`
用户输入
  ↓
快速关键词检测 (0ms)
  ↓
高置信度？
  ├─ YES → 直接返回结果
  └─ NO  → LLM精确分类 (200ms)
      ↓
返回意图类型 + 参数
\`\`\`

**4种意图类型**:
- `text_answer`: 直接文本回答
- `tool_call`: 单工具调用
- `workflow`: 多步骤工作流
- `clarify`: 信息补齐

---

### 2. Todo工作流系统

**两个核心服务**:

| 服务 | 职责 | 类比 |
|-----|------|------|
| `simpleTodoGenerator` | 生成执行计划 | 项目经理 |
| `todoExecutionService` | 执行计划 | 执行者 |

**工作流程**:
\`\`\`
用户需求 → Todo生成 → 步骤拆解 → 逐步执行 → 结果汇总
\`\`\`

---

### 3. Action执行系统

**前后端协同**:
\`\`\`
前端: actionExecutorService.ts
  ↓ HTTP Request
后端: action_executor_service.py
  ↓ 执行具体Action
返回结果
\`\`\`

**支持的Action类型**:
- `code_execution`: 代码执行
- `api_call`: API调用
- `llm_task`: LLM任务
- `image_generation`: 图像生成

---

## 🎨 UI设计

### 主题配色

- **主色调**: #4A90E2 (专业蓝)
- **辅助色**: #50C878 (成功绿)
- **警告色**: #FFB84D (橙黄)
- **错误色**: #FF6B6B (警示红)

### 组件库

基于 Material-UI 6.1.7，提供一致的用户体验。

---

## 🔒 安全性

- ✅ API密钥仅存储在后端
- ✅ CORS配置限制来源
- ✅ 数据验证（Pydantic）
- ✅ WebSocket连接安全
- ✅ 代码执行沙箱

---

## 📈 性能优化

- ⚡ Vite快速构建
- ⚡ 代码分割和懒加载（规划中）
- ⚡ 图片缓存策略
- ⚡ localStorage管理
- ⚡ WebSocket长连接

---

## 🐛 常见问题

### 1. 后端连接失败

**问题**: `Failed to fetch` 或 `net::ERR_CONNECTION_REFUSED`

**解决方案**:
\`\`\`bash
# 检查后端是否运行
lsof -i :8001

# 重启后端
cd backend && python main.py
\`\`\`

### 2. OpenAI API错误

**问题**: `401 Unauthorized` 或 `Invalid API key`

**解决方案**:
- 检查 `backend/config.py` 中的API密钥
- 确保API密钥格式正确: `sk-xxxxxxxx...`
- 验证账户余额

### 3. 图片生成失败

**问题**: 图片无法显示或localStorage溢出

**解决方案**:
- 图片已自动缓存在内存
- 使用下载按钮保存到本地
- 清除浏览器缓存

### 4. 前端无法启动

**问题**: `Error: EADDRINUSE`

**解决方案**:
\`\`\`bash
# 查找占用端口的进程
lsof -i :5174

# 杀死进程
kill -9 <PID>
\`\`\`

---

## 🗺️ 路线图

### Version 0.2.0 (当前版本)
- [x] 完成架构重构
- [x] 统一意图分类系统（4种类型）
- [x] 实现所有Action的真实功能
- [x] 完善文档注释
- [x] 清理遗留代码

### Version 0.3.0 (计划中)
- [ ] 更智能的clarify系统（动态表单 + 自然语言）
- [ ] Event Planner拆分为多个Action
- [ ] 上下文压缩机制
- [ ] 添加单元测试
- [ ] 性能优化

### Version 0.4.0 (规划中)
- [ ] 用户认证和多用户支持
- [ ] 活动方案版本管理
- [ ] 导出Word/PDF文档
- [ ] 更多AI模型支持

---

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

---

## 📚 文档

详细文档请查看 `docs/` 目录：

- [系统架构](./docs/ARCHITECTURE.md)
- [架构审查报告](./docs/ARCHITECTURE_REVIEW.md)
- [Services指南](./docs/SERVICES_GUIDE.md)
- [快速开始指南](./docs/QUICK_START.md)

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 👥 团队

**开发者**: Nancy Xu  
**项目地址**: https://github.com/NancyXu12138/launchbox

---

## 📞 联系方式

- **Issues**: [GitHub Issues](https://github.com/NancyXu12138/launchbox/issues)
- **Email**: your.email@example.com

---

<div align="center">

**Made with ❤️ by the LaunchBox Team**

⭐ 如果这个项目对你有帮助，请给我们一个Star！

**当前版本**: v0.2.0 | **最后更新**: 2025-10-17

</div>
