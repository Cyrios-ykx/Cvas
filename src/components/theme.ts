/**
 * Vuvas 主题系统
 *
 * 提供设计 token 和主题变量，支持亮色/暗色模式切换。
 * 所有组件库组件都基于此主题系统获取样式。
 */

import { ref, computed, type Ref } from '../reactivity'

// ============================================================
// 设计 Token 定义
// ============================================================

/** 颜色 Token */
export interface ColorTokens {
  /** 主色 */
  primary: string
  primaryHover: string
  primaryActive: string
  primaryLight: string

  /** 成功色 */
  success: string
  successHover: string
  successLight: string

  /** 警告色 */
  warning: string
  warningHover: string
  warningLight: string

  /** 危险色 */
  danger: string
  dangerHover: string
  dangerLight: string

  /** 信息色 */
  info: string
  infoHover: string
  infoLight: string

  /** 中性色 */
  textPrimary: string
  textSecondary: string
  textPlaceholder: string
  textDisabled: string

  /** 背景色 */
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  bgOverlay: string

  /** 边框色 */
  border: string
  borderHover: string
  borderFocus: string

  /** 阴影 */
  shadow: string
  shadowLight: string
}

/** 尺寸 Token */
export interface SizeTokens {
  /** 字体大小 */
  fontSizeXs: number
  fontSizeSm: number
  fontSizeMd: number
  fontSizeLg: number
  fontSizeXl: number

  /** 圆角 */
  radiusSm: number
  radiusMd: number
  radiusLg: number
  radiusRound: number

  /** 间距 */
  spacingXs: number
  spacingSm: number
  spacingMd: number
  spacingLg: number
  spacingXl: number

  /** 组件高度 */
  heightSm: number
  heightMd: number
  heightLg: number

  /** 边框宽度 */
  borderWidth: number
}

/** 完整主题定义 */
export interface Theme {
  name: string
  colors: ColorTokens
  sizes: SizeTokens
}

// ============================================================
// 预设主题
// ============================================================

/** 亮色主题 */
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#42b883',
    primaryHover: '#33a06f',
    primaryActive: '#2d8f63',
    primaryLight: '#e8f8f0',

    success: '#52c41a',
    successHover: '#45a818',
    successLight: '#f0fae5',

    warning: '#faad14',
    warningHover: '#d99412',
    warningLight: '#fffbe6',

    danger: '#f5222d',
    dangerHover: '#d91a25',
    dangerLight: '#fff1f0',

    info: '#1890ff',
    infoHover: '#1478d9',
    infoLight: '#e6f7ff',

    textPrimary: '#1a1a2e',
    textSecondary: '#666666',
    textPlaceholder: '#999999',
    textDisabled: '#c0c4cc',

    bgPrimary: '#ffffff',
    bgSecondary: '#f5f7fa',
    bgTertiary: '#ebeef5',
    bgOverlay: 'rgba(0, 0, 0, 0.5)',

    border: '#dcdfe6',
    borderHover: '#b0b3b8',
    borderFocus: '#42b883',

    shadow: 'rgba(0, 0, 0, 0.12)',
    shadowLight: 'rgba(0, 0, 0, 0.06)',
  },
  sizes: {
    fontSizeXs: 11,
    fontSizeSm: 12,
    fontSizeMd: 14,
    fontSizeLg: 16,
    fontSizeXl: 20,

    radiusSm: 4,
    radiusMd: 8,
    radiusLg: 12,
    radiusRound: 999,

    spacingXs: 4,
    spacingSm: 8,
    spacingMd: 12,
    spacingLg: 16,
    spacingXl: 24,

    heightSm: 28,
    heightMd: 36,
    heightLg: 44,

    borderWidth: 1,
  }
}

/** 暗色主题 */
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#42b883',
    primaryHover: '#5ccf9a',
    primaryActive: '#33a06f',
    primaryLight: '#1a3a2a',

    success: '#67c23a',
    successHover: '#7ed956',
    successLight: '#1a3a1a',

    warning: '#e6a23c',
    warningHover: '#f0b856',
    warningLight: '#3a3a1a',

    danger: '#f56c6c',
    dangerHover: '#f78989',
    dangerLight: '#3a1a1a',

    info: '#409eff',
    infoHover: '#66b1ff',
    infoLight: '#1a2a3a',

    textPrimary: '#e5eaf3',
    textSecondary: '#a3a6ad',
    textPlaceholder: '#6c6e72',
    textDisabled: '#4c4d4f',

    bgPrimary: '#1d1e1f',
    bgSecondary: '#2b2b2c',
    bgTertiary: '#363637',
    bgOverlay: 'rgba(0, 0, 0, 0.7)',

    border: '#4c4d4f',
    borderHover: '#636466',
    borderFocus: '#42b883',

    shadow: 'rgba(0, 0, 0, 0.4)',
    shadowLight: 'rgba(0, 0, 0, 0.2)',
  },
  sizes: {
    fontSizeXs: 11,
    fontSizeSm: 12,
    fontSizeMd: 14,
    fontSizeLg: 16,
    fontSizeXl: 20,

    radiusSm: 4,
    radiusMd: 8,
    radiusLg: 12,
    radiusRound: 999,

    spacingXs: 4,
    spacingSm: 8,
    spacingMd: 12,
    spacingLg: 16,
    spacingXl: 24,

    heightSm: 28,
    heightMd: 36,
    heightLg: 44,

    borderWidth: 1,
  }
}

// ============================================================
// 主题管理器
// ============================================================

/** 当前主题（响应式） */
const currentThemeRef: Ref<Theme> = ref(lightTheme) as Ref<Theme>

/**
 * 获取当前主题
 */
export function useTheme(): Ref<Theme> {
  return currentThemeRef
}

/**
 * 获取当前主题的颜色 token
 */
export function useColors(): ColorTokens {
  return currentThemeRef.value.colors
}

/**
 * 获取当前主题的尺寸 token
 */
export function useSizes(): SizeTokens {
  return currentThemeRef.value.sizes
}

/**
 * 切换主题
 */
export function setTheme(theme: Theme): void {
  currentThemeRef.value = theme
}

/**
 * 切换亮色/暗色模式
 */
export function toggleTheme(): void {
  if (currentThemeRef.value.name === 'light') {
    currentThemeRef.value = darkTheme
  } else {
    currentThemeRef.value = lightTheme
  }
}

/**
 * 判断当前是否为暗色模式
 */
export function isDarkMode(): boolean {
  return currentThemeRef.value.name === 'dark'
}

/**
 * 创建自定义主题（基于亮色主题覆盖）
 */
export function createTheme(overrides: {
  name?: string
  colors?: Partial<ColorTokens>
  sizes?: Partial<SizeTokens>
}): Theme {
  return {
    name: overrides.name || 'custom',
    colors: { ...lightTheme.colors, ...overrides.colors },
    sizes: { ...lightTheme.sizes, ...overrides.sizes },
  }
}
