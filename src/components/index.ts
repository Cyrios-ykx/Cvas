/**
 * Vuvas 组件库 - 统一导出
 *
 * 提供所有 UI 组件的统一入口
 */

// 主题系统
export {
  useTheme,
  useColors,
  useSizes,
  setTheme,
  toggleTheme,
  isDarkMode,
  createTheme,
  lightTheme,
  darkTheme,
} from './theme'
export type { Theme, ColorTokens, SizeTokens } from './theme'

// Input 输入框
export { createInput } from './Input'
export type { InputProps, InputSize } from './Input'

// Checkbox 复选框 & Radio 单选框
export { createCheckbox, createRadio, createRadioGroup } from './Checkbox'
export type { CheckboxProps, RadioProps, RadioGroupProps } from './Checkbox'

// Switch 开关
export { createSwitch } from './Switch'
export type { SwitchProps } from './Switch'

// Select 下拉选择
export { createSelect } from './Select'
export type { SelectProps, SelectOption } from './Select'

// Modal 弹窗 & Toast 消息提示
export { createModal, createToast, Message } from './Modal'
export type { ModalProps, ToastOptions, ToastType } from './Modal'

// Tabs 标签页 & Table 表格
export { createTabs, createTable } from './Tabs'
export type { TabsProps, TabItem, TableProps, TableColumn } from './Tabs'

// Tooltip 工具提示 & Dropdown 下拉菜单
export { withTooltip, withDropdown } from './Tooltip'
export type { TooltipProps, TooltipPlacement, DropdownProps, DropdownItem } from './Tooltip'

// Progress 进度条 & Slider 滑块
export { createProgress, createSlider } from './Progress'
export type { ProgressProps, ProgressStatus, SliderProps } from './Progress'
