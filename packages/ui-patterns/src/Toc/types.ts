import type { ReactNode } from 'react'

export interface TOCItemType {
  title: ReactNode
  url: string
  depth: number
}

export type TableOfContents = TOCItemType[]
