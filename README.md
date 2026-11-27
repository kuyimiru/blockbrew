# 🧊 BlockBrew — 3D/2D Minecraft Skin 编辑器

一个功能完整的在线 Minecraft 皮肤编辑工具，提供 **3D 模型实时预览** 与 **2D 纹理绘制联动** 的编辑体验，配备完整的用户系统和云端存储。

## 项目技术栈概览

### 前端框架与工具
- **React 18.x**：使用 Hooks（useState / useEffect / useRef / useCallback）管理组件状态与生命周期
- **Vite 5.x**：作为构建工具和开发服务器，提供 HMR 热更新和快速冷启动
- **React Router v6**：用于页面路由管理，支持声明式导航和路由参数

### 3D 渲染与交互
- **skinview3d**：核心 3D 皮肤渲染库，负责 Minecraft 皮肤模型（Steve/Alex）的加载、渲染与交互控制。内部封装了模型构建、纹理映射和动画循环
- **three.js**：底层 3D 引擎（通过 skinview3d 间接依赖，同时被项目的独立 ThreeViewport 直接使用），提供 WebGL 渲染、场景图、材质和光照系统
- **OrbitControls**：提供视角控制能力，支持旋转、缩放和平移操作。编辑模式下默认禁用旋转，按住 Alt 键时启用

### 2D 绘图与纹理处理
- **HTML5 Canvas API**：用于 2D 画布渲染和纹理数据操作，支持像素级读写、缩放和平移
- **离屏 Canvas（OffscreenCanvas / 共享纹理源）**：作为 3D 和 2D 视图的唯一纹理数据源。所有绘画操作直接修改该离屏 Canvas，3D 模型通过 CanvasTexture 引用同一数据，2D 画布通过 drawImage 零拷贝渲染，实现双向实时同步

### 状态管理
- **Zustand**：轻量级全局状态管理，管理皮肤纹理数据（SkinData）、编辑器工具状态（当前工具、笔刷大小、颜色、对称模式）、用户认证状态和 UI 状态。通过 store 订阅机制实现跨组件的纹理版本同步
- **React 组件状态**：useState / useRef 管理组件局部状态和 DOM 引用

### UI 与样式
- 原生 CSS，采用深色主题配色方案（黑、灰、红、金）
- 自定义组件库，无第三方 UI 框架依赖
- 组件包括颜色面板（HSV 色相环 + 饱和度/亮度三角）、工具栏、图层面板、图像调整面板等

### 后端
- **Express**：Node.js HTTP 框架，提供 RESTful API
- **SQLite (better-sqlite3)**：嵌入式数据库，零配置，存储用户和皮肤数据
- **JWT (jsonwebtoken) + bcryptjs**：用户认证和密码加密

## 核心功能模块说明

### 3D 皮肤查看器
基于 skinview3d 的 SkinViewer 和 PlayerObject 实现。初始化时创建 SkinViewer 实例，传入共享纹理源 Canvas 作为皮肤纹理。支持 Steve（default）和 Alex（slim）两种模型类型切换。通过 playerObject.skin 访问各身体部位（head / body / rightArm / leftArm / rightLeg / leftLeg），控制内层和外层的独立可见性。OrbitControls 提供旋转、缩放和平移视角控制。

### 2D 纹理编辑器
使用 Canvas 2D API 实现像素级编辑。Canvas2DRenderer 负责渲染 64×64 纹理的展开视图，支持棋盘格背景、像素网格线、部位轮廓标注、外层区域高亮和隐藏部位遮罩等辅助显示。支持鼠标滚轮缩放和拖拽平移，通过 DPI 感知的坐标转换实现精确的屏幕坐标到纹理像素坐标的映射。

### 绘画工具系统
工具系统基于策略模式设计，BaseTool 提供统一的生命周期接口（onPointerDown / onPointerMove / onPointerUp），各工具子类实现具体绘制逻辑。所有工具通过修改共享离屏 Canvas 的像素数据实现绘画。工具包括：
- **铅笔**：1px 单点绘制，Bresenham 算法画线保证连续笔划无断点
- **笔刷**：支持 1×1 至 5×5 不同大小的方形笔刷
- **橡皮擦**：根据当前编辑图层执行不同逻辑——内层擦除恢复为灰白基底色（#C8C8C8），外层擦除设为完全透明（alpha=0）
- **取色器**：从共享纹理源读取鼠标位置像素的十六进制颜色值，同步更新颜色面板的 HSV 色相环和十六进制输入框
- **油漆桶**：洪泛填充（Flood Fill）连通区域，支持对称填充

### 对称绘制
SymmetryManager 根据对称模式（关闭 / 水平 / 垂直 / 双轴）计算镜像像素位置，工具基类的 applyWithSymmetry 方法自动将单次绘制操作扩展到所有对称位置。

### 图层管理
支持内层（底层皮肤）和外层（帽子/外套）分别编辑。通过 editOuterLayer 状态标记切换当前编辑目标。PIXEL_MAP 反向查找表为 64×64 的每个像素标注所属部位、面和图层，2D 编辑器据此限制绘画操作仅在当前图层的有效像素区域。

### 实时同步机制
3D 与 2D 视图通过共享离屏 Canvas（TextureSource）实现双向实时同步。当任一视图发生绘画操作时：SkinData 的 setPixel 方法同时更新内部 Uint8Array 和共享 Canvas；markChanged 触发 Zustand store 的 _textureVersion 递增；3D 视图的 store 订阅将共享 Canvas 绘制到 skinview3d 的内部纹理 Canvas 并标记 needsUpdate；2D 视图的渲染循环检测版本变化后调用 renderFromCanvas 零拷贝渲染。

### 撤销与重做
基于快照模式实现。每次笔划开始前调用 pushSnapshot 保存当前 SkinData 的 Uint8Array 副本到 undoStack，最多保留 30 步历史。撤销时从 undoStack 弹出快照恢复到 SkinData，同时将当前状态推入 redoStack。

### 用户认证
基于 JWT 的前端认证系统。支持邮箱+用户名+密码注册和登录，Token 有效期 7 天，存储于 localStorage。支持试用模式——未登录用户可正常使用编辑功能，但部分高级功能（如 256×256 画布）受限。

### 图像调整
提供色相（-180° ~ 180°）、饱和度（0 ~ 200%）、亮度（0 ~ 200%）、色温和图层透明度的实时预览调整。调整前保存快照，支持应用或取消操作。

## 项目依赖列表

### 生产依赖

| 依赖 | 用途 |
|------|------|
| **react** (^18.3.1) | 前端 UI 框架，提供组件化开发和 Hooks 状态管理 |
| **react-dom** (^18.3.1) | React 的 DOM 渲染器，负责将 React 组件挂载到浏览器 |
| **react-router-dom** (^6.26.0) | React 路由库，管理页面导航和 URL 参数 |
| **skinview3d** (^3.4.2) | 核心 3D Minecraft 皮肤渲染引擎，封装模型构建、纹理映射和动画 |
| **three** (^0.168.0) | 底层 WebGL 3D 引擎，提供渲染器、场景图、几何体、材质和光照 |
| **@react-three/fiber** (^8.17.0) | React 声明式 Three.js 渲染器（用于部分 3D 场景组件） |
| **@react-three/drei** (^9.117.0) | @react-three/fiber 的辅助工具集，提供预置控制器和几何体 |
| **zustand** (^4.5.0) | 轻量级全局状态管理库，管理皮肤数据、编辑器状态和用户信息 |

### 后端依赖

| 依赖 | 用途 |
|------|------|
| **express** | Node.js HTTP 服务器框架，提供 RESTful API |
| **better-sqlite3** | 同步 SQLite 数据库驱动，零配置嵌入式存储 |
| **jsonwebtoken** | JWT 令牌签发和验证，用于用户认证 |
| **bcryptjs** | 密码哈希加密，保护用户密码安全 |
| **cors** | 跨域资源共享中间件 |
| **multer** | 文件上传处理中间件 |

### 开发依赖

| 依赖 | 用途 |
|------|------|
| **vite** (^5.4.0) | 前端构建工具和开发服务器 |
| **@vitejs/plugin-react** (^4.3.0) | Vite 的 React 插件，提供 JSX 转换和 HMR |
| **nodemon** | 后端开发热重载工具 |

## 项目结构说明

```
myskinweb/
├── client/                              # React 前端项目
│   ├── src/
│   │   ├── engine/                      # 核心引擎层（纯 JS，无 React 依赖）
│   │   │   ├── skin/                    # 皮肤数据模型和 UV 映射
│   │   │   │   ├── SkinData.js          # 皮肤像素数据管理（单一数据源）
│   │   │   │   ├── UVMap.js             # Minecraft 皮肤 UV 坐标映射表
│   │   │   │   ├── SkinImporter.js      # PNG 皮肤文件导入解析
│   │   │   │   └── SkinExporter.js      # 皮肤导出为 PNG 文件
│   │   │   ├── canvas/                  # 2D 渲染和纹理源
│   │   │   │   ├── Canvas2DRenderer.js  # 2D 纹理视图渲染器（像素网格/部位轮廓）
│   │   │   │   └── TextureSource.js     # 共享离屏 Canvas 单例（3D/2D 统一数据源）
│   │   │   ├── tools/                   # 绘画工具系统
│   │   │   │   ├── BaseTool.js          # 工具基类（生命周期接口）
│   │   │   │   ├── PencilTool.js        # 铅笔工具（Bresenham 画线）
│   │   │   │   ├── BrushTool.js         # 笔刷工具（可变大小）
│   │   │   │   ├── EraserTool.js        # 橡皮擦工具（内层/外层层感知）
│   │   │   │   ├── FillTool.js          # 油漆桶工具（洪泛填充 + 对称）
│   │   │   │   ├── EyedropperTool.js    # 取色器工具
│   │   │   │   └── SymmetryManager.js   # 对称绘制管理器
│   │   │   └── adjustments/             # 图像调整（色相/饱和度/亮度/色温）
│   │   ├── components/                  # React UI 组件
│   │   │   ├── editor/                  # 编辑器核心组件
│   │   │   │   ├── EditorPanel.jsx      # 主编辑器面板（3D/2D 视图切换布局）
│   │   │   │   ├── SkinViewerMinimal.jsx # 3D 交互式皮肤查看器（绘画/旋转）
│   │   │   │   ├── TwoDViewport.jsx     # 2D 纹理编辑视口
│   │   │   │   ├── ThreeViewport.jsx    # 独立 Three.js 3D 视口（硬编码 UV）
│   │   │   │   ├── SkinViewer3D.jsx     # skinview3d 备用集成组件
│   │   │   │   └── SkinViewerIframe.jsx # iframe 隔离 skinview3d 集成
│   │   │   ├── toolbar/                 # 工具栏组件
│   │   │   │   └── ToolBar.jsx          # 工具选择、笔刷大小、对称模式
│   │   │   ├── color/                   # 颜色面板组件
│   │   │   │   ├── ColorPanel.jsx       # 颜色面板容器
│   │   │   │   ├── ColorWheel.jsx       # HSV 色相环 + 饱和度/亮度三角
│   │   │   │   └── ColorSwatches.jsx    # 预设色板（Minecraft 经典色 / 肤色）
│   │   │   ├── layers/                  # 图层面板（内层/外层切换）
│   │   │   ├── adjustments/             # 图像调整面板
│   │   │   ├── auth/                    # 登录/注册表单组件
│   │   │   ├── file/                    # 文件菜单（导入/导出/新建）
│   │   │   ├── pages/                   # 页面级路由组件
│   │   │   │   ├── EditorPage.jsx       # 编辑器页面
│   │   │   │   └── HomePage.jsx         # 首页
│   │   │   └── common/                  # 通用 UI 组件
│   │   │       ├── Modal.jsx            # 模态对话框
│   │   │       ├── Toast.jsx            # 消息提示组件
│   │   │       ├── Icon.jsx             # SVG 图标组件
│   │   │       └── ErrorBoundary.jsx    # React 错误边界
│   │   ├── store/                       # Zustand 状态管理
│   │   │   ├── useSkinStore.js          # 皮肤数据状态（纹理、模型类型、撤销/重做）
│   │   │   ├── useEditorStore.js        # 编辑器工具状态（工具、颜色、对称）
│   │   │   ├── useUserStore.js          # 用户认证状态（登录、Token）
│   │   │   └── useUIStore.js            # UI 状态（缩放、弹窗、侧栏）
│   │   ├── hooks/                       # 自定义 React Hooks
│   │   ├── utils/                       # 工具函数
│   │   │   └── colors.js               # 颜色工具（RGB/HSV/Hex 转换、色相环绘制）
│   │   └── styles/                      # 全局 CSS 样式文件
│   └── index.html                       # Vite 入口 HTML
├── server/                              # Express 后端
│   └── src/
│       ├── index.js                     # 服务器入口和中间件配置
│       ├── db.js                        # SQLite 数据库初始化和表创建
│       ├── middleware/
│       │   └── auth.js                  # JWT 认证中间件
│       ├── routes/
│       │   ├── auth.js                  # 注册/登录路由
│       │   └── skins.js                 # 皮肤 CRUD 路由
│       └── utils/
│           └── hash.js                  # bcrypt 密码哈希工具
├── package.json                         # 根 monorepo 配置
└── README.md
```

### 关键目录说明

- **`client/src/engine/`**：核心引擎层，完全独立于 React，可在 Node.js 或 Web Worker 中运行。包含皮肤数据模型、UV 映射表和所有绘画工具
- **`client/src/components/editor/`**：编辑器核心 UI 组件。SkinViewerMinimal 是基于 skinview3d 的交互式 3D 绘画工具；TwoDViewport 提供 2D 纹理展开视图的像素级编辑
- **`client/src/store/`**：Zustand 状态管理模块。useSkinStore 管理皮肤数据的单一数据源（SkinData 实例），通过 _textureVersion 版本号驱动所有视图的增量更新
- **`client/src/engine/canvas/TextureSource.js`**：全局共享离屏 Canvas 单例，是 3D 和 2D 视图的统一纹理数据源。SkinData 的 _ctx 绑定到此 Canvas，所有 setPixel 操作直接命中，无需额外的数据同步步骤
- **`server/`**：Express 后端，提供用户认证和皮肤持久化 API。SQLite 数据库文件存储在 `server/data/` 目录

## 功能特性

### 🎨 核心编辑
- **3D 实时预览**：Three.js 渲染 Steve/Alex 模型，支持旋转、缩放
- **2D UV 纹理视图**：实时显示 64×64 皮肤纹理，支持缩放和像素网格
- **双向同步**：在 3D 上绘制同步到 2D，反之亦然（延迟 < 100ms）
- **双层结构**：支持内层（底层皮肤）和外层（帽子/外套）编辑

### 🛠 绘图工具
- **铅笔** (B)：1px 单点绘制，Bresenham 画线
- **笔刷** (N)：支持 1×1、2×2、3×3、5×5 大小
- **橡皮擦** (E)：内层擦除恢复灰白基底色，外层擦除设为透明
- **取色器** (I)：点击吸取颜色，同步显示坐标和十六进制值
- **油漆桶** (G)：洪泛填充连通区域
- **对称绘制**：关闭 / 水平对称 / 垂直对称 / 双轴对称

### 🎯 颜色系统
- HSV 色相环 + 饱和度/亮度选择器
- Minecraft 经典 16 色预设
- 肤色和常用色扩展调色板
- 当前颜色/上一个颜色快速切换

### 🖼 图像调整
- 色相（-180° ~ 180°）
- 饱和度（0 ~ 200%）
- 亮度（0 ~ 200%）
- 色温（-100 ~ 100）
- 图层透明度（0% ~ 100%）
- 实时预览 + 应用/取消操作

### 💾 文件操作
- **导入**：支持 .png 格式（64×64、64×32、128×128）
- **导出**：PNG 格式，可选 64×64 或 128×128
- **新建**：创建空白皮肤
- **重置**：恢复到默认状态（带确认弹窗）

### 👤 用户系统
- 邮箱 + 用户名 + 密码注册/登录
- JWT Token 认证（7 天有效期）
- 云端皮肤存储和同步（预计后续版本中提出）
- 「我的作品」面板浏览和管理历史作品

### ⚡ 其他功能
- **撤销/重做**：Ctrl+Z / Ctrl+Y，最多 30 步
- **快捷键**：B/N/E/I/G 切换工具，[/] 调整笔刷大小
- **自动保存**：每 10 秒自动保存到 localStorage
- **统计信息**：显示像素数、颜色数、模型类型等
- **响应式布局**：支持 PC、平板、手机

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + Vite |
| 3D 引擎 | skinview3d + Three.js (r168) |
| 2D 画布 | Canvas 2D API（离屏 Canvas 共享纹理源） |
| 状态管理 | Zustand |
| 后端框架 | Express |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT + bcryptjs |

## 快速启动

### 环境要求
- Node.js 18+
- npm 9+

### 安装依赖
```bash
# 安装所有依赖（根目录 + client + server）
npm run install:all

# 或者手动安装
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 启动开发服务器
```bash
# 同时启动前端和后端
npm run dev

# 或分别启动
npm run dev:client   # 前端 → http://localhost:5173
npm run dev:server   # 后端 → http://localhost:3001
```

### 环境变量
在 `server/.env` 中配置：
```env
PORT=3001
JWT_SECRET=your-secret-key
DB_PATH=./data/blockbrew.db
```

## API 文档

Base URL: `http://localhost:3001/api`

### 认证

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| POST | `/api/auth/register` | 注册 | `{ username, email, password }` |
| POST | `/api/auth/login` | 登录 | `{ email, password }` |
| GET | `/api/auth/me` | 当前用户 | Header: `Authorization: Bearer <token>` |

### 皮肤（需认证）

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| GET | `/api/skins` | 用户皮肤列表 | Query: `?page=1&limit=50` |
| GET | `/api/skins/:id` | 皮肤详情（含像素数据） | - |
| POST | `/api/skins` | 保存皮肤 | `{ name, modelType, innerData, outerData }` |
| PUT | `/api/skins/:id` | 更新皮肤 | 任意字段可选 |
| DELETE | `/api/skins/:id` | 删除皮肤 | - |

### 画廊（公开）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/gallery` | 公开皮肤列表 `?page=1&limit=20` |

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Z` | 撤销 |
| `Ctrl+Y` / `Ctrl+Shift+Z` | 重做 |
| `B` | 铅笔工具 |
| `N` | 笔刷工具 |
| `E` | 橡皮擦 |
| `I` | 取色器 |
| `G` | 油漆桶 |
| `[` / `]` | 调整笔刷大小 |

## 配色方案

| 用途 | 色值 |
|------|------|
| 主背景 | `#0B0B0B` |
| 次级背景 | `#161616` |
| 面板 | `#1E1E1E` |
| 边框 | `#2C2C2C` |
| 强调色 | `#DC2626` |
| 点缀色 | `#D4A843` |
| 文本主色 | `#F1F1F1` |
| 文本次要 | `#9CA3AF` |

---

© 2026 BlockBrew — 方块酿造工坊
