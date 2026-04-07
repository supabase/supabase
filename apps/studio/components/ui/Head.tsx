import type { ReactNode } from 'react'

export type HeadProvider = ({ children }: { children: ReactNode }) => ReactNode

export interface HeadProps {
  HeadProvider: HeadProvider
  title?: string
}

export function Head({ HeadProvider, title }: HeadProps): ReactNode {
  return <HeadProvider>{title && <title>{title}</title>}</HeadProvider>
}
