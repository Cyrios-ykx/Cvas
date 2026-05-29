# Vuvas Language Support

VS Code language extension for `.vuvas` single-file components.

## Features

- 🎨 **Syntax Highlighting** — Full TextMate grammar for `.vuvas` files
  - `<template>` block with HTML-like syntax
  - `<script setup>` block with embedded JavaScript/TypeScript
  - `<style scoped>` block with embedded CSS
  - Vuvas directives (`v-if`, `v-for`, `v-model`, `v-show`, etc.)
  - Event bindings (`@click`, `@input`, etc.)
  - Prop bindings (`:style`, `:class`, etc.)
  - Template interpolation (`{{ expression }}`)
- 📁 **File Icons** — Custom file icons for `.vuvas` files (light/dark themes)
- ⌨️ **Language Configuration** — Bracket matching, auto-closing, comments, folding

## Installation

### Local Development (Recommended)

1. Open VS Code
2. Press `Ctrl+Shift+P` → "Developer: Install Extension from Location..."
3. Select the `extensions/vscode-vuvas` directory

### Alternative: Symlink

```bash
# Windows (PowerShell as Admin)
New-Item -ItemType Junction -Path "$env:USERPROFILE\.vscode\extensions\vscode-vuvas" -Target ".\extensions\vscode-vuvas"

# macOS/Linux
ln -s $(pwd)/extensions/vscode-vuvas ~/.vscode/extensions/vscode-vuvas
```

### Package as VSIX

```bash
cd extensions/vscode-vuvas
npm install
npx vsce package
# Then install the generated .vsix file
```

## Supported Syntax

```vuvas
<template>
  <view :style="containerStyle">
    <text v-if="visible">{{ message }}</text>
    <view v-for="item in list" :key="item.id">
      <text @click="handleClick">{{ item.name }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vuvas'

const message = ref('Hello Vuvas!')
const visible = ref(true)
</script>

<style scoped>
view {
  display: flex;
  flex-direction: column;
  padding: 16;
}
</style>
```

## Roadmap

- [ ] Language Server Protocol (LSP) support
- [ ] IntelliSense / Auto-completion
- [ ] Diagnostics (error checking)
- [ ] Go to Definition
- [ ] Hover information
- [ ] Code formatting
- [ ] Snippets

## License

MIT © 2026-present Cyrios-ykx
