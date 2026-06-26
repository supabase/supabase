export interface ColorTinkerContextType {
  isEnabled: boolean
  dismissColorTinker: () => void
}

export type ThemeKey = 'dark' | 'light'

export type ColorVarName =
  | '--surface-hue'
  | '--primary-hue'
  | '--surface'
  | '--elevation-step'
  | '--chroma'
  | '--contrast'

export type ColorValues = Record<ColorVarName, number>

export type StoredThemeValues = Partial<Record<ThemeKey, ColorValues>>

export interface ColorInputConfig {
  name: ColorVarName
  label: string
  min: number
  max: number
  step: number
  decimals: number
}
