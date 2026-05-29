/**
 * Vuvas 组件库 - Progress 进度条
 *
 * 支持功能：
 * - 线性进度条
 * - 百分比显示
 * - 自定义颜色
 * - 尺寸变体
 * - 状态（success / warning / error）
 * - 动画效果
 */

import { CanvasNode, TextNode, type NodeStyle } from '../core/node'
import { type Ref } from '../reactivity'
import { useColors, useSizes } from './theme'

/** Progress 状态 */
export type ProgressStatus = 'normal' | 'success' | 'warning' | 'error'

/** Progress 属性 */
export interface ProgressProps {
  /** 进度百分比（0-100，响应式） */
  percent: Ref<number> | number
  /** 状态 */
  status?: ProgressStatus
  /** 是否显示百分比文本 */
  showText?: boolean
  /** 进度条高度 */
  strokeHeight?: number
  /** 自定义颜色 */
  color?: string
  /** 轨道颜色 */
  trackColor?: string
  /** 文本格式化 */
  format?: (percent: number) => string
}

/**
 * 创建 Progress 进度条组件
 */
export function createProgress(props: ProgressProps): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const strokeHeight = props.strokeHeight || 8
  const showText = props.showText !== false

  // 获取当前百分比值
  const getPercent = (): number => {
    const val = typeof props.percent === 'number' ? props.percent : props.percent.value
    return Math.max(0, Math.min(100, val))
  }

  // 根据状态获取颜色
  const getColor = (): string => {
    if (props.color) return props.color
    switch (props.status) {
      case 'success': return colors.success
      case 'warning': return colors.warning
      case 'error': return colors.danger
      default: return colors.primary
    }
  }

  // 容器
  const container = new CanvasNode({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacingSm,
  })

  // 轨道
  const track = new CanvasNode({
    height: strokeHeight,
    flexGrow: 1,
    background: props.trackColor || colors.bgTertiary,
    borderRadius: strokeHeight / 2,
    overflow: 'hidden',
  })

  // 进度条
  const percent = getPercent()
  const bar = new CanvasNode({
    height: strokeHeight,
    widthPercent: percent / 100,
    background: getColor(),
    borderRadius: strokeHeight / 2,
  })

  track.append(bar)
  container.append(track)

  // 百分比文本
  if (showText) {
    const formatFn = props.format || ((p: number) => `${p}%`)
    const text = new TextNode(formatFn(percent), {
      fontSize: sizes.fontSizeSm,
      color: colors.textSecondary,
      minWidth: 36,
      textAlign: 'right',
    })
    container.append(text)
  }

  return container
}

/**
 * Vuvas 组件库 - Slider 滑块
 *
 * 支持功能：
 * - 拖拽滑动
 * - 最小/最大值
 * - 步进
 * - 禁用状态
 * - 显示当前值
 */

/** Slider 属性 */
export interface SliderProps {
  /** 当前值（响应式） */
  modelValue: Ref<number>
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
  /** 步进 */
  step?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 是否显示当前值 */
  showValue?: boolean
  /** 轨道高度 */
  trackHeight?: number
  /** 值变化回调 */
  onChange?: (value: number) => void
}

/**
 * 创建 Slider 滑块组件
 */
export function createSlider(props: SliderProps): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const min = props.min ?? 0
  const max = props.max ?? 100
  const step = props.step ?? 1
  const trackHeight = props.trackHeight || 6

  // 计算当前百分比
  const getPercent = (): number => {
    return ((props.modelValue.value - min) / (max - min)) * 100
  }

  // 容器
  const container = new CanvasNode({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacingMd,
  })

  // 滑轨
  const track = new CanvasNode({
    height: trackHeight,
    flexGrow: 1,
    background: colors.bgTertiary,
    borderRadius: trackHeight / 2,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
  })

  // 已填充部分
  const filled = new CanvasNode({
    height: trackHeight,
    widthPercent: getPercent() / 100,
    background: props.disabled ? colors.textDisabled : colors.primary,
    borderRadius: trackHeight / 2,
  })

  // 滑块圆点
  const thumb = new CanvasNode({
    width: trackHeight * 3,
    height: trackHeight * 3,
    borderRadius: sizes.radiusRound,
    background: colors.bgPrimary,
    borderColor: props.disabled ? colors.textDisabled : colors.primary,
    borderWidth: 2,
    borderStyle: 'solid',
    shadowColor: colors.shadowLight,
    shadowBlur: 4,
    cursor: props.disabled ? 'not-allowed' : 'grab',
  })

  track.append(filled)
  container.append(track)

  // 显示当前值
  if (props.showValue) {
    const valueText = new TextNode(String(props.modelValue.value), {
      fontSize: sizes.fontSizeSm,
      color: colors.textSecondary,
      minWidth: 30,
      textAlign: 'center',
    })
    container.append(valueText)
  }

  // 点击轨道设置值
  if (!props.disabled) {
    track.on('click', (e) => {
      const trackLayout = track.layout
      const clickX = e.x - trackLayout.x
      const percent = Math.max(0, Math.min(1, clickX / trackLayout.width))
      let newValue = min + percent * (max - min)

      // 步进对齐
      newValue = Math.round(newValue / step) * step
      newValue = Math.max(min, Math.min(max, newValue))

      props.modelValue.value = newValue
      props.onChange?.(newValue)

      // 更新显示
      filled.style.widthPercent = ((newValue - min) / (max - min))
    })

    // 拖拽支持
    track.on('drag', (e) => {
      const trackLayout = track.layout
      const dragX = e.x - trackLayout.x
      const percent = Math.max(0, Math.min(1, dragX / trackLayout.width))
      let newValue = min + percent * (max - min)

      newValue = Math.round(newValue / step) * step
      newValue = Math.max(min, Math.min(max, newValue))

      props.modelValue.value = newValue
      props.onChange?.(newValue)

      filled.style.widthPercent = ((newValue - min) / (max - min))
    })
  }

  return container
}
