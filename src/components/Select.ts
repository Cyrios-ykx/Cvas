/**
 * Vuvas 组件库 - Select 下拉选择
 *
 * 支持功能：
 * - 单选下拉
 * - 选项列表展开/收起
 * - 禁用状态
 * - placeholder
 * - 尺寸变体
 * - 选项禁用
 */

import { CanvasNode, TextNode, type NodeStyle } from '../core/node'
import { ref, type Ref } from '../reactivity'
import { useColors, useSizes } from './theme'

/** Select 选项 */
export interface SelectOption {
  /** 选项值 */
  value: string | number
  /** 显示文本 */
  label: string
  /** 是否禁用 */
  disabled?: boolean
}

/** Select 属性 */
export interface SelectProps {
  /** 当前选中值（响应式） */
  modelValue: Ref<string | number | null>
  /** 选项列表 */
  options: SelectOption[]
  /** 占位文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 值变化回调 */
  onChange?: (value: string | number) => void
}

/**
 * 创建 Select 下拉选择组件
 */
export function createSelect(props: SelectProps): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const size = props.size || 'md'
  const isOpen = ref(false)

  const heightMap = { sm: sizes.heightSm, md: sizes.heightMd, lg: sizes.heightLg }
  const fontSizeMap = { sm: sizes.fontSizeSm, md: sizes.fontSizeMd, lg: sizes.fontSizeLg }
  const height = heightMap[size]
  const fontSize = fontSizeMap[size]

  // 获取当前选中的标签
  const getSelectedLabel = (): string => {
    const selected = props.options.find(o => o.value === props.modelValue.value)
    return selected ? selected.label : (props.placeholder || '请选择')
  }

  // 外层容器
  const wrapper = new CanvasNode({
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  })

  // 触发器（显示当前选中值）
  const trigger = new CanvasNode({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height,
    padding: [0, sizes.spacingMd],
    background: props.disabled ? colors.bgTertiary : colors.bgPrimary,
    borderRadius: sizes.radiusMd,
    borderColor: colors.border,
    borderWidth: sizes.borderWidth,
    borderStyle: 'solid',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.6 : 1,
  })

  const selectedText = new TextNode(getSelectedLabel(), {
    fontSize,
    color: props.modelValue.value !== null ? colors.textPrimary : colors.textPlaceholder,
    textAlign: 'left',
    flexGrow: 1,
  })

  const arrow = new TextNode('▼', {
    fontSize: sizes.fontSizeXs,
    color: colors.textSecondary,
  })

  trigger.append(selectedText, arrow)
  wrapper.append(trigger)

  // 下拉面板
  const dropdown = new CanvasNode({
    display: 'flex',
    flexDirection: 'column',
    background: colors.bgPrimary,
    borderRadius: sizes.radiusMd,
    borderColor: colors.border,
    borderWidth: sizes.borderWidth,
    borderStyle: 'solid',
    shadowColor: colors.shadow,
    shadowBlur: 8,
    shadowOffsetY: 4,
    padding: [sizes.spacingXs, 0],
    opacity: 0, // 初始隐藏
    height: 0,
  })

  // 创建选项
  for (const option of props.options) {
    const isSelected = option.value === props.modelValue.value
    const optionNode = new CanvasNode({
      display: 'flex',
      alignItems: 'center',
      height: height - 4,
      padding: [0, sizes.spacingMd],
      background: isSelected ? colors.primaryLight : 'transparent',
      cursor: option.disabled ? 'not-allowed' : 'pointer',
      opacity: option.disabled ? 0.5 : 1,
    })

    const optionText = new TextNode(option.label, {
      fontSize,
      color: isSelected ? colors.primary : colors.textPrimary,
      textAlign: 'left',
    })

    optionNode.append(optionText)

    if (!option.disabled) {
      optionNode.hoverStyle = {
        background: colors.bgSecondary,
      }
      optionNode.on('click', (e) => {
        e.stopPropagation()
        props.modelValue.value = option.value
        props.onChange?.(option.value)

        // 更新显示
        selectedText.text = option.label
        selectedText.style.color = colors.textPrimary

        // 关闭下拉
        isOpen.value = false
        dropdown.style.opacity = 0
        dropdown.style.height = 0
        arrow.text = '▼'
      })
    }

    dropdown.append(optionNode)
  }

  wrapper.append(dropdown)

  // 点击触发器展开/收起
  if (!props.disabled) {
    trigger.hoverStyle = { borderColor: colors.borderHover }
    trigger.on('click', () => {
      isOpen.value = !isOpen.value
      if (isOpen.value) {
        dropdown.style.opacity = 1
        dropdown.style.height = undefined // 自动高度
        arrow.text = '▲'
        trigger.style.borderColor = colors.borderFocus
      } else {
        dropdown.style.opacity = 0
        dropdown.style.height = 0
        arrow.text = '▼'
        trigger.style.borderColor = colors.border
      }
    })
  }

  return wrapper
}
