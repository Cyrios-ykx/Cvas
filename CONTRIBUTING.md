# 贡献指南

感谢你对 Vuvas 的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告 Bug

1. 在 [Issues](https://github.com/your-username/vuvas/issues) 中搜索是否已有相同问题
2. 如果没有，创建一个新的 Issue，并提供：
   - 问题描述
   - 复现步骤
   - 期望行为 vs 实际行为
   - 环境信息（浏览器、操作系统等）

### 提交功能建议

1. 在 Issues 中创建一个 Feature Request
2. 描述你想要的功能以及使用场景
3. 如果可能，提供 API 设计建议

### 提交代码

1. Fork 本仓库
2. 创建你的特性分支：`git checkout -b feature/my-feature`
3. 提交你的修改：`git commit -m 'feat: add some feature'`
4. 推送到分支：`git push origin feature/my-feature`
5. 创建 Pull Request

## 开发环境搭建

```bash
# 克隆你 fork 的仓库
git clone https://github.com/your-username/vuvas.git
cd vuvas

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 代码规范

- 使用 TypeScript 编写所有源码
- 注释使用中文
- 遵循现有代码风格
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：
  - `feat:` 新功能
  - `fix:` 修复 Bug
  - `docs:` 文档更新
  - `refactor:` 重构
  - `test:` 测试相关
  - `chore:` 构建/工具相关

## 项目架构

请阅读 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解项目整体设计。

## 行为准则

- 尊重每一位贡献者
- 保持友善和建设性的讨论
- 专注于技术本身

---

再次感谢你的贡献！🎉
