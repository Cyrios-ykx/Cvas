# Vuvas 发布 & 工程化任务清单

> 目标：将项目从"GitHub 仓库"升级为"可安装、可使用、有文档、有 CI"的正式开源项目
>
> 最后更新：2026-05-29

---

## 一、npm 发布准备

### package.json 配置
- [x] 移除 `"private": true`
- [x] 添加 `main` / `module` / `types` 入口字段
- [x] 添加 `exports` 导出映射（支持子路径 `vuvas/router`、`vuvas/store` 等）
- [x] 添加 `files` 字段（限定发布内容为 `dist/`、`README.md`、`LICENSE`）
- [x] 添加 `keywords`、`repository`、`author`、`license` 元信息
- [x] 添加 `sideEffects: false`（支持 tree-shaking）

### 库模式构建
- [x] 新增 `vite.config.lib.ts`（Vite library mode）
- [x] 配置多格式输出（ESM + CJS）
- [x] 配置 `rollupOptions.external`（排除外部依赖）
- [x] 添加 `build:lib` 脚本命令
- [ ] 验证产物可被正确 import / require

### 类型声明
- [x] 安装并配置 `vite-plugin-dts`（自动生成 `.d.ts`）
- [ ] 验证类型声明文件完整性
- [ ] 确保 IDE 中 import 后有正确的类型提示

### 发布流程
- [ ] 注册 npm 账号 & `npm login`
- [ ] 首次发布 `npm publish`（0.1.0）
- [ ] 验证 `npm install vuvas` 可正常使用
- [ ] 配置 npm provenance（来源证明）

### 发布命令参考

```bash
# 1. 登录 npm 官方源（会打开浏览器或让你输入用户名/密码/邮箱）
npm login --registry https://registry.npmjs.org/

# 2. 确认登录成功
npm whoami --registry https://registry.npmjs.org/

# 3. 发布（指定官方源，避免被腾讯镜像拦截）
npm publish --registry https://registry.npmjs.org/

# 4. 验证发布成功
npm info vuvas --registry https://registry.npmjs.org/
```

> **注意**：如果本地 npm registry 配置了腾讯镜像源，发布时必须显式指定 `--registry https://registry.npmjs.org/`，否则会报 `ENEEDAUTH` 错误。

---

## 二、Monorepo 拆分（可选，后期）

> 如果需要让 router / store / vite-plugin / vscode-extension 独立安装

- [ ] 迁移到 pnpm workspace
- [ ] 拆分包结构：
  - `packages/vuvas` — 核心框架
  - `packages/router` — `@vuvas/router`
  - `packages/store` — `@vuvas/store`
  - `packages/compiler` — `@vuvas/compiler`
  - `packages/vite-plugin` — `vite-plugin-vuvas`
  - `extensions/vscode-vuvas` — VS Code 扩展
- [ ] 配置包间依赖 & 统一版本管理
- [ ] 各包独立发布到 npm（scoped: `@vuvas/*`）

---

## 三、CI/CD（GitHub Actions）

### 基础 CI
- [x] 创建 `.github/workflows/ci.yml`
- [x] Push / PR 时自动运行 type-check
- [ ] Push / PR 时自动运行单元测试（待添加测试框架）
- [x] 构建验证（确保 `build:lib` + `build` 不报错）

### 自动发布
- [ ] 创建 `.github/workflows/release.yml`
- [ ] 打 tag 时自动发布到 npm
- [ ] 自动生成 GitHub Release + Changelog
- [ ] 配置 NPM_TOKEN secret

### Demo 部署
- [x] 创建 `.github/workflows/deploy.yml`
- [x] 自动构建 Demo 页面
- [x] 部署到 GitHub Pages
- [x] README 中添加在线 Demo 链接

---

## 四、文档站

### 搭建（VitePress / Starlight）
- [ ] 初始化文档项目（`docs/` 目录）
- [ ] 首页（Hero + Features）
- [ ] 快速开始（Getting Started）
- [ ] API 参考文档
  - [ ] 核心 API（createApp, h, ref, reactive...）
  - [ ] 组件系统（defineComponent, props, emit, slots...）
  - [ ] 模板语法（v-if, v-for, v-model...）
  - [ ] 路由（createRouter, useRoute, useRouter...）
  - [ ] 状态管理（defineStore, $patch...）
  - [ ] 动画（transition, animate...）
  - [ ] 组件库（Input, Modal, Tabs...）
- [ ] 教程 / 指南
  - [ ] 从零搭建一个 Canvas 应用
  - [ ] 组件化开发
  - [ ] 路由与状态管理
- [ ] 部署到 GitHub Pages / Netlify / Vercel

### 在线 Playground
- [ ] 基于 StackBlitz 或自建
- [ ] 支持实时编辑 `.vuvas` 文件并预览
- [ ] 嵌入文档站

---

## 五、版本管理 & 发布自动化

- [ ] 引入 changesets 或 release-please
- [ ] 规范 commit message（Conventional Commits）
- [ ] 自动生成 CHANGELOG
- [ ] 自动 bump 版本号
- [ ] PR 合并后自动发布 pre-release（beta / alpha）

---

## 六、项目质量 & 社区

### 代码质量
- [ ] 配置 ESLint + Prettier
- [ ] 配置 husky + lint-staged（提交前检查）
- [ ] 添加 EditorConfig

### 徽章 & 展示
- [ ] README 添加 npm version 徽章
- [ ] README 添加 npm downloads 徽章
- [ ] README 添加 CI status 徽章
- [ ] README 添加 bundle size 徽章（bundlephobia）
- [ ] README 添加在线 Demo 链接

### VS Code 扩展发布
- [ ] 配置 `vsce`（VS Code Extension CLI）
- [ ] 发布到 VS Code Marketplace
- [ ] 添加 Marketplace 徽章到 README

### 社区建设
- [ ] 开启 GitHub Discussions
- [ ] 创建 Issue 模板（Bug Report / Feature Request）
- [ ] 创建 PR 模板
- [ ] 编写 CONTRIBUTING.md 发布流程说明
- [ ] 考虑建立 Discord / 微信群

---

## 推荐执行顺序

```
1. 库模式构建 + 类型声明        ← 发布的前提
2. 首次 npm publish             ← 里程碑！
3. GitHub Actions CI            ← 保证质量
4. Demo 部署到 GitHub Pages     ← 让人看到效果
5. 文档站搭建                   ← 降低使用门槛
6. 版本自动化 (changesets)      ← 持续发布
7. Monorepo 拆分               ← 生态扩展时再做
```
