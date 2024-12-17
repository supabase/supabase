'use client'

import { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavMenu, NavMenuItem } from 'ui'

export function ProjectPageNavigation({ items }: { items: ProductMenuGroup[] }) {
  const pathname = usePathname()

  return (
    <NavMenu className="px-5 pt-2 bg-dash-sidebar">
      {items.map((item) => {
        return (
          <>
            {/* <span className="text-foreground-muted">{item.title}</span> */}
            {item.items &&
              item.items.map((item) => {
                return (
                  <>
                    <Link href={item.url}>
                      <NavMenuItem active={pathname?.includes(item.url)} className="py-2">
                        {item.name}
                      </NavMenuItem>
                    </Link>
                  </>
                )
              })}
          </>
        )
      })}
    </NavMenu>
  )
}
