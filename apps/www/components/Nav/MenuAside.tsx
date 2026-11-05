import Panel from '~/components/Panel'
import type { ReactNode } from 'react'

export interface MenuAsideProps {
  children: ReactNode
  className?: string
}

export const MenuAside = ({ children, className }: MenuAsideProps) => (
  <Panel
    outerClassName={className}
    innerClassName="grid content-start p-6 pb-4 [&>section:last-of-type]:mb-0"
  >
    {children}
  </Panel>
)
