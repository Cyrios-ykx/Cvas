/**
 * Vuvas 组件库 - Switch 开关
 *
 * 支持功能：
 * - 开/关状态切换
 * - 禁用状态
 * - 自定义开/关文本
 * - 尺寸变体
 * - 自定义颜色
 */

import { CanvasNode, TextNode, type NodeStyle } from '../core/node'
import { type Ref } from '../reactivity'
import { useColors, useSizes } from './theme'

/** Switch 属性 */
export interface SwitchProps {
  /** 是否开启（响应式） */
  modelValue: Ref<boolean>
  /** 是否禁用 */
  disabled?: boolean
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 开启时的文本 */
  activeText?: string
  /** 关闭时的文本 */
  inactiveText?: string
  /** 开启时的颜色 */
  activeColor?: string
  /** 关闭时的颜色 */
  inactiveColor?: string
  /** 值变化回调 */
  onChange?: (value: boolean) => void
}

/**
 * 创建 Switch 开关组件
 */
export function createSwitch(props: SwitchProps): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const size = props.size || 'md'

  // 尺寸配置
  const config = {
    sm: { width: 32, height: 18, dotSize: 14, offset: 2 },
    md: { width: 44, height: 24, dotSize: 20, offset: 2 },
    lg: { width: 56, height: 30, dotSize: 26, offset: 2 },
  }[size]

  const activeColor = props.activeColor || colors.primary
  const inactiveColor = props.inactiveColor || colors.bgTertiary

  // 外层容器（包含文本）
  const wrapper = new CanvasNode({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacingSm,
  })

  // 关闭文本
  if (props.inactiveText) {
    wrapper.append(new TextNode(props.inactiveText, {
      fontSize: sizes.fontSizeSm,
      color: !props.modelValue.value ? colors.textPrimary : colors.textSecondary,
    }))
  }

  // 开关轨道
  const track = new CanvasNode({
    width: config.width,
    height: config.height,
    borderRadius: sizes.radiusRound,
    background: props.modelValue.value ? activeColor : inactiveColor,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
  })

  // 滑块圆点
  const dot = new CanvasNode({
    width: config.dotSize,
    height: config.dotSize,
    borderRadius: sizes.radiusRound,
    background: '#ffffff',
    shadowColor: colors.shadow,
    shadowBlur: 4,
    shadowOffsetY: 1,
    margin: props.modelValue.value
      ? [0, config.offset, 0, config.width - config.dotSize - config.offset]
      : [0, 0, 0, config.offset],
  })

  track.append(dot)
  wrapper.append(track)

  // 开启文本
  if (props.activeText) {
    wrapper.append(new TextNode(props.activeText, {
      fontSize: sizes.fontSizeSm,
      color: props.modelValue.value ? colors.textPrimary : colors.textSecondary,
    }))
  }

  // 点击切换
  if (!props.disabled) {
    track.on('click', () => {
      props.modelValue.value = !props.modelValue.value
      props.onChange?.(props.modelValue.value)

      // 更新样式
      track.style.background = props.modelValue.value ? activeColor : inactiveColor
      dot.style.margin = props.modelValue.value
        ? [0, config.offset, 0, config.width - config.dotSize - config.offset]
        : [0, 0, 0, config.offset]
    })
  }

  return wrapper
}
