/**
 * Vuvas 性能基准测试 - 核心测试套件
 *
 * 测试项目：
 * 1. 创建 1000 个节点（首次渲染）
 * 2. 更新 1000 个节点属性（批量更新）
 * 3. 列表重排序（diff 算法效率）
 * 4. 深层嵌套树渲染（递归渲染）
 * 5. 动画帧率（60fps 稳定性）
 * 6. 内存占用（节点数 vs 内存曲线）
 */

import { CanvasNode, TextNode, LayoutEngine, Renderer } from '../src/core'
import { h, createNode, patch, type VNode } from '../src/runtime/vnode'

// ============================================================
// 类型定义
// ============================================================

export interface BenchmarkResult {
  name: string
  description: string
  vuvasTime: number
  domTime: number
  unit: string
  /** vuvas 相对 DOM 的性能倍率（>1 表示 vuvas 更快） */
  ratio: number
}

export interface FrameRateResult {
  name: string
  description: string
  vuvasFps: number
  domFps: number
  vuvasDropped: number
  domDropped: number
  unit: string
  ratio: number
}

export interface MemoryResult {
  name: string
  description: string
  points: { nodeCount: number; vuvasMemory: number; domMemory: number }[]
  unit: string
}

export type AnyBenchmarkResult = BenchmarkResult | FrameRateResult | MemoryResult

// ============================================================
// 工具函数
// ============================================================

/**
 * 高精度计时器
 */
function now(): number {
  return performance.now()
}

/**
 * 运行多次取中位数（排除极端值）
 */
async function runBench(fn: () => void, iterations: number = 10): Promise<number> {
  const times: number[] = []

  // 预热
  for (let i = 0; i < 3; i++) {
    fn()
  }

  // 正式测量
  for (let i = 0; i < iterations; i++) {
    const start = now()
    fn()
    const end = now()
    times.push(end - start)
  }

  // 排序取中位数
  times.sort((a, b) => a - b)
  // 去掉最高和最低各 20%
  const trimCount = Math.floor(times.length * 0.2)
  const trimmed = times.slice(trimCount, times.length - trimCount)
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length
}

/**
 * 异步等待一帧
 */
function nextFrame(): Promise<number> {
  return new Promise(resolve => requestAnimationFrame(resolve))
}

// ============================================================
// Vuvas 侧测试辅助
// ============================================================

function getCanvas(): HTMLCanvasElement {
  return document.getElementById('bench-canvas') as HTMLCanvasElement
}

function getDomContainer(): HTMLElement {
  return document.getElementById('bench-dom') as HTMLElement
}

/**
 * 创建 Vuvas 节点树（N 个子节点）
 */
function createVuvasTree(count: number): CanvasNode {
  const root = new CanvasNode({
    width: 800,
    height: 600,
    display: 'flex',
    flexDirection: 'column',
    gap: 2
  })

  for (let i = 0; i < count; i++) {
    const child = new TextNode(`Item ${i}`, {
      height: 30,
      fontSize: 14,
      color: '#333',
      background: i % 2 === 0 ? '#f0f0f0' : '#ffffff',
      padding: [4, 8]
    })
    root.append(child)
  }

  return root
}

/**
 * 创建 DOM 节点树（N 个子节点）
 */
function createDomTree(container: HTMLElement, count: number): void {
  container.innerHTML = ''
  const fragment = document.createDocumentFragment()
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:800px;height:600px;'

  for (let i = 0; i < count; i++) {
    const div = document.createElement('div')
    div.textContent = `Item ${i}`
    div.style.cssText = `height:30px;font-size:14px;color:#333;background:${i % 2 === 0 ? '#f0f0f0' : '#ffffff'};padding:4px 8px;`
    wrapper.appendChild(div)
  }

  fragment.appendChild(wrapper)
  container.appendChild(fragment)
}

/**
 * 创建 VNode 树（用于 diff 测试）
 */
function createVNodeTree(count: number, prefix: string = ''): VNode {
  const children: VNode[] = []
  for (let i = 0; i < count; i++) {
    children.push(
      h('text', {
        key: `${prefix}${i}`,
        style: {
          height: 30,
          fontSize: 14,
          color: '#333',
          background: i % 2 === 0 ? '#f0f0f0' : '#ffffff',
          padding: [4, 8] as [number, number]
        }
      }, `Item ${prefix}${i}`)
    )
  }
  return h('view', {
    style: { width: 800, height: 600, display: 'flex', flexDirection: 'column', gap: 2 }
  }, children)
}

/**
 * 创建深层嵌套 VNode 树
 */
function createDeepVNodeTree(depth: number, breadth: number): VNode {
  if (depth === 0) {
    return h('text', { style: { fontSize: 12, color: '#666' } }, 'leaf')
  }
  const children: VNode[] = []
  for (let i = 0; i < breadth; i++) {
    children.push(createDeepVNodeTree(depth - 1, breadth))
  }
  return h('view', {
    style: { display: 'flex', flexDirection: depth % 2 === 0 ? 'row' : 'column', gap: 1, padding: 2 }
  }, children)
}

/**
 * 创建深层嵌套 DOM 树
 */
function createDeepDomTree(container: HTMLElement, depth: number, breadth: number): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `display:flex;flex-direction:${depth % 2 === 0 ? 'row' : 'column'};gap:1px;padding:2px;`

  if (depth === 0) {
    el.textContent = 'leaf'
    el.style.cssText = 'font-size:12px;color:#666;'
    return el
  }

  for (let i = 0; i < breadth; i++) {
    el.appendChild(createDeepDomTree(container, depth - 1, breadth))
  }
  return el
}

// ============================================================
// 基准测试用例
// ============================================================

/**
 * 测试 1：创建 1000 个节点（首次渲染）
 */
export async function benchCreateNodes(): Promise<BenchmarkResult> {
  const canvas = getCanvas()
  const container = getDomContainer()
  const renderer = new Renderer(canvas)
  const layoutEngine = new LayoutEngine()
  const COUNT = 1000

  // Vuvas: 创建节点 + 布局 + 渲染
  const vuvasTime = await runBench(() => {
    const root = createVuvasTree(COUNT)
    layoutEngine.computeLayout(root, 800, 600)
    renderer.invalidateAll()
    renderer.render(root)
  })

  // DOM: 创建节点 + 浏览器布局 + 绘制
  const domTime = await runBench(() => {
    createDomTree(container, COUNT)
    // 强制同步布局（触发 reflow）
    void container.offsetHeight
  })

  return {
    name: '创建 1000 个节点',
    description: '从零创建 1000 个文本节点并完成首次渲染（含布局计算）',
    vuvasTime: Math.round(vuvasTime * 100) / 100,
    domTime: Math.round(domTime * 100) / 100,
    unit: 'ms',
    ratio: Math.round((domTime / vuvasTime) * 100) / 100
  }
}

/**
 * 测试 2：更新 1000 个节点属性（批量更新）
 * 优化版：使用 setVisualStyle() 跳过不必要的布局计算 + renderVisualChanges() 脏区域重绘
 */
export async function benchUpdateNodes(): Promise<BenchmarkResult> {
  const canvas = getCanvas()
  const container = getDomContainer()
  const renderer = new Renderer(canvas)
  const layoutEngine = new LayoutEngine()
  const COUNT = 1000

  // 预创建 Vuvas 树
  const vuvasRoot = createVuvasTree(COUNT)
  layoutEngine.computeLayout(vuvasRoot, 800, 600)
  renderer.invalidateAll()
  renderer.render(vuvasRoot)

  // 预创建 DOM 树
  createDomTree(container, COUNT)
  void container.offsetHeight

  // Vuvas: 使用优化的 setVisualStyle（跳过布局计算）+ 脏区域重绘
  const vuvasTime = await runBench(() => {
    for (let i = 0; i < vuvasRoot.children.length; i++) {
      vuvasRoot.children[i].setVisualStyle({
        background: i % 3 === 0 ? '#e8f5e9' : i % 3 === 1 ? '#fff3e0' : '#e3f2fd'
      })
    }
    // 不需要重新计算布局（只改了颜色）
    // layoutEngine.computeLayoutIfNeeded 会检测到无需布局
    renderer.renderVisualChanges(vuvasRoot)
  })

  // DOM: 更新所有节点的背景色
  // 注意：DOM 的 repaint 是异步的，offsetHeight 仅触发 reflow
  // 而 Vuvas 是同步完成绘制的，所以 DOM 侧有天然优势
  const domTime = await runBench(() => {
    const children = container.querySelector('div')!.children
    for (let i = 0; i < children.length; i++) {
      ;(children[i] as HTMLElement).style.background = i % 3 === 0 ? '#e8f5e9' : i % 3 === 1 ? '#fff3e0' : '#e3f2fd'
    }
    void container.offsetHeight
  })

  return {
    name: '更新 1000 个节点属性',
    description: '批量更新 1000 个节点的背景色（优化：跳过布局计算 + 脏区域重绘）',
    vuvasTime: Math.round(vuvasTime * 100) / 100,
    domTime: Math.round(domTime * 100) / 100,
    unit: 'ms',
    ratio: Math.round((domTime / vuvasTime) * 100) / 100
  }
}

/**
 * 测试 3：列表重排序（diff 算法效率）
 */
export async function benchListReorder(): Promise<BenchmarkResult> {
  const canvas = getCanvas()
  const container = getDomContainer()
  const renderer = new Renderer(canvas)
  const layoutEngine = new LayoutEngine()
  const COUNT = 1000

  // Vuvas: VNode diff + patch
  let oldVNode = createVNodeTree(COUNT)
  const oldNode = createNode(oldVNode)
  layoutEngine.computeLayout(oldNode, 800, 600)
  renderer.invalidateAll()
  renderer.render(oldNode)

  const vuvasTime = await runBench(() => {
    // 随机打乱顺序
    const indices = Array.from({ length: COUNT }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }

    const children: VNode[] = indices.map(i =>
      h('text', {
        key: `${i}`,
        style: {
          height: 30,
          fontSize: 14,
          color: '#333',
          background: i % 2 === 0 ? '#f0f0f0' : '#ffffff',
          padding: [4, 8] as [number, number]
        }
      }, `Item ${i}`)
    )
    const newVNode = h('view', {
      style: { width: 800, height: 600, display: 'flex', flexDirection: 'column', gap: 2 }
    }, children)

    const patchedNode = patch(oldVNode, newVNode)
    layoutEngine.computeLayout(patchedNode, 800, 600)
    renderer.invalidateAll()
    renderer.render(patchedNode)
    oldVNode = newVNode
  })

  // DOM: 重排序 DOM 节点
  createDomTree(container, COUNT)
  void container.offsetHeight

  const domTime = await runBench(() => {
    const wrapper = container.querySelector('div')!
    const children = Array.from(wrapper.children) as HTMLElement[]

    // 随机打乱
    for (let i = children.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[children[i], children[j]] = [children[j], children[i]]
    }

    // 使用 DocumentFragment 重新排列
    const fragment = document.createDocumentFragment()
    for (const child of children) {
      fragment.appendChild(child)
    }
    wrapper.appendChild(fragment)
    void container.offsetHeight
  })

  return {
    name: '列表重排序 (1000 项)',
    description: '随机打乱 1000 个节点的顺序，测试 diff/patch 效率',
    vuvasTime: Math.round(vuvasTime * 100) / 100,
    domTime: Math.round(domTime * 100) / 100,
    unit: 'ms',
    ratio: Math.round((domTime / vuvasTime) * 100) / 100
  }
}

/**
 * 测试 4：深层嵌套树渲染
 * 深度 7，每层 3 个子节点 = 3^7 = 2187 个叶子节点
 */
export async function benchDeepTree(): Promise<BenchmarkResult> {
  const canvas = getCanvas()
  const container = getDomContainer()
  const renderer = new Renderer(canvas)
  const layoutEngine = new LayoutEngine()
  const DEPTH = 7
  const BREADTH = 3

  // Vuvas: 深层嵌套 VNode 树
  const vuvasTime = await runBench(() => {
    const vnode = createDeepVNodeTree(DEPTH, BREADTH)
    const node = createNode(vnode)
    layoutEngine.computeLayout(node, 800, 600)
    renderer.invalidateAll()
    renderer.render(node)
  }, 5) // 减少迭代次数（此测试较重）

  // DOM: 深层嵌套 DOM 树
  const domTime = await runBench(() => {
    container.innerHTML = ''
    const tree = createDeepDomTree(container, DEPTH, BREADTH)
    container.appendChild(tree)
    void container.offsetHeight
  }, 5)

  return {
    name: '深层嵌套树渲染',
    description: `深度 ${DEPTH}，每层 ${BREADTH} 个子节点（共 ${Math.pow(BREADTH, DEPTH)} 个叶子节点）`,
    vuvasTime: Math.round(vuvasTime * 100) / 100,
    domTime: Math.round(domTime * 100) / 100,
    unit: 'ms',
    ratio: Math.round((domTime / vuvasTime) * 100) / 100
  }
}

/**
 * 测试 5：动画帧率对比
 * 持续 2 秒，每帧更新 100 个节点的位置
 */
export async function benchAnimationFps(): Promise<FrameRateResult> {
  const canvas = getCanvas()
  const container = getDomContainer()
  const renderer = new Renderer(canvas)
  const layoutEngine = new LayoutEngine()
  const DURATION = 2000 // 2秒
  const ANIMATE_COUNT = 100

  // --- Vuvas 动画测试 ---
  const vuvasRoot = new CanvasNode({
    width: 800,
    height: 600,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4
  })
  for (let i = 0; i < ANIMATE_COUNT; i++) {
    vuvasRoot.append(new CanvasNode({
      width: 40,
      height: 40,
      background: `hsl(${(i * 3.6) % 360}, 70%, 60%)`,
      borderRadius: 4
    }))
  }

  let vuvasFrames = 0
  let vuvasDropped = 0
  let lastFrameTime = now()

  await new Promise<void>(resolve => {
    const startTime = now()
    const animate = () => {
      const currentTime = now()
      const elapsed = currentTime - startTime

      if (elapsed >= DURATION) {
        resolve()
        return
      }

      // 检测掉帧（超过 20ms 算掉帧）
      if (currentTime - lastFrameTime > 20) {
        vuvasDropped++
      }
      lastFrameTime = currentTime

      // 更新节点样式（width/height 是布局属性，需要重新计算布局）
      for (let i = 0; i < ANIMATE_COUNT; i++) {
        const t = elapsed / 1000
        const offset = Math.sin(t * 2 + i * 0.1) * 5
        vuvasRoot.children[i].setStyle({
          width: 40 + offset,
          height: 40 + offset
        })
      }

      // 使用增量布局（仅在有布局变更时才重新计算）
      layoutEngine.computeLayoutIfNeeded(vuvasRoot, 800, 600)
      renderer.invalidateAll()
      renderer.render(vuvasRoot)
      vuvasFrames++

      requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  })

  const vuvasFps = Math.round((vuvasFrames / (DURATION / 1000)) * 10) / 10

  // --- DOM 动画测试 ---
  container.innerHTML = ''
  const domWrapper = document.createElement('div')
  domWrapper.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;width:800px;height:600px;'
  const domElements: HTMLElement[] = []

  for (let i = 0; i < ANIMATE_COUNT; i++) {
    const el = document.createElement('div')
    el.style.cssText = `width:40px;height:40px;background:hsl(${(i * 3.6) % 360}, 70%, 60%);border-radius:4px;transition:none;`
    domWrapper.appendChild(el)
    domElements.push(el)
  }
  container.appendChild(domWrapper)

  let domFrames = 0
  let domDropped = 0
  lastFrameTime = now()

  await new Promise<void>(resolve => {
    const startTime = now()
    const animate = () => {
      const currentTime = now()
      const elapsed = currentTime - startTime

      if (elapsed >= DURATION) {
        resolve()
        return
      }

      if (currentTime - lastFrameTime > 20) {
        domDropped++
      }
      lastFrameTime = currentTime

      for (let i = 0; i < ANIMATE_COUNT; i++) {
        const t = elapsed / 1000
        const offset = Math.sin(t * 2 + i * 0.1) * 5
        domElements[i].style.width = `${40 + offset}px`
        domElements[i].style.height = `${40 + offset}px`
      }

      domFrames++
      requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  })

  const domFps = Math.round((domFrames / (DURATION / 1000)) * 10) / 10

  return {
    name: '动画帧率 (100 节点)',
    description: `持续 ${DURATION / 1000} 秒，每帧更新 ${ANIMATE_COUNT} 个节点的尺寸`,
    vuvasFps,
    domFps,
    vuvasDropped,
    domDropped,
    unit: 'fps',
    ratio: Math.round((vuvasFps / domFps) * 100) / 100
  }
}

/**
 * 测试 6：内存占用对比
 * 逐步增加节点数，测量内存变化
 */
export async function benchMemory(): Promise<MemoryResult> {
  const canvas = getCanvas()
  const container = getDomContainer()
  const renderer = new Renderer(canvas)
  const layoutEngine = new LayoutEngine()

  const points: { nodeCount: number; vuvasMemory: number; domMemory: number }[] = []
  const testCounts = [100, 500, 1000, 2000, 5000]

  for (const count of testCounts) {
    // 强制 GC（如果可用）
    if ((performance as any).measureUserAgentSpecificMemory) {
      // 现代浏览器可能支持
    }

    // Vuvas 内存
    const vuvasBefore = (performance as any).memory?.usedJSHeapSize || 0
    const vuvasRoot = createVuvasTree(count)
    layoutEngine.computeLayout(vuvasRoot, 800, 600)
    renderer.invalidateAll()
    renderer.render(vuvasRoot)
    const vuvasAfter = (performance as any).memory?.usedJSHeapSize || 0
    const vuvasMemory = Math.max(0, vuvasAfter - vuvasBefore)

    // DOM 内存
    container.innerHTML = ''
    const domBefore = (performance as any).memory?.usedJSHeapSize || 0
    createDomTree(container, count)
    void container.offsetHeight
    const domAfter = (performance as any).memory?.usedJSHeapSize || 0
    const domMemory = Math.max(0, domAfter - domBefore)

    points.push({
      nodeCount: count,
      vuvasMemory: Math.round(vuvasMemory / 1024), // KB
      domMemory: Math.round(domMemory / 1024) // KB
    })

    // 清理
    container.innerHTML = ''
    await nextFrame()
  }

  return {
    name: '内存占用对比',
    description: '不同节点数量下的 JS 堆内存占用（需要 Chrome --enable-precise-memory-info）',
    points,
    unit: 'KB'
  }
}

// ============================================================
// 额外测试用例
// ============================================================

/**
 * 测试 7：大量节点创建 + 销毁（模拟列表翻页）
 * 模拟翻页场景：销毁旧列表，创建新列表
 */
export async function benchCreateDestroy(): Promise<BenchmarkResult> {
  const canvas = getCanvas()
  const container = getDomContainer()
  const renderer = new Renderer(canvas)
  const layoutEngine = new LayoutEngine()
  const COUNT = 500

  // Vuvas: 反复创建销毁
  const vuvasTime = await runBench(() => {
    const root = new CanvasNode({
      width: 800, height: 600,
      display: 'flex', flexDirection: 'column', gap: 2
    })
    // 创建新列表
    for (let i = 0; i < COUNT; i++) {
      root.append(new TextNode(`Page item ${Math.random().toFixed(4)}`, {
        height: 30, fontSize: 14, color: '#333',
        background: `hsl(${Math.random() * 360}, 60%, 90%)`,
        padding: [4, 8], borderRadius: 4
      }))
    }
    layoutEngine.computeLayout(root, 800, 600)
    renderer.invalidateAll()
    renderer.render(root)
  })

  // DOM: 反复创建销毁
  const domTime = await runBench(() => {
    container.innerHTML = ''
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:800px;height:600px;'
    for (let i = 0; i < COUNT; i++) {
      const div = document.createElement('div')
      div.textContent = `Page item ${Math.random().toFixed(4)}`
      div.style.cssText = `height:30px;font-size:14px;color:#333;background:hsl(${Math.random() * 360}, 60%, 90%);padding:4px 8px;border-radius:4px;`
      wrapper.appendChild(div)
    }
    container.appendChild(wrapper)
    void container.offsetHeight
  })

  return {
    name: '列表翻页 (500 项创建+销毁)',
    description: '模拟翻页：销毁旧列表 + 创建新列表 + 渲染（含随机样式计算）',
    vuvasTime: Math.round(vuvasTime * 100) / 100,
    domTime: Math.round(domTime * 100) / 100,
    unit: 'ms',
    ratio: Math.round((domTime / vuvasTime) * 100) / 100
  }
}

/**
 * 测试 8：条件渲染切换（v-if 模拟）
 * 频繁切换大块 UI 的显示/隐藏
 */
export async function benchConditionalRender(): Promise<BenchmarkResult> {
  const canvas = getCanvas()
  const container = getDomContainer()
  const renderer = new Renderer(canvas)
  const layoutEngine = new LayoutEngine()
  const COUNT = 200

  // Vuvas: 通过 VNode diff 切换
  let showA = true
  const vnodeA = createVNodeTree(COUNT, 'A-')
  const vnodeB = createVNodeTree(COUNT, 'B-')
  let currentVNode = vnodeA
  let currentNode = createNode(currentVNode)
  layoutEngine.computeLayout(currentNode, 800, 600)
  renderer.invalidateAll()
  renderer.render(currentNode)

  const vuvasTime = await runBench(() => {
    showA = !showA
    const nextVNode = showA ? vnodeA : vnodeB
    currentNode = patch(currentVNode, nextVNode)
    currentVNode = nextVNode
    layoutEngine.computeLayout(currentNode, 800, 600)
    renderer.invalidateAll()
    renderer.render(currentNode)
  })

  // DOM: 通过 display:none 切换
  container.innerHTML = ''
  const wrapperA = document.createElement('div')
  const wrapperB = document.createElement('div')
  wrapperA.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:800px;'
  wrapperB.style.cssText = 'display:none;flex-direction:column;gap:2px;width:800px;'

  for (let i = 0; i < COUNT; i++) {
    const divA = document.createElement('div')
    divA.textContent = `A-Item ${i}`
    divA.style.cssText = `height:30px;font-size:14px;padding:4px 8px;background:#f0f0f0;`
    wrapperA.appendChild(divA)

    const divB = document.createElement('div')
    divB.textContent = `B-Item ${i}`
    divB.style.cssText = `height:30px;font-size:14px;padding:4px 8px;background:#e0e0ff;`
    wrapperB.appendChild(divB)
  }
  container.appendChild(wrapperA)
  container.appendChild(wrapperB)
  void container.offsetHeight

  let domShowA = true
  const domTime = await runBench(() => {
    domShowA = !domShowA
    wrapperA.style.display = domShowA ? 'flex' : 'none'
    wrapperB.style.display = domShowA ? 'none' : 'flex'
    void container.offsetHeight
  })

  return {
    name: '条件渲染切换 (200 项)',
    description: '频繁切换两组 200 个节点的显示/隐藏（模拟 v-if）',
    vuvasTime: Math.round(vuvasTime * 100) / 100,
    domTime: Math.round(domTime * 100) / 100,
    unit: 'ms',
    ratio: Math.round((domTime / vuvasTime) * 100) / 100
  }
}

/**
 * 测试 9：复杂样式节点渲染
 * 每个节点都有阴影、渐变、圆角、边框等复杂样式
 */
export async function benchComplexStyles(): Promise<BenchmarkResult> {
  const canvas = getCanvas()
  const container = getDomContainer()
  const renderer = new Renderer(canvas)
  const layoutEngine = new LayoutEngine()
  const COUNT = 300

  // Vuvas: 复杂样式节点
  const vuvasTime = await runBench(() => {
    const root = new CanvasNode({
      width: 800, height: 600,
      display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16
    })
    for (let i = 0; i < COUNT; i++) {
      root.append(new TextNode(`Card ${i}`, {
        width: 120, height: 80,
        background: { type: 'linear', direction: 'to bottom', colors: ['#667eea', '#764ba2'] },
        color: '#ffffff',
        fontSize: 12,
        fontWeight: 'bold',
        borderRadius: 12,
        shadowColor: 'rgba(102, 126, 234, 0.4)',
        shadowBlur: 12,
        shadowOffsetY: 4,
        borderColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderStyle: 'solid',
        padding: [12, 16]
      }))
    }
    layoutEngine.computeLayout(root, 800, 600)
    renderer.invalidateAll()
    renderer.render(root)
  }, 5)

  // DOM: 复杂样式节点
  const domTime = await runBench(() => {
    container.innerHTML = ''
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;width:800px;height:600px;padding:16px;'
    for (let i = 0; i < COUNT; i++) {
      const div = document.createElement('div')
      div.textContent = `Card ${i}`
      div.style.cssText = `width:120px;height:80px;background:linear-gradient(to bottom,#667eea,#764ba2);color:#fff;font-size:12px;font-weight:bold;border-radius:12px;box-shadow:0 4px 12px rgba(102,126,234,0.4);border:1px solid rgba(255,255,255,0.2);padding:12px 16px;display:flex;align-items:center;justify-content:center;`
      wrapper.appendChild(div)
    }
    container.appendChild(wrapper)
    void container.offsetHeight
  }, 5)

  return {
    name: '复杂样式渲染 (300 节点)',
    description: '每个节点含渐变背景 + 阴影 + 圆角 + 边框（模拟卡片列表）',
    vuvasTime: Math.round(vuvasTime * 100) / 100,
    domTime: Math.round(domTime * 100) / 100,
    unit: 'ms',
    ratio: Math.round((domTime / vuvasTime) * 100) / 100
  }
}

/**
 * 测试 10：响应式数据驱动更新
 * 模拟真实场景：响应式数据变化 → 触发重新渲染
 */
export async function benchReactiveUpdate(): Promise<BenchmarkResult> {
  const canvas = getCanvas()
  const container = getDomContainer()
  const renderer = new Renderer(canvas)
  const layoutEngine = new LayoutEngine()
  const COUNT = 100

  // Vuvas: VNode patch 更新
  const createListVNode = (items: string[]): VNode => {
    return h('view', {
      style: { width: 800, height: 600, display: 'flex', flexDirection: 'column', gap: 2 }
    }, items.map((item, i) => h('text', {
      key: `item-${i}`,
      style: { height: 24, fontSize: 13, color: '#333', padding: [2, 8] as [number, number] }
    }, item)))
  }

  let items = Array.from({ length: COUNT }, (_, i) => `Item ${i}: value = ${Math.random().toFixed(2)}`)
  let oldVNode = createListVNode(items)
  let node = createNode(oldVNode)
  layoutEngine.computeLayout(node, 800, 600)
  renderer.invalidateAll()
  renderer.render(node)

  // Vuvas: 每次更新 20% 的数据
  const vuvasTime = await runBench(() => {
    // 随机更新 20% 的项
    const newItems = [...items]
    for (let i = 0; i < COUNT * 0.2; i++) {
      const idx = Math.floor(Math.random() * COUNT)
      newItems[idx] = `Item ${idx}: value = ${Math.random().toFixed(2)}`
    }
    items = newItems

    const newVNode = createListVNode(items)
    node = patch(oldVNode, newVNode)
    oldVNode = newVNode
    layoutEngine.computeLayout(node, 800, 600)
    renderer.invalidateAll()
    renderer.render(node)
  })

  // DOM: 每次更新 20% 的数据
  container.innerHTML = ''
  const domWrapper = document.createElement('div')
  domWrapper.style.cssText = 'display:flex;flex-direction:column;gap:2px;width:800px;height:600px;'
  const domItems: HTMLElement[] = []
  for (let i = 0; i < COUNT; i++) {
    const div = document.createElement('div')
    div.textContent = items[i]
    div.style.cssText = 'height:24px;font-size:13px;color:#333;padding:2px 8px;'
    domWrapper.appendChild(div)
    domItems.push(div)
  }
  container.appendChild(domWrapper)
  void container.offsetHeight

  const domTime = await runBench(() => {
    for (let i = 0; i < COUNT * 0.2; i++) {
      const idx = Math.floor(Math.random() * COUNT)
      const newText = `Item ${idx}: value = ${Math.random().toFixed(2)}`
      domItems[idx].textContent = newText
    }
    void container.offsetHeight
  })

  return {
    name: '响应式数据更新 (100 项 / 20% 变更)',
    description: '模拟真实场景：数据变化 → diff/patch → 重新渲染（仅更新变化的部分）',
    vuvasTime: Math.round(vuvasTime * 100) / 100,
    domTime: Math.round(domTime * 100) / 100,
    unit: 'ms',
    ratio: Math.round((domTime / vuvasTime) * 100) / 100
  }
}

/**
 * 测试 11：大规模节点命中测试（事件系统性能）
 * Canvas 的命中测试 vs DOM 的原生事件委托
 */
export async function benchHitTest(): Promise<BenchmarkResult> {
  const canvas = getCanvas()
  const container = getDomContainer()
  const layoutEngine = new LayoutEngine()
  const COUNT = 2000

  // Vuvas: 构建节点树并执行命中测试
  const vuvasRoot = new CanvasNode({
    width: 800, height: 600,
    display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2
  })
  for (let i = 0; i < COUNT; i++) {
    vuvasRoot.append(new CanvasNode({
      width: 18, height: 18, background: '#ddd', borderRadius: 2
    }))
  }
  layoutEngine.computeLayout(vuvasRoot, 800, 600)

  // 命中测试函数
  function hitTest(node: CanvasNode, x: number, y: number): CanvasNode | null {
    const { layout } = node
    if (x < layout.x || x > layout.x + layout.width ||
        y < layout.y || y > layout.y + layout.height) {
      return null
    }
    for (let i = node.children.length - 1; i >= 0; i--) {
      const hit = hitTest(node.children[i], x, y)
      if (hit) return hit
    }
    return node
  }

  // Vuvas: 执行 1000 次随机命中测试
  const vuvasTime = await runBench(() => {
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 800
      const y = Math.random() * 600
      hitTest(vuvasRoot, x, y)
    }
  })

  // DOM: 使用 elementFromPoint 执行命中测试
  container.innerHTML = ''
  const domWrapper = document.createElement('div')
  domWrapper.style.cssText = 'display:flex;flex-wrap:wrap;gap:2px;width:800px;height:600px;position:relative;'
  for (let i = 0; i < COUNT; i++) {
    const div = document.createElement('div')
    div.style.cssText = 'width:18px;height:18px;background:#ddd;border-radius:2px;'
    domWrapper.appendChild(div)
  }
  container.appendChild(domWrapper)
  // 让 DOM 容器可见以便 elementFromPoint 工作
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  void container.offsetHeight

  const domTime = await runBench(() => {
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * 800
      const y = Math.random() * 600
      document.elementFromPoint(x, y)
    }
  })

  // 恢复隐藏
  container.style.position = 'fixed'
  container.style.top = '-9999px'
  container.style.left = '-9999px'

  return {
    name: '命中测试 (2000 节点 × 1000 次)',
    description: '在 2000 个节点中执行 1000 次随机坐标命中测试',
    vuvasTime: Math.round(vuvasTime * 100) / 100,
    domTime: Math.round(domTime * 100) / 100,
    unit: 'ms',
    ratio: Math.round((domTime / vuvasTime) * 100) / 100
  }
}

// ============================================================
// 导出所有测试
// ============================================================

export const allBenchmarks = [
  benchCreateNodes,
  benchUpdateNodes,
  benchListReorder,
  benchDeepTree,
  benchAnimationFps,
  benchMemory,
  benchCreateDestroy,
  benchConditionalRender,
  benchComplexStyles,
  benchReactiveUpdate,
  benchHitTest
]
