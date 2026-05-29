/**
 * Vuvas 组件库 - Checkbox 复选框
 *
 * 支持功能：
 * - 选中/未选中/半选状态
 * - 禁用状态
 * - 自定义标签文本
 * - 尺寸变体
 * - 值变化回调
 */

import { CanvasNode, TextNode, type NodeStyle } from '../core/node'
import { ref, type Ref } from '../reactivity'
import { useColors, useSizes } from './theme'

/** Checkbox 属性 */
export interface CheckboxProps {
  /** 是否选中（响应式） */
  checked: Ref<boolean>
  /** 标签文本 */
  label?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 半选状态 */
  indeterminate?: boolean
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 值变化回调 */
  onChange?: (checked: boolean) => void
}

/**
 * 创建 Checkbox 复选框组件
 */
export function createCheckbox(props: CheckboxProps): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const size = props.size || 'md'

  // 复选框尺寸
  const boxSizeMap = { sm: 14, md: 18, lg: 22 }
  const fontSizeMap = { sm: sizes.fontSizeSm, md: sizes.fontSizeMd, lg: sizes.fontSizeLg }
  const boxSize = boxSizeMap[size]
  const fontSize = fontSizeMap[size]

  // 容器
  const container = new CanvasNode({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacingSm,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.5 : 1,
  })

  // 复选框方块
  const getBoxStyle = (): NodeStyle => ({
    width: boxSize,
    height: boxSize,
    borderRadius: sizes.radiusSm,
    borderColor: props.checked.value ? colors.primary : colors.border,
    borderWidth: sizes.borderWidth,
    borderStyle: 'solid',
    background: props.checked.value ? colors.primary : colors.bgPrimary,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  })

  const box = new CanvasNode(getBoxStyle())

  // 勾选标记
  const checkMark = new TextNode(
    props.indeterminate ? '—' : (props.checked.value ? '✓' : ''),
    {
      fontSize: boxSize - 4,
      color: '#ffffff',
      fontWeight: 'bold',
      textAlign: 'center',
    }
  )
  box.append(checkMark)
  container.append(box)

  // 标签文本
  if (props.label) {
    const labelNode = new TextNode(props.label, {
      fontSize,
      color: props.disabled ? colors.textDisabled : colors.textPrimary,
      textAlign: 'left',
    })
    container.append(labelNode)
  }

  // 点击切换
  if (!props.disabled) {
    container.hoverStyle = { opacity: 0.8 }
    container.on('click', () => {
      props.checked.value = !props.checked.value
      props.onChange?.(props.checked.value)

      // 更新样式
      const newStyle = getBoxStyle()
      Object.assign(box.style, newStyle)
      checkMark.text = props.checked.value ? '✓' : ''
    })
  }

  return container
}

/**
 * Vuvas 组件库 - Radio 单选框
 *
 * 支持功能：
 * - 单选组管理
 * - 禁用状态
 * - 自定义标签
 * - 尺寸变体
 */

/** Radio 属性 */
export interface RadioProps {
  /** 当前选中值（响应式） */
  modelValue: Ref<string | number>
  /** 当前 radio 的值 */
  value: string | number
  /** 标签文本 */
  label?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 值变化回调 */
  onChange?: (value: string | number) => void
}

/**
 * 创建 Radio 单选框组件
 */
export function createRadio(props: RadioProps): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const size = props.size || 'md'

  const circleSizeMap = { sm: 14, md: 18, lg: 22 }
  const fontSizeMap = { sm: sizes.fontSizeSm, md: sizes.fontSizeMd, lg: sizes.fontSizeLg }
  const circleSize = circleSizeMap[size]
  const fontSize = fontSizeMap[size]

  const isChecked = () => props.modelValue.value === props.value

  // 容器
  const container = new CanvasNode({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacingSm,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.5 : 1,
  })

  // 圆形外框
  const circle = new CanvasNode({
    width: circleSize,
    height: circleSize,
    borderRadius: sizes.radiusRound,
    borderColor: isChecked() ? colors.primary : colors.border,
    borderWidth: sizes.borderWidth,
    borderStyle: 'solid',
    background: colors.bgPrimary,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  })

  // 内部圆点
  const innerDot = new CanvasNode({
    width: isChecked() ? circleSize - 8 : 0,
    height: isChecked() ? circleSize - 8 : 0,
    borderRadius: sizes.radiusRound,
    background: colors.primary,
  })
  circle.append(innerDot)
  container.append(circle)

  // 标签
  if (props.label) {
    const labelNode = new TextNode(props.label, {
      fontSize,
      color: props.disabled ? colors.textDisabled : colors.textPrimary,
      textAlign: 'left',
    })
    container.append(labelNode)
  }

  // 点击选中
  if (!props.disabled) {
    container.hoverStyle = { opacity: 0.8 }
    container.on('click', () => {
      props.modelValue.value = props.value
      props.onChange?.(props.value)

      // 更新样式
      circle.style.borderColor = colors.primary
      innerDot.style.width = circleSize - 8
      innerDot.style.height = circleSize - 8
    })
  }

  return container
}

/**
 * 创建 Radio 组
 */
export interface RadioGroupProps {
  /** 当前选中值（响应式） */
  modelValue: Ref<string | number>
  /** 选项列表 */
  options: { value: string | number; label: string; disabled?: boolean }[]
  /** 排列方向 */
  direction?: 'row' | 'column'
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 值变化回调 */
  onChange?: (value: string | number) => void
}

export function createRadioGroup(props: RadioGroupProps): CanvasNode {
  const sizes = useSizes()

  const container = new CanvasNode({
    display: 'flex',
    flexDirection: props.direction || 'row',
    gap: sizes.spacingLg,
    flexWrap: 'wrap',
  })

  for (const option of props.options) {
    const radio = createRadio({
      modelValue: props.modelValue,
      value: option.value,
      label: option.label,
      disabled: option.disabled,
      size: props.size,
      onChange: props.onChange,
    })
    container.append(radio)
  }

  return container
}
