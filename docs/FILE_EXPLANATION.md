# 📚 LaunchBox 项目文件说明

## 📁 项目根目录结构说明

### 重要说明
> **注意**: 项目中没有单独的 `frontend` 文件夹。前端代码直接放在 `src/` 目录下，这是单体前端项目的标准做法。

---

## 📂 主要目录

### `/src/` - 前端源代码（这就是前端代码）
```
src/
├── components/          # 通用UI组件
├── modules/            # 功能模块（聊天、活动策划等）
├── services/           # 服务层（API调用、业务逻辑）
├── theme/              # 主题配置
├── utils/              # 工具函数
├── main.tsx            # 前端入口文件
└── vite-env.d.ts       # Vite类型定义
```

### `/backend/` - 后端源代码
```
backend/
├── services/           # 后端服务（OpenAI、活动策划等）
├── main.py            # 后端入口文件
├── config.py          # 配置文件
└── requirements.txt   # Python依赖列表
```

### `/docs/` - 项目文档
```
docs/
├── PROJECT_STRUCTURE.md    # 项目结构设计
├── OPTIMIZATION_SUMMARY.md # 优化总结
└── FILE_EXPLANATION.md     # 本文件
```

### `/scripts/` - 开发脚本
```
scripts/
└── *.py               # 临时开发脚本（已整理）
```

### `/public/` - 静态资源
```
public/
└── logo.svg           # 网站Logo
```

### `/node_modules/` - 前端依赖包（自动生成，不需关心）

---

## 📄 配置文件详解

### 前端配置文件

#### 1. `package.json` ⭐ **重要**
**用途**: 前端项目配置和依赖管理
```json
{
  "name": "gameagent",           // 项目名称
  "version": "0.0.0",            // 版本号
  "scripts": {                   // 运行脚本
    "dev": "vite",               // 启动开发服务器
    "build": "tsc && vite build" // 构建生产版本
  },
  "dependencies": {              // 项目依赖
    "react": "^18.3.1",         // React框架
    "@mui/material": "^6.1.7"   // UI组件库
    // ... 其他依赖
  }
}
```

#### 2. `package-lock.json`
**用途**: 锁定依赖版本，确保团队使用相同版本
**说明**: 自动生成，不需要手动修改

#### 3. `tsconfig.json` ⭐ **重要**
**用途**: TypeScript编译配置
```json
{
  "compilerOptions": {
    "target": "ES2020",        // 编译目标
    "module": "ESNext",        // 模块系统
    "jsx": "react-jsx"         // React JSX支持
    // ... 其他编译选项
  }
}
```

#### 4. `tsconfig.node.json`
**用途**: Node.js环境的TypeScript配置（用于Vite配置文件）

#### 5. `tsconfig.tsbuildinfo`
**用途**: TypeScript增量编译信息（自动生成）

#### 6. `vite.config.ts` ⭐ **重要**
**用途**: Vite构建工具配置
```typescript
export default defineConfig({
  server: {
    port: 5174,              // 开发服务器端口
    proxy: {                 // API代理配置
      '/api': 'http://localhost:8001'
    }
  }
})
```

#### 7. `vite.config.d.ts`
**用途**: Vite配置的类型定义（自动生成）

#### 8. `vite.config.js`
**用途**: Vite配置的JavaScript版本（如果存在）

---

## 📄 文档文件

#### 1. `README.md` ⭐ **最重要**
**用途**: 项目主文档
- 项目介绍
- 快速开始指南
- 功能说明
- 技术栈

#### 2. `INTEGRATION_SUMMARY.md`
**用途**: 集成开发总结文档

#### 3. `活动策划demo.md`
**用途**: 活动策划功能的演示文档

---

## 📄 其他文件

#### 1. `index.html` ⭐ **重要**
**用途**: 前端HTML入口文件
```html
<!DOCTYPE html>
<html>
  <head>
    <title>LaunchBox</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### 2. `dev.log`
**用途**: 开发日志（自动生成）

#### 3. `test_*.html` / `test_*.cjs`
**用途**: 测试文件，用于调试特定功能

#### 4. `【TOOL】活动构思生图.yml`
**用途**: 工具配置文件（可能是外部工具的配置）

#### 5. `.gitignore` (如果存在)
**用途**: Git忽略文件配置，指定哪些文件不提交到版本控制

---

## 🔍 文件后缀说明

### `.ts` - TypeScript文件
- **用途**: 带类型的JavaScript代码
- **优点**: 类型安全，减少错误
- **示例**: `vite.config.ts`, `actionExecutorService.ts`

### `.tsx` - TypeScript + JSX文件
- **用途**: React组件文件
- **示例**: `App.tsx`, `ChatPage.tsx`

### `.json` - JSON配置文件
- **用途**: 结构化的配置数据
- **示例**: `package.json`, `tsconfig.json`

### `.md` - Markdown文档
- **用途**: 文档和说明
- **示例**: `README.md`, `PROJECT_STRUCTURE.md`

### `.py` - Python文件
- **用途**: 后端代码
- **示例**: `main.py`, `event_planning_service.py`

### `.log` - 日志文件
- **用途**: 记录运行日志（自动生成）

### `.html` - HTML文件
- **用途**: 网页文件
- **示例**: `index.html`

---

## 🎯 哪些文件需要关注？

### ⭐ 高优先级（经常修改）
- `src/` 下的所有 `.tsx` 和 `.ts` 文件 - **前端业务代码**
- `backend/` 下的 `.py` 文件 - **后端业务代码**
- `README.md` - **项目文档**

### 🔧 中优先级（偶尔修改）
- `package.json` - 添加新依赖时修改
- `vite.config.ts` - 修改构建配置时
- `backend/config.py` - 修改API配置时

### 📦 低优先级（基本不动）
- `tsconfig.json` - TypeScript配置（通常不变）
- `package-lock.json` - 自动生成
- `*.tsbuildinfo` - 自动生成
- `*.log` - 自动生成

---

## 💡 快速定位指南

### 我想修改前端界面
→ 查看 `src/modules/` 或 `src/components/`

### 我想修改后端逻辑
→ 查看 `backend/services/`

### 我想添加新的npm包
→ 修改 `package.json`，然后运行 `npm install`

### 我想修改API地址
→ 修改 `backend/config.py`

### 我想了解项目功能
→ 查看 `README.md`

### 我想修改开发服务器端口
→ 修改 `vite.config.ts`

---

## 🚫 不要修改的文件

以下文件是自动生成的，**不要手动修改**：
- `node_modules/` 下的所有文件
- `package-lock.json`
- `tsconfig.tsbuildinfo`
- `tsconfig.node.tsbuildinfo`
- `*.log` 文件
- `backend/venv/` 下的所有文件

---

## 📝 总结

### 核心文件结构
```
GameAgent/
├── src/                   # 前端代码（这就是frontend！）
│   ├── modules/          # 功能模块
│   ├── services/         # 服务层
│   └── main.tsx          # 前端入口
├── backend/              # 后端代码
│   ├── services/         # 后端服务
│   └── main.py           # 后端入口
├── package.json          # 前端依赖配置
├── tsconfig.json         # TypeScript配置
├── vite.config.ts        # 构建工具配置
├── index.html            # HTML入口
└── README.md             # 项目文档
```

### 运行命令
```bash
# 前端开发
npm run dev

# 后端开发
cd backend && python main.py

# 安装前端依赖
npm install

# 安装后端依赖
pip install -r backend/requirements.txt
```

---

如有任何疑问，请参考 `README.md` 或提出Issue！

