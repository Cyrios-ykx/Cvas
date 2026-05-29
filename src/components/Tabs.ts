/**
 * Vuvas 组件库 - Tabs 标签页
 *
 * 支持功能：
 * - 多标签切换
 * - 激活状态指示器
 * - 禁用标签
 * - 尺寸变体
 * - 标签位置（top）
 */

import { CanvasNode, TextNode, type NodeStyle } from '../core/node'
import { ref, type Ref } from '../reactivity'
import { useColors, useSizes } from './theme'

/** Tab 项定义 */
export interface TabItem {
  /** 唯一标识 */
  key: string
  /** 标签文本 */
  label: string
  /** 是否禁用 */
  disabled?: boolean
}

/** Tabs 属性 */
export interface TabsProps {
  /** 当前激活的 tab key（响应式） */
  activeKey: Ref<string>
  /** 标签项列表 */
  items: TabItem[]
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 切换回调 */
  onChange?: (key: string) => void
}

/**
 * 创建 Tabs 标签页组件
 */
export function createTabs(props: TabsProps): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const size = props.size || 'md'

  const fontSizeMap = { sm: sizes.fontSizeSm, md: sizes.fontSizeMd, lg: sizes.fontSizeLg }
  const fontSize = fontSizeMap[size]

  // 标签栏容器
  const tabBar = new CanvasNode({
    display: 'flex',
    flexDirection: 'row',
    borderColor: colors.border,
    borderWidth: 0,
    borderStyle: 'solid',
    gap: 0,
  })

  // 底部分割线
  const divider = new CanvasNode({
    height: 1,
    background: colors.border,
  })

  // 创建各标签
  const tabNodes: CanvasNode[] = []
  for (const item of props.items) {
    const isActive = item.key === props.activeKey.value

    const tab = new CanvasNode({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: [sizes.spacingMd, sizes.spacingLg],
      cursor: item.disabled ? 'not-allowed' : 'pointer',
      opacity: item.disabled ? 0.5 : 1,
      borderColor: isActive ? colors.primary : 'transparent',
      borderWidth: 0,
      borderStyle: 'solid',
    })

    const tabText = new TextNode(item.label, {
      fontSize,
      color: isActive ? colors.primary : colors.textSecondary,
      fontWeight: isActive ? 'bold' : 'normal',
    })

    // 底部指示条
    const indicator = new CanvasNode({
      height: 2,
      background: isActive ? colors.primary : 'transparent',
      borderRadius: 1,
    })

    tab.append(tabText)
    tabNodes.push(tab)

    if (!item.disabled) {
      tab.hoverStyle = { background: colors.bgSecondary }
      tab.on('click', () => {
        props.activeKey.value = item.key
        props.onChange?.(item.key)

        // 更新所有标签样式
        tabNodes.forEach((node, idx) => {
          const tabItem = props.items[idx]
          const active = tabItem.key === item.key
          const textChild = node.children[0] as TextNode
          textChild.style.color = active ? colors.primary : colors.textSecondary
          textChild.style.fontWeight = active ? 'bold' : 'normal'
          node.style.borderColor = active ? colors.primary : 'transparent'
        })
      })
    }

    tabBar.append(tab)
  }

  // 外层容器
  const container = new CanvasNode({
    display: 'flex',
    flexDirection: 'column',
  })
  container.append(tabBar, divider)

  return container
}

/**
 * Vuvas 组件库 - Table 表格
 *
 * 支持功能：
 * - 列定义（标题、宽度、对齐）
 * - 数据行渲染
 * - 斑马纹
 * - 表头固定样式
 * - 边框模式
 */

/** 表格列定义 */
export interface TableColumn {
  /** 列标识（对应数据字段名） */
  key: string
  /** 列标题 */
  title: string
  /** 列宽度 */
  width?: number
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
}

/** Table 属性 */
export interface TableProps {
  /** 列定义 */
  columns: TableColumn[]
  /** 数据源 */
  data: Record<string, any>[]
  /** 是否显示斑马纹 */
  stripe?: boolean
  /** 是否显示边框 */
  bordered?: boolean
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * 创建 Table 表格组件
 */
export function createTable(props: TableProps): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const size = props.size || 'md'

  const fontSizeMap = { sm: sizes.fontSizeSm, md: sizes.fontSizeMd, lg: sizes.fontSizeLg }
  const paddingMap = { sm: sizes.spacingSm, md: sizes.spacingMd, lg: sizes.spacingLg }
  const fontSize = fontSizeMap[size]
  const cellPadding = paddingMap[size]

  // 表格容器
  const table = new CanvasNode({
    display: 'flex',
    flexDirection: 'column',
    borderRadius: sizes.radiusMd,
    borderColor: props.bordered ? colors.border : 'transparent',
    borderWidth: props.bordered ? sizes.borderWidth : 0,
    borderStyle: 'solid',
    overflow: 'hidden',
  })

  // 表头
  const headerRow = new CanvasNode({
    display: 'flex',
    flexDirection: 'row',
    background: colors.bgSecondary,
    borderColor: colors.border,
    borderWidth: 0,
    borderStyle: 'solid',
  })

  for (const col of props.columns) {
    const headerCell = new CanvasNode({
      display: 'flex',
      alignItems: 'center',
      justifyContent: col.align === 'right' ? 'flex-end' : (col.align === 'center' ? 'center' : 'flex-start'),
      padding: [cellPadding, cellPadding],
      width: col.width,
      flexGrow: col.width ? 0 : 1,
    })
    const headerText = new TextNode(col.title, {
      fontSize,
      fontWeight: 'bold',
      color: colors.textPrimary,
      textAlign: col.align || 'left',
    })
    headerCell.append(headerText)
    headerRow.append(headerCell)
  }
  table.append(headerRow)

  // 分割线
  table.append(new CanvasNode({
    height: 1,
    background: colors.border,
  }))

  // 数据行
  for (let rowIdx = 0; rowIdx < props.data.length; rowIdx++) {
    const rowData = props.data[rowIdx]
    const isStripe = props.stripe && rowIdx % 2 === 1

    const row = new CanvasNode({
      display: 'flex',
      flexDirection: 'row',
      background: isStripe ? colors.bgSecondary : colors.bgPrimary,
    })
    row.hoverStyle = { background: colors.primaryLight }

    for (const col of props.columns) {
      const cell = new CanvasNode({
        display: 'flex',
        alignItems: 'center',
        justifyContent: col.align === 'right' ? 'flex-end' : (col.align === 'center' ? 'center' : 'flex-start'),
        padding: [cellPadding, cellPadding],
        width: col.width,
        flexGrow: col.width ? 0 : 1,
      })
      const cellText = new TextNode(String(rowData[col.key] ?? ''), {
        fontSize,
        color: colors.textPrimary,
        textAlign: col.align || 'left',
      })
      cell.append(cellText)
      row.append(cell)
    }

    table.append(row)

    // 行间分割线
    if (rowIdx < props.data.length - 1) {
      table.append(new CanvasNode({
        height: 1,
        background: colors.border,
        opacity: 0.5,
      }))
    }
  }

  return table
}
