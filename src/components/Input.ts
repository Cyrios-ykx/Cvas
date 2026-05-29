/**
 * Vuvas 组件库 - Input 输入框
 *
 * 支持功能：
 * - 文本输入与光标显示
 * - placeholder 占位文本
 * - 禁用状态
 * - 聚焦/失焦样式
 * - 前缀/后缀图标
 * - 尺寸变体（sm / md / lg）
 */

import { CanvasNode, TextNode, type NodeStyle } from '../core/node'
import { ref, computed, type Ref } from '../reactivity'
import { useColors, useSizes, type Theme } from './theme'

/** Input 组件尺寸 */
export type InputSize = 'sm' | 'md' | 'lg'

/** Input 组件属性 */
export interface InputProps {
  /** 输入值（响应式） */
  value: Ref<string>
  /** 占位文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 尺寸 */
  size?: InputSize
  /** 前缀文本 */
  prefix?: string
  /** 后缀文本 */
  suffix?: string
  /** 输入类型 */
  type?: 'text' | 'password' | 'number'
  /** 最大长度 */
  maxLength?: number
  /** 值变化回调 */
  onChange?: (value: string) => void
  /** 聚焦回调 */
  onFocus?: () => void
  /** 失焦回调 */
  onBlur?: () => void
}

/**
 * 创建 Input 输入框组件
 */
export function createInput(props: InputProps): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const size = props.size || 'md'
  const isFocused = ref(false)
  const cursorVisible = ref(true)
  let cursorTimer: number | null = null

  // 根据尺寸获取高度和字体大小
  const heightMap: Record<InputSize, number> = {
    sm: sizes.heightSm,
    md: sizes.heightMd,
    lg: sizes.heightLg,
  }
  const fontSizeMap: Record<InputSize, number> = {
    sm: sizes.fontSizeSm,
    md: sizes.fontSizeMd,
    lg: sizes.fontSizeLg,
  }

  const height = heightMap[size]
  const fontSize = fontSizeMap[size]

  // 容器样式
  const containerStyle: NodeStyle = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height,
    padding: [0, sizes.spacingMd],
    background: props.disabled ? colors.bgTertiary : colors.bgPrimary,
    borderRadius: sizes.radiusMd,
    borderColor: props.disabled ? colors.border : colors.border,
    borderWidth: sizes.borderWidth,
    borderStyle: 'solid',
    gap: sizes.spacingSm,
    cursor: props.disabled ? 'not-allowed' : 'text',
  }

  // 创建容器
  const container = new CanvasNode(containerStyle)

  // 前缀
  if (props.prefix) {
    const prefixNode = new TextNode(props.prefix, {
      fontSize,
      color: colors.textSecondary,
    })
    container.append(prefixNode)
  }

  // 输入文本显示
  const displayText = computed(() => {
    const val = props.value.value
    if (props.type === 'password') {
      return '●'.repeat(val.length)
    }
    return val
  })

  const textContent = displayText.value || props.placeholder || ''
  const isPlaceholder = !props.value.value
  const textNode = new TextNode(textContent, {
    fontSize,
    color: isPlaceholder ? colors.textPlaceholder : colors.textPrimary,
    textAlign: 'left',
    flexGrow: 1,
  })
  container.append(textNode)

  // 后缀
  if (props.suffix) {
    const suffixNode = new TextNode(props.suffix, {
      fontSize,
      color: colors.textSecondary,
    })
    container.append(suffixNode)
  }

  // 聚焦样式
  if (!props.disabled) {
    container.hoverStyle = {
      borderColor: colors.borderHover,
    }

    // 点击聚焦
    container.on('click', () => {
      isFocused.value = true
      container.style.borderColor = colors.borderFocus
      container.style.shadowColor = colors.primaryLight
      container.style.shadowBlur = 4
      props.onFocus?.()

      // 启动光标闪烁
      cursorTimer = window.setInterval(() => {
        cursorVisible.value = !cursorVisible.value
      }, 530)
    })
  }

  // 键盘输入处理
  container.on('keydown', (e: any) => {
    if (!isFocused.value || props.disabled) return

    const key = e.key as string
    let currentValue = props.value.value

    if (key === 'Backspace') {
      // 删除
      if (currentValue.length > 0) {
        props.value.value = currentValue.slice(0, -1)
        props.onChange?.(props.value.value)
      }
    } else if (key === 'Escape') {
      // 失焦
      isFocused.value = false
      container.style.borderColor = colors.border
      container.style.shadowColor = undefined
      container.style.shadowBlur = undefined
      if (cursorTimer) clearInterval(cursorTimer)
      props.onBlur?.()
    } else if (key.length === 1) {
      // 普通字符输入
      if (props.maxLength && currentValue.length >= props.maxLength) return
      if (props.type === 'number' && !/[\d.\-]/.test(key)) return

      props.value.value = currentValue + key
      props.onChange?.(props.value.value)
    }

    // 更新显示文本
    const newDisplay = props.value.value
    if (newDisplay) {
      textNode.text = props.type === 'password' ? '●'.repeat(newDisplay.length) : newDisplay
      textNode.style.color = colors.textPrimary
    } else {
      textNode.text = props.placeholder || ''
      textNode.style.color = colors.textPlaceholder
    }
  })

  return container
}
