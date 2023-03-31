import { ReactNode } from 'react'

export interface ProductMenuGroup {
  title?: string
  isPreview?: boolean
  items: ProductMenuGroupItem[]
}

export interface ProductMenuGroupItem {
  name: string
  key: string
  url: string
  items: any[]
  icon?: ReactNode
  isExternal?: boolean
  disabled?: boolean
  label?: string
}
