# Tab Manager Helper

Chrome 标签页统一管理插件项目骨架，包含：

- Popup 快速管理界面
- Manager Page 完整管理页
- Background Service Worker
- 自动分类基础规则
- 手动分类、自定义标题、备注、批量关闭与恢复的基础代码结构

## 当前状态

这是 MVP 第一版工程骨架，重点是把结构搭起来，便于后续继续迭代功能和样式。

已包含：

- Manifest V3 基础配置
- React + TypeScript + Vite 工程结构
- 标签页读取与关闭能力
- 分类和标签元数据本地存储
- 规则自动分类
- 管理页的分类、新建分类、改名、删除、排序、批量归类
- 标签自定义标题与备注编辑
- 最近关闭列表与恢复
- `Vitest` 基础测试，已覆盖分类逻辑、分类排序、关闭快照构建

## 本地启动

1. 安装依赖

```bash
npm install
```

2. 构建项目

```bash
npm run build
```

3. 运行测试

```bash
npm test
```

4. 在 Chrome 中加载插件

- 打开 `chrome://extensions/`
- 开启“开发者模式”
- 选择“加载已解压的扩展程序”
- 指向项目目录中的 `dist` 目录

## 当前实现说明

- `public/manifest.json` 是扩展清单的唯一入口
- `src/background/index.ts` 负责消息分发和标签监听
- `src/popup` 是插件弹窗
- `src/manager` 是完整管理页
- `src/services` 封装 tabs、分类、存储和分类逻辑
- `src/store` 提供前端状态管理
- 最近关闭恢复通过 `chrome.tabs.create` + 本地元数据回填实现

## 下一步建议

- 增加图标资源和更完整的视觉样式
- 增加拖拽归类、撤销关闭、分类颜色编辑
- 扩展到 UI 交互测试与 lint
