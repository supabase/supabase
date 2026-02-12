import Link from 'next/link'
import { cn } from 'ui'

import { ProductMenuGroup } from '@/components/ui/ProductMenu/ProductMenu.types'

export const DocsMenu = ({
  menu,
  activePage,
}: {
  menu: Array<ProductMenuGroup>
  activePage?: string
}) => {
  return (
    <nav className="space-y-6 text-xs">
      {menu.map((group, idx) => (
        <div key={group.key || group.title || idx}>
          {group.title && (
            <div className="heading-meta mb-2 text-foreground-lighter">{group.title}</div>
          )}
          <div className="space-y-2">
            {group.items.map((item) => {
              const isActive = item.pages
                ? item.pages.includes(activePage ?? '')
                : activePage === item.key
              const isDisabled = !!item.disabled
              const content = (
                <span
                  className={cn(
                    'flex items-center',
                    isActive ? 'text-foreground' : 'text-foreground-light hover:text-foreground',
                    isDisabled && 'pointer-events-none opacity-50'
                  )}
                >
                  <span className="truncate">{item.name}</span>
                  {item.rightIcon && (
                    <span className="ml-auto text-foreground-lighter">{item.rightIcon}</span>
                  )}
                </span>
              )

              if (item.isExternal) {
                return (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block"
                  >
                    {content}
                  </a>
                )
              }

              return (
                <Link
                  key={item.key}
                  href={item.url}
                  className="block"
                  aria-current={isActive ? 'page' : undefined}
                >
                  {content}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
