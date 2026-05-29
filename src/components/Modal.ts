/**
 * Vuvas 组件库 - Modal 弹窗
 *
 * 支持功能：
 * - 标题 + 内容 + 底部按钮
 * - 遮罩层
 * - 关闭按钮
 * - 确认/取消回调
 * - 自定义宽度
 * - 动画效果（淡入淡出）
 */

import { CanvasNode, TextNode, type NodeStyle } from '../core/node'
import { ref, type Ref } from '../reactivity'
import { useColors, useSizes } from './theme'

/** Modal 属性 */
export interface ModalProps {
  /** 是否显示（响应式） */
  visible: Ref<boolean>
  /** 标题 */
  title?: string
  /** 内容文本 */
  content?: string
  /** 宽度 */
  width?: number
  /** 是否显示关闭按钮 */
  closable?: boolean
  /** 是否点击遮罩关闭 */
  maskClosable?: boolean
  /** 确认按钮文本 */
  okText?: string
  /** 取消按钮文本 */
  cancelText?: string
  /** 是否显示底部按钮 */
  showFooter?: boolean
  /** 确认回调 */
  onOk?: () => void
  /** 取消回调 */
  onCancel?: () => void
  /** 关闭回调 */
  onClose?: () => void
}

/**
 * 创建 Modal 弹窗组件
 */
export function createModal(props: ModalProps): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const width = props.width || 420

  // 遮罩层
  const mask = new CanvasNode({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: colors.bgOverlay,
    opacity: props.visible.value ? 1 : 0,
  })

  // 点击遮罩关闭
  if (props.maskClosable !== false) {
    mask.on('click', (e) => {
      if (e.target === mask) {
        closeModal()
      }
    })
  }

  // 弹窗主体
  const modal = new CanvasNode({
    display: 'flex',
    flexDirection: 'column',
    width,
    background: colors.bgPrimary,
    borderRadius: sizes.radiusLg,
    shadowColor: colors.shadow,
    shadowBlur: 20,
    shadowOffsetY: 8,
    overflow: 'hidden',
  })

  // 头部
  const header = new CanvasNode({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: [sizes.spacingLg, sizes.spacingXl],
    borderColor: colors.bgTertiary,
    borderWidth: 0,
    borderStyle: 'solid',
  })

  const titleNode = new TextNode(props.title || '提示', {
    fontSize: sizes.fontSizeLg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'left',
  })
  header.append(titleNode)

  // 关闭按钮
  if (props.closable !== false) {
    const closeBtn = new TextNode('✕', {
      fontSize: sizes.fontSizeLg,
      color: colors.textSecondary,
      cursor: 'pointer',
    })
    closeBtn.on('click', () => closeModal())
    closeBtn.hoverStyle = { color: colors.textPrimary }
    header.append(closeBtn)
  }

  modal.append(header)

  // 内容区域
  if (props.content) {
    const body = new CanvasNode({
      display: 'flex',
      padding: [sizes.spacingMd, sizes.spacingXl],
    })
    const contentNode = new TextNode(props.content, {
      fontSize: sizes.fontSizeMd,
      color: colors.textSecondary,
      textAlign: 'left',
      lineHeight: sizes.fontSizeMd * 1.6,
    })
    body.append(contentNode)
    modal.append(body)
  }

  // 底部按钮
  if (props.showFooter !== false) {
    const footer = new CanvasNode({
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: sizes.spacingMd,
      padding: [sizes.spacingLg, sizes.spacingXl],
    })

    // 取消按钮
    if (props.cancelText !== undefined || props.onCancel) {
      const cancelBtn = new CanvasNode({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: [sizes.spacingSm, sizes.spacingLg],
        borderRadius: sizes.radiusMd,
        borderColor: colors.border,
        borderWidth: sizes.borderWidth,
        borderStyle: 'solid',
        background: colors.bgPrimary,
        cursor: 'pointer',
      })
      cancelBtn.hoverStyle = { borderColor: colors.primary, background: colors.primaryLight }
      const cancelText = new TextNode(props.cancelText || '取消', {
        fontSize: sizes.fontSizeMd,
        color: colors.textPrimary,
      })
      cancelBtn.append(cancelText)
      cancelBtn.on('click', () => {
        props.onCancel?.()
        closeModal()
      })
      footer.append(cancelBtn)
    }

    // 确认按钮
    const okBtn = new CanvasNode({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: [sizes.spacingSm, sizes.spacingLg],
      borderRadius: sizes.radiusMd,
      background: colors.primary,
      cursor: 'pointer',
    })
    okBtn.hoverStyle = { background: colors.primaryHover }
    const okText = new TextNode(props.okText || '确定', {
      fontSize: sizes.fontSizeMd,
      color: '#ffffff',
      fontWeight: 'bold',
    })
    okBtn.append(okText)
    okBtn.on('click', () => {
      props.onOk?.()
      closeModal()
    })
    footer.append(okBtn)

    modal.append(footer)
  }

  mask.append(modal)

  // 关闭方法
  function closeModal() {
    props.visible.value = false
    mask.style.opacity = 0
    props.onClose?.()
  }

  return mask
}

/**
 * Vuvas 组件库 - Toast / Message 消息提示
 *
 * 支持功能：
 * - 多种类型（success / warning / error / info）
 * - 自动消失
 * - 自定义持续时间
 * - 堆叠显示
 */

/** Toast 类型 */
export type ToastType = 'success' | 'warning' | 'error' | 'info'

/** Toast 配置 */
export interface ToastOptions {
  /** 消息内容 */
  message: string
  /** 类型 */
  type?: ToastType
  /** 持续时间（ms），0 表示不自动关闭 */
  duration?: number
  /** 关闭回调 */
  onClose?: () => void
}

/**
 * 创建 Toast 消息提示组件
 */
export function createToast(options: ToastOptions): CanvasNode {
  const colors = useColors()
  const sizes = useSizes()
  const type = options.type || 'info'
  const duration = options.duration ?? 3000

  // 类型对应的颜色和图标
  const typeConfig: Record<ToastType, { icon: string; color: string; bg: string }> = {
    success: { icon: '✓', color: colors.success, bg: colors.successLight },
    warning: { icon: '⚠', color: colors.warning, bg: colors.warningLight },
    error: { icon: '✕', color: colors.danger, bg: colors.dangerLight },
    info: { icon: 'ℹ', color: colors.info, bg: colors.infoLight },
  }

  const config = typeConfig[type]

  // Toast 容器
  const toast = new CanvasNode({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacingSm,
    padding: [sizes.spacingMd, sizes.spacingLg],
    background: config.bg,
    borderRadius: sizes.radiusMd,
    borderColor: config.color,
    borderWidth: sizes.borderWidth,
    borderStyle: 'solid',
    shadowColor: colors.shadowLight,
    shadowBlur: 8,
    shadowOffsetY: 2,
  })

  // 图标
  const icon = new TextNode(config.icon, {
    fontSize: sizes.fontSizeLg,
    color: config.color,
    fontWeight: 'bold',
  })

  // 消息文本
  const message = new TextNode(options.message, {
    fontSize: sizes.fontSizeMd,
    color: colors.textPrimary,
    textAlign: 'left',
  })

  toast.append(icon, message)

  // 自动消失
  if (duration > 0) {
    setTimeout(() => {
      toast.style.opacity = 0
      options.onClose?.()
    }, duration)
  }

  return toast
}

/**
 * 消息提示快捷方法
 */
export const Message = {
  success(message: string, duration?: number) {
    return createToast({ message, type: 'success', duration })
  },
  warning(message: string, duration?: number) {
    return createToast({ message, type: 'warning', duration })
  },
  error(message: string, duration?: number) {
    return createToast({ message, type: 'error', duration })
  },
  info(message: string, duration?: number) {
    return createToast({ message, type: 'info', duration })
  },
}
