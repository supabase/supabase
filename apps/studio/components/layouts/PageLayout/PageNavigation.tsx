import Link from 'next/link'
import { useCurrentPath } from 'hooks/misc/useCurrentPath'
import { cn } from 'ui'
import { NavMenu, NavMenuItem } from 'ui'

export interface NavigationItem {
  label: string
  href: string
}

interface PageNavigationProps {
  items: NavigationItem[]
  className?: string
}

const PageNavigation = ({ items, className }: PageNavigationProps) => {
  const currentPath = useCurrentPath()

  return (
    <NavMenu
      className={cn('border-none max-w-full overflow-y-hidden overflow-x-auto', className)}
      aria-label="Page navigation"
    >
      {items.map((item) => (
        <NavMenuItem key={item.label} active={currentPath === item.href}>
          <Link href={item.href}>{item.label}</Link>
        </NavMenuItem>
      ))}
    </NavMenu>
  )
}

export default PageNavigation
