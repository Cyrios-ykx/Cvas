# Contributing Guide

**English** | [中文](./CONTRIBUTING.zh-CN.md)

Thank you for your interest in Vuvas! We welcome contributions of any kind.

## How to Contribute

### Report Bugs

1. Search [Issues](https://github.com/your-username/vuvas/issues) to see if the problem has already been reported
2. If not, create a new Issue with:
   - Problem description
   - Steps to reproduce
   - Expected behavior vs actual behavior
   - Environment info (browser, OS, etc.)

### Suggest Features

1. Create a Feature Request in Issues
2. Describe the feature you want and its use case
3. If possible, provide API design suggestions

### Submit Code

1. Fork this repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Create a Pull Request

## Development Setup

```bash
# Clone your forked repository
git clone https://github.com/your-username/vuvas.git
cd vuvas

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Code Style

- Write all source code in TypeScript
- Comments in Chinese
- Follow existing code style
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:` New feature
  - `fix:` Bug fix
  - `docs:` Documentation update
  - `refactor:` Refactoring
  - `test:` Test related
  - `chore:` Build/tooling related

## Architecture

Please read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the overall project design.

## Code of Conduct

- Respect every contributor
- Keep discussions friendly and constructive
- Focus on the technology itself

---

Thank you for contributing! 🎉
