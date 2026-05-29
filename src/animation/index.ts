/**
 * Vuvas 动画系统
 *
 * 提供 CSS-like 的动画能力：
 * - transition: 属性过渡动画
 * - animate: 关键帧动画
 * - 缓动函数（easing）
 *
 * 使用方式：
 * ```ts
 * import { transition, animate } from 'vuvas'
 *
 * // 过渡动画
 * transition(node, { background: '#ff0000' }, { duration: 300 })
 *
 * // 关键帧动画
 * animate(node, [
 *   { opacity: 0, transform: 'translateY(-10)' },
 *   { opacity: 1, transform: 'translateY(0)' }
 * ], { duration: 500, easing: 'ease-out' })
 * ```
 */

import { CanvasNode, type NodeStyle } from '../core/node'

// ============================================================
// 缓动函数
// ============================================================

/** 缓动函数类型 */
export type EasingFunction = (t: number) => number

/** 内置缓动函数 */
export const easings: Record<string, EasingFunction> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  'ease': (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  'bounce': (t) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
  'elastic': (t) => {
    if (t === 0 || t === 1) return t
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI)
  }
}

// ============================================================
// Transition（过渡动画）
// ============================================================

/** 过渡选项 */
export interface TransitionOptions {
  /** 动画时长（毫秒） */
  duration?: number
  /** 缓动函数名或自定义函数 */
  easing?: string | EasingFunction
  /** 延迟（毫秒） */
  delay?: number
  /** 动画完成回调 */
  onComplete?: () => void
  /** 每帧回调（用于触发重渲染） */
  onUpdate?: () => void
}

/** 活跃的动画列表 */
const activeAnimations = new Set<Animation>()

/** 动画实例 */
interface Animation {
  id: number
  cancel: () => void
}

let animationId = 0

/**
 * 对节点执行过渡动画
 * 从当前样式平滑过渡到目标样式
 */
export function transition(
  node: CanvasNode,
  targetStyle: Partial<NodeStyle>,
  options: TransitionOptions = {}
): { cancel: () => void; promise: Promise<void> } {
  const {
    duration = 300,
    easing = 'ease-out',
    delay = 0,
    onComplete,
    onUpdate
  } = options

  const easingFn = typeof easing === 'function' ? easing : (easings[easing] || easings.linear)

  // 记录起始值
  const startValues: Record<string, number> = {}
  const endValues: Record<string, number> = {}
  const animatableProps = ['width', 'height', 'borderRadius', 'fontSize', 'opacity',
    'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'borderWidth', 'gap']

  for (const prop of Object.keys(targetStyle) as (keyof NodeStyle)[]) {
    if (animatableProps.includes(prop)) {
      const startVal = (node.style[prop] as number) || 0
      const endVal = (targetStyle[prop] as number) || 0
      if (startVal !== endVal) {
        startValues[prop] = startVal
        endValues[prop] = endVal
      }
    }
  }

  let cancelled = false
  let rafId: number | null = null
  const id = animationId++

  const anim: Animation = {
    id,
    cancel: () => { cancelled = true }
  }

  const promise = new Promise<void>((resolve) => {
    const startTime = performance.now() + delay

    function tick(now: number) {
      if (cancelled) {
        activeAnimations.delete(anim)
        resolve()
        return
      }

      if (now < startTime) {
        rafId = requestAnimationFrame(tick)
        return
      }

      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easingFn(progress)

      // 插值计算当前值
      for (const prop of Object.keys(startValues)) {
        const start = startValues[prop]
        const end = endValues[prop]
        const current = start + (end - start) * easedProgress;
        (node.style as any)[prop] = current
      }

      // 处理颜色过渡（背景色）
      if (typeof targetStyle.background === 'string' && typeof node.style.background === 'string') {
        // 简化处理：在最后一帧直接设置目标颜色
        if (progress >= 1) {
          node.style.background = targetStyle.background
        }
      }

      onUpdate?.()

      if (progress >= 1) {
        // 动画完成，设置最终值
        Object.assign(node.style, targetStyle)
        activeAnimations.delete(anim)
        onComplete?.()
        resolve()
      } else {
        rafId = requestAnimationFrame(tick)
      }
    }

    activeAnimations.add(anim)
    rafId = requestAnimationFrame(tick)
  })

  return {
    cancel: () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
    },
    promise
  }
}

// ============================================================
// Animate（关键帧动画）
// ============================================================

/** 关键帧 */
export type Keyframe = Partial<NodeStyle> & { offset?: number }

/** 关键帧动画选项 */
export interface AnimateOptions extends TransitionOptions {
  /** 重复次数（Infinity 为无限循环） */
  iterations?: number
  /** 动画方向 */
  direction?: 'normal' | 'reverse' | 'alternate'
  /** 填充模式 */
  fill?: 'none' | 'forwards' | 'backwards' | 'both'
}

/**
 * 对节点执行关键帧动画
 */
export function animate(
  node: CanvasNode,
  keyframes: Keyframe[],
  options: AnimateOptions = {}
): { cancel: () => void; promise: Promise<void> } {
  const {
    duration = 300,
    easing = 'ease-in-out',
    delay = 0,
    iterations = 1,
    direction = 'normal',
    onComplete,
    onUpdate
  } = options

  const easingFn = typeof easing === 'function' ? easing : (easings[easing] || easings.linear)

  // 标准化关键帧偏移
  const normalizedFrames = keyframes.map((frame, i) => ({
    ...frame,
    offset: frame.offset ?? i / (keyframes.length - 1)
  }))

  let cancelled = false
  let rafId: number | null = null
  const originalStyle = { ...node.style }

  const promise = new Promise<void>((resolve) => {
    const startTime = performance.now() + delay
    let currentIteration = 0

    function tick(now: number) {
      if (cancelled) {
        resolve()
        return
      }

      if (now < startTime) {
        rafId = requestAnimationFrame(tick)
        return
      }

      const elapsed = now - startTime
      const iterationDuration = duration
      const totalElapsed = elapsed - currentIteration * iterationDuration
      let progress = Math.min(totalElapsed / iterationDuration, 1)

      // 处理方向
      if (direction === 'reverse') {
        progress = 1 - progress
      } else if (direction === 'alternate' && currentIteration % 2 === 1) {
        progress = 1 - progress
      }

      const easedProgress = easingFn(progress)

      // 找到当前所在的关键帧区间
      let fromFrame = normalizedFrames[0]
      let toFrame = normalizedFrames[normalizedFrames.length - 1]

      for (let i = 0; i < normalizedFrames.length - 1; i++) {
        if (easedProgress >= normalizedFrames[i].offset! && easedProgress <= normalizedFrames[i + 1].offset!) {
          fromFrame = normalizedFrames[i]
          toFrame = normalizedFrames[i + 1]
          break
        }
      }

      // 在区间内插值
      const segmentProgress = (easedProgress - fromFrame.offset!) / (toFrame.offset! - fromFrame.offset!)
      const animatableProps = ['width', 'height', 'borderRadius', 'fontSize', 'opacity',
        'shadowBlur', 'shadowOffsetX', 'shadowOffsetY']

      for (const prop of animatableProps) {
        const from = (fromFrame as any)[prop]
        const to = (toFrame as any)[prop]
        if (from !== undefined && to !== undefined) {
          (node.style as any)[prop] = from + (to - from) * segmentProgress
        }
      }

      onUpdate?.()

      // 检查是否完成当前迭代
      if (totalElapsed >= iterationDuration) {
        currentIteration++
        if (iterations !== Infinity && currentIteration >= iterations) {
          // 动画完成
          if (options.fill === 'forwards' || options.fill === 'both') {
            // 保持最终状态
          } else {
            // 恢复原始状态
            Object.assign(node.style, originalStyle)
          }
          onComplete?.()
          resolve()
          return
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
  })

  return {
    cancel: () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      Object.assign(node.style, originalStyle)
    },
    promise
  }
}
