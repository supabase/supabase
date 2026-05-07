import { ReactNode } from 'react'

export interface Route {
  key: string
  label: string
  icon: ReactNode
  link?: string
  disabled?: boolean
  linkElement?: ReactNode
  items?: any | Route[]
}
