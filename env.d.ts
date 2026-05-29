/// <reference types="vite/client" />

// .vuvas 单文件组件类型声明
declare module '*.vuvas' {
  import { ComponentDef } from './src/runtime'
  const component: ComponentDef
  export default component
}

// ?raw 后缀导入声明
declare module '*.vuvas?raw' {
  const content: string
  export default content
}
