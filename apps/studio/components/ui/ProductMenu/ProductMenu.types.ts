import { ReactNode } from 'react'

export interface ProductMenuGroup {
  title?: string
  /** Set to "main" if page is on a '/' route */
  key?: string | 'main'
  isPreview?: boolean
  items: ProductMenuGroupItem[]
}

export interface ProductMenuGroupItem {
  name: string
  key: string
  url: string
  items: any[]
  icon?: ReactNode
  rightIcon?: ReactNode
  isExternal?: boolean
  disabled?: boolean
  label?: string
  pages?: (string | undefined)[]
}
