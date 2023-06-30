import { PropsWithChildren } from 'react'

export const LayoutWrapper = ({ children }: PropsWithChildren<{}>) => (
  <div className="border-b last:border-0">{children}</div>
)
