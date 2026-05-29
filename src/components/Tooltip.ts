/**
 * Vuvas 组件库 - Tooltip 工具提示
 *
 * 支持功能：
 * - hover 触发显示
 * - 自定义内容
 * - 位置（top / bottom / left / right）
 * - 延迟显示/隐藏
 */

import { CanvasNode, TextNode, type NodeStyle } from '../core/node'
import { ref } from '../reactivity'
import { useColors, useSizes } from './theme'

/** Tooltip 位置 */
export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

/** Tooltip 属性 */
export interface TooltipProps {
  /** 提示内容 */
  content: string
  /** 位置 */
  placement?: TooltipPlacement
  /** 显示延迟（ms） */
  showDelay?: number
  /** 隐藏延迟（ms） */
  hideDelay?: number
}

/**
 * 为节点添加 Tooltip 功能
 * 返回包装后的节点
 */
export function withTooltip(node: CanvasNode, props: TooltipProps): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const placement = props.placement || 'top'
  const showDelay = props.showDelay ?? 200
  const hideDelay = props.hideDelay ?? 100

  const isVisible = ref(false)
  let showTimer: number | null = null
  let hideTimer: number | null = null

  // Tooltip 气泡
  const tooltip = new CanvasNode({
    display: 'flex',
    padding: [sizes.spacingXs, sizes.spacingSm],
    background: 'rgba(0, 0, 0, 0.75)',
    borderRadius: sizes.radiusSm,
    opacity: 0,
  })

  const tooltipText = new TextNode(props.content, {
    fontSize: sizes.fontSizeSm,
    color: '#ffffff',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  })
  tooltip.append(tooltipText)

  // 包装容器
  const wrapper = new CanvasNode({
    display: 'flex',
    flexDirection: placement === 'bottom' ? 'column' : (placement === 'top' ? 'column' : 'row'),
    alignItems: 'center',
    gap: sizes.spacingXs,
  })

  if (placement === 'top') {
    wrapper.append(tooltip, node)
  } else if (placement === 'bottom') {
    wrapper.append(node, tooltip)
  } else if (placement === 'left') {
    wrapper.style.flexDirection = 'row'
    wrapper.append(tooltip, node)
  } else {
    wrapper.style.flexDirection = 'row'
    wrapper.append(node, tooltip)
  }

  // hover 显示/隐藏
  node.on('mouseenter', () => {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
    showTimer = window.setTimeout(() => {
      isVisible.value = true
      tooltip.style.opacity = 1
    }, showDelay)
  })

  node.on('mouseleave', () => {
    if (showTimer) { clearTimeout(showTimer); showTimer = null }
    hideTimer = window.setTimeout(() => {
      isVisible.value = false
      tooltip.style.opacity = 0
    }, hideDelay)
  })

  return wrapper
}

/**
 * Vuvas 组件库 - Dropdown 下拉菜单
 *
 * 支持功能：
 * - 点击/hover 触发
 * - 菜单项列表
 * - 分割线
 * - 禁用项
 * - 图标支持
 */

/** 下拉菜单项 */
export interface DropdownItem {
  /** 唯一标识 */
  key: string
  /** 显示文本 */
  label: string
  /** 前缀图标 */
  icon?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否为分割线 */
  divider?: boolean
}

/** Dropdown 属性 */
export interface DropdownProps {
  /** 菜单项 */
  items: DropdownItem[]
  /** 触发方式 */
  trigger?: 'click' | 'hover'
  /** 点击菜单项回调 */
  onSelect?: (key: string) => void
}

/**
 * 为节点添加 Dropdown 功能
 */
export function withDropdown(triggerNode: CanvasNode, props: DropdownProps): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const trigger = props.trigger || 'click'
  const isOpen = ref(false)

  // 外层容器
  const wrapper = new CanvasNode({
    display: 'flex',
    flexDirection: 'column',
    gap: sizes.spacingXs,
  })

  // 下拉菜单面板
  const menu = new CanvasNode({
    display: 'flex',
    flexDirection: 'column',
    background: colors.bgPrimary,
    borderRadius: sizes.radiusMd,
    borderColor: colors.border,
    borderWidth: sizes.borderWidth,
    borderStyle: 'solid',
    shadowColor: colors.shadow,
    shadowBlur: 12,
    shadowOffsetY: 4,
    padding: [sizes.spacingXs, 0],
    opacity: 0,
    height: 0,
  })

  // 创建菜单项
  for (const item of props.items) {
    if (item.divider) {
      // 分割线
      menu.append(new CanvasNode({
        height: 1,
        background: colors.border,
        margin: [sizes.spacingXs, 0],
      }))
      continue
    }

    const menuItem = new CanvasNode({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacingSm,
      padding: [sizes.spacingSm, sizes.spacingLg],
      cursor: item.disabled ? 'not-allowed' : 'pointer',
      opacity: item.disabled ? 0.5 : 1,
    })

    if (item.icon) {
      menuItem.append(new TextNode(item.icon, {
        fontSize: sizes.fontSizeMd,
        color: colors.textSecondary,
      }))
    }

    menuItem.append(new TextNode(item.label, {
      fontSize: sizes.fontSizeMd,
      color: colors.textPrimary,
      textAlign: 'left',
    }))

    if (!item.disabled) {
      menuItem.hoverStyle = { background: colors.bgSecondary }
      menuItem.on('click', (e) => {
        e.stopPropagation()
        props.onSelect?.(item.key)
        // 关闭菜单
        isOpen.value = false
        menu.style.opacity = 0
        menu.style.height = 0
      })
    }

    menu.append(menuItem)
  }

  wrapper.append(triggerNode, menu)

  // 触发逻辑
  const toggleMenu = () => {
    isOpen.value = !isOpen.value
    menu.style.opacity = isOpen.value ? 1 : 0
    menu.style.height = isOpen.value ? undefined : 0
  }

  if (trigger === 'click') {
    triggerNode.on('click', toggleMenu)
  } else {
    triggerNode.on('mouseenter', () => {
      isOpen.value = true
      menu.style.opacity = 1
      menu.style.height = undefined
    })
    wrapper.on('mouseleave', () => {
      isOpen.value = false
      menu.style.opacity = 0
      menu.style.height = 0
    })
  }

  return wrapper
}
