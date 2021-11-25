import { ReactNode } from 'react'

export interface ProductMenuGroup {
  title: string
  isPreview?: boolean
  items: ProductMenuItem[]
}

export interface ProductMenuItem {
  name: string
  key: string
  url: string
  items: any[]
  icon?: ReactNode
  isExternal?: boolean
}
