'use client'

import { SidebarNavItem } from '@/types/nav'
import { cn } from 'ui/src/lib/utils/cn'
import { usePathname } from 'next/navigation'

function NavigationItem({ item }: { item: SidebarNavItem }) {
  // use next/navigation to handle active state

  const pathname = usePathname()

  const isActive = pathname === item.href

  //   console.log('pathname', pathname)
  //   console.log('item.href', item.href)

  // if (isActive) {
  //   console.log('isActive')
  // }

  return (
    <a
      href={`${item.href}`}
      className={cn(
        'block',
        'mb-0.5',
        'text-foreground-light px-3 py-0.5',
        'rounded-md',

        'hover:bg-surface-100',
        isActive && 'bg-surface-200',
        'transition'
      )}
    >
      {item.title}
    </a>
  )
}

export default NavigationItem
