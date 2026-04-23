# Chrome 标签页统一管理插件 技术方案文档

## 1. 文档目标

本文档用于定义 Chrome 标签页统一管理插件的技术实现方案，覆盖整体架构、模块划分、数据模型、核心流程、权限设计和开发建议，作为研发实现依据。

## 2. 技术目标

- 基于 Chrome Extension Manifest V3 实现
- 支持当前窗口与全部窗口标签页统一读取和管理
- 支持自动分类、手动分类、编辑、打开、关闭等核心能力
- 插件内数据本地存储，具备可扩展性
- 保持架构清晰，便于后续加入 AI 分类、同步等能力

## 3. 技术选型建议

## 3.1 基础技术栈

- 插件规范：Manifest V3
- 前端框架：React + TypeScript
- 构建工具：Vite
- 状态管理：Zustand 或 Redux Toolkit
- UI 方案：原生 CSS Modules / Tailwind 二选一
- 本地存储：`chrome.storage.local`
- 浏览器能力：`chrome.tabs`、`chrome.windows`、`chrome.storage`、`chrome.runtime`

## 3.2 选型理由

- React + TypeScript 适合复杂交互面板开发
- Vite 启动快，适合插件开发体验
- `chrome.storage.local` 满足 MVP 数据持久化需求
- Zustand 实现轻量，适合插件状态同步场景

## 4. 总体架构

## 4.1 模块组成

插件建议拆分为以下部分：

1. `Popup UI`
2. `Manager Page UI`
3. `Background Service Worker`
4. `Storage Layer`
5. `Classification Engine`
6. `Tab Control Service`

## 4.2 架构职责

### Popup UI

- 提供轻量查看和快捷操作
- 展示当前窗口标签页与分类摘要
- 触发搜索、关闭、重新分类

### Manager Page UI

- 提供完整管理能力
- 支持批量操作、分类维护、详情编辑

### Background Service Worker

- 负责监听标签页变化
- 负责统一调度分类逻辑与存储写入
- 作为 UI 与浏览器 API 的中介层

### Storage Layer

- 持久化分类数据
- 持久化标签页元数据
- 持久化用户偏好设置

### Classification Engine

- 负责自动分类规则执行
- 对外提供分类结果和重新分类能力

### Tab Control Service

- 封装标签页打开、激活、关闭、批量关闭等操作

## 5. 建议目录结构

```text
src/
  background/
    index.ts
    tab-listeners.ts
  popup/
    main.tsx
    PopupApp.tsx
  manager/
    main.tsx
    ManagerApp.tsx
  components/
    tabs/
    category/
    common/
  services/
    tab-service.ts
    category-service.ts
    classification-service.ts
    storage-service.ts
  store/
    tab-store.ts
    category-store.ts
    ui-store.ts
  types/
    tab.ts
    category.ts
    message.ts
  utils/
    url.ts
    keyword.ts
    logger.ts
manifest.json
```

## 6. Manifest 设计

## 6.1 建议配置

```json
{
  "manifest_version": 3,
  "name": "Tab Manager Helper",
  "version": "0.1.0",
  "action": {
    "default_popup": "popup.html"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "options_page": "manager.html",
  "permissions": [
    "tabs",
    "storage"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

## 6.2 权限说明

- `tabs`
  用于读取标签页标题、URL、激活状态，并执行打开/关闭操作

- `storage`
  用于保存分类、自定义标题、备注、偏好设置

- `host_permissions`
  MVP 阶段如仅做标签页管理，可以保留 `<all_urls>` 以获取完整 URL 信息；如果后续权限敏感，可进一步收缩

## 7. 数据模型设计

## 7.1 TabEntity

```ts
type TabEntity = {
  tabId: number;
  windowId: number;
  title: string;
  url: string;
  domain: string;
  favicon?: string;
  active: boolean;
  pinned: boolean;
  categoryId?: string;
  customTitle?: string;
  note?: string;
  status: "open" | "closed" | "saved";
  createdAt: number;
  updatedAt: number;
};
```

说明：

- `title` 为浏览器原始标题
- `customTitle` 为插件内覆盖展示标题
- `status` 用于后续扩展已关闭/已保存能力

## 7.2 CategoryEntity

```ts
type CategoryEntity = {
  categoryId: string;
  name: string;
  color?: string;
  sourceType: "auto" | "manual" | "system";
  ruleType?: "domain" | "keyword" | "semantic";
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};
```

## 7.3 UserPreference

```ts
type UserPreference = {
  defaultView: "list" | "group";
  autoClassifyOnOpen: boolean;
  confirmBeforeBulkClose: boolean;
  showCurrentWindowOnly: boolean;
};
```

## 7.4 Storage Schema 建议

```ts
type StorageSchema = {
  tabsMeta: Record<string, Partial<TabEntity>>;
  categories: CategoryEntity[];
  preferences: UserPreference;
};
```

说明：

- `tabsMeta` 以 `tabId` 或 `tabId_windowId` 为 key 存储扩展字段
- 浏览器原生标签状态仍以 `chrome.tabs.query` 实时结果为准

## 8. 核心模块设计

## 8.1 标签读取模块

职责：

- 读取当前窗口或全部窗口标签页
- 合并浏览器原生标签信息与本地元数据
- 输出给 UI 层使用

建议接口：

```ts
async function getTabs(scope: "currentWindow" | "allWindows"): Promise<TabEntity[]>
```

实现要点：

- 使用 `chrome.tabs.query`
- 通过 URL 解析获取 `domain`
- 从 `chrome.storage.local` 中合并 `customTitle`、`note`、`categoryId`

## 8.2 分类引擎

职责：

- 根据规则为标签页分配分类
- 支持重新分类
- 支持保留用户手动覆盖结果

建议接口：

```ts
function classifyTabs(tabs: TabEntity[], categories: CategoryEntity[]): TabEntity[]
```

MVP 分类规则建议：

1. 优先使用用户手动指定分类
2. 其次按域名匹配已有分类
3. 再按标题关键词分类
4. 未命中则归入 `待整理`

关键词示例：

- `docs`, `notion`, `jira`, `figma` => 工作
- `course`, `learn`, `mdn`, `wiki` => 学习
- `youtube`, `bilibili`, `netflix` => 娱乐
- `amazon`, `taobao`, `jd` => 购物

## 8.3 分类管理模块

职责：

- 创建分类
- 更新分类
- 删除分类
- 管理分类排序

注意：

- 删除分类时，需要处理关联标签页
- 建议删除后将原分类标签页置为 `未分类` 或 `待整理`

## 8.4 标签控制模块

职责：

- 激活指定标签页
- 关闭单个标签页
- 批量关闭多个标签页

建议接口：

```ts
async function activateTab(tabId: number): Promise<void>
async function closeTab(tabId: number): Promise<void>
async function closeTabs(tabIds: number[]): Promise<void>
```

## 8.5 编辑模块

职责：

- 编辑自定义标题
- 编辑备注
- 修改分类归属

注意：

- 编辑信息仅保存在插件本地
- 当标签页关闭后，可根据后续需求决定是否保留其元数据

## 9. 页面通信设计

## 9.1 通信方式

建议采用：

- UI 直接调用 `chrome.storage.local`
- UI 通过 `chrome.runtime.sendMessage` 请求后台执行高权限操作

## 9.2 消息类型示例

```ts
type RuntimeMessage =
  | { type: "GET_TABS"; scope: "currentWindow" | "allWindows" }
  | { type: "ACTIVATE_TAB"; tabId: number }
  | { type: "CLOSE_TAB"; tabId: number }
  | { type: "CLOSE_TABS"; tabIds: number[] }
  | { type: "RECLASSIFY_TABS" }
```

原则：

- 读操作可适度直连
- 涉及标签操作和监听管理的动作尽量走 background

## 10. 事件监听设计

Background 监听以下事件：

- `chrome.tabs.onCreated`
- `chrome.tabs.onUpdated`
- `chrome.tabs.onRemoved`
- `chrome.tabs.onActivated`

监听目的：

- 新标签打开时自动分类
- 页面标题变化时同步更新展示
- 标签页关闭后刷新缓存
- 激活状态变化时更新 UI

## 11. 核心流程设计

## 11.1 插件启动流程

1. Popup 或 Manager Page 初始化
2. 读取 `preferences`
3. 请求当前标签页数据
4. 合并本地元数据
5. 执行自动分类
6. 渲染 UI

## 11.2 新标签自动分类流程

1. 监听到 `tabs.onCreated`
2. 拉取新标签详情
3. 执行规则分类
4. 写入 `tabsMeta`
5. 通知 UI 刷新

## 11.3 手动分类流程

1. 用户选择标签页并指定分类
2. UI 发送更新请求
3. 写入本地 `categoryId`
4. 标记该标签页为手动覆盖
5. 刷新列表状态

## 11.4 批量关闭流程

1. UI 传入多个 `tabId`
2. Background 调用 `chrome.tabs.remove`
3. 操作完成后更新缓存
4. 返回结果给 UI

## 12. 状态管理建议

建议拆分为三个 store：

- `tabStore`
  管理标签列表、选择状态、搜索条件

- `categoryStore`
  管理分类列表、当前选中分类、分类增删改

- `uiStore`
  管理抽屉、弹层、加载状态、toast 状态

## 13. 存储策略

## 13.1 存储内容

存储到 `chrome.storage.local`：

- 分类列表
- 标签页元信息
- 用户配置

不建议存储：

- 所有原始标签页完整快照
- 高频变化且可实时获取的临时字段

## 13.2 清理策略

建议加入定期清理逻辑：

- 已关闭且长时间未恢复的标签元信息可清理
- 无引用分类可提示清理

## 14. 性能设计

## 14.1 性能风险

- 标签页数量大时列表渲染卡顿
- 高频监听导致重复写入存储
- 每次打开 Popup 都做全量分类可能有延迟

## 14.2 优化建议

- 标签列表做分页或虚拟滚动
- 对分类和存储写入做 debounce
- 区分首次分类和增量分类
- Popup 仅读取当前窗口，Manager Page 再加载全量数据

## 15. 安全与隐私

## 15.1 原则

- 默认仅本地存储
- 不上传标签页数据到远端
- 若未来引入 AI 分类，必须显式告知用户

## 15.2 说明

用户需要明确知道：

- 插件会读取标签页标题和 URL
- 自定义标题与备注不会修改网页本身
- 本地数据可删除

## 16. 测试方案建议

## 16.1 单元测试

覆盖：

- URL 解析
- 分类规则命中
- 分类优先级
- 存储数据读写转换

## 16.2 集成测试

覆盖：

- 标签读取与分类联动
- 手动分类覆盖自动分类
- 批量关闭流程
- 编辑信息持久化

## 16.3 手工验证清单

- 安装插件后 Popup 能正常加载
- 当前窗口标签页展示正确
- 自动分类结果符合预期
- 手动修改分类后刷新仍保留
- 关闭标签页后列表正确更新
- 编辑备注和自定义名称后再次打开仍存在

## 17. 版本规划建议

## 17.1 V1

- Popup
- Manager Page
- 自动分类规则版
- 手动分类
- 单个/批量关闭
- 编辑自定义标题与备注

## 17.2 V1.1

- 拖拽分类
- 最近关闭恢复
- 分类排序
- 搜索增强

## 17.3 V2

- AI 智能分类
- 标签组保存与恢复
- 多设备同步

## 18. 风险与技术注意事项

- Chrome 标签页原始标题不可被插件永久改写，只能做插件内映射展示
- Service Worker 生命周期有限，状态不能只放内存
- `chrome.storage.local` 适合 MVP，但复杂历史记录功能可能需要 IndexedDB
- 批量关闭和自动分类必须兼顾性能与幂等性

## 19. 开发建议顺序

1. 搭建 Manifest V3 + React + Vite 基础工程
2. 接入标签页读取和 Popup 展示
3. 实现分类数据模型和本地存储
4. 实现规则自动分类
5. 实现 Manager Page 和批量操作
6. 实现编辑能力和设置项
7. 补测试和打包发布流程
