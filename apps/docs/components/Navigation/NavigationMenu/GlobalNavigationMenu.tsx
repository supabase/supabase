import Link from 'next/link'
import React from 'react'
import {
  IconChevronRight,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  cn,
} from 'ui'
import { HOMEPAGE_MENU_ITEMS } from './NavigationMenu.constants'

const GlobalNavigationMenu = () => {
  return (
    <div className="h-[30px] px-10 flex gap-2 items-end w-full">
      {/* <NavigationMenu
        delayDuration={0}
        className="hidden pl-8 sm:space-x-4 lg:flex h-16"
        viewportClassName="rounded-xl bg-background"
      >
        <NavigationMenuList>
          {HOMEPAGE_MENU_ITEMS.map((section, sectionIndex) =>
            section.map((item) => (
              <NavigationMenuItem className="text-sm font-medium" key={item.label}>
                <NavigationMenuLink asChild>
                  <MenuItem
                    href={item.href}
                    title={item.label}
                    className="group-hover:bg-transparent text-foreground focus-visible:text-brand-link"
                    hoverColor="brand"
                  />
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))
          )}
        </NavigationMenuList>
      </NavigationMenu> */}
    </div>
  )
}

const MenuItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'> & {
    description?: string
    icon?: string
    hasChevron?: boolean
    hoverColor?: 'foreground' | 'brand'
  }
>(
  (
    {
      className,
      title,
      href = '',
      description,
      icon,
      hasChevron,
      children,
      hoverColor = 'foreground',
      ...props
    },
    ref
  ) => {
    return (
      <Link
        href={href}
        ref={ref}
        className={cn(
          'group/menu-item flex items-center text-foreground-light text-sm hover:text-foreground select-none gap-3 rounded-md p-2 leading-none no-underline outline-none focus-visible:ring-2 focus-visible:ring-foreground-lighter focus-visible:text-foreground',
          description && 'items-center',
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            {icon && (
              <div className="shrink-0 bg-surface-200 min-w-10 w-10 h-10 flex items-center justify-center rounded-lg">
                <svg
                  className="h-5 w-5 group-hover/menu-item:text-foreground group-focus-visible/menu-item:text-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d={icon}
                    stroke="currentColor"
                  />
                </svg>
              </div>
            )}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1">
                <p
                  className={cn(
                    'leading-snug text-foreground',
                    hoverColor === 'brand' && 'group-hover/menu-item:text-brand-link'
                  )}
                >
                  {title}
                </p>
                {hasChevron && (
                  <IconChevronRight
                    strokeWidth={2}
                    className="w-3 text-foreground transition-all will-change-transform -translate-x-1 opacity-0 group-hover/menu-item:translate-x-0 group-hover/menu-item:opacity-100"
                  />
                )}
              </div>
              {description && (
                <p className="line-clamp-1 -mb-1 leading-relaxed text-foreground-lighter group-hover/menu-item:text-foreground-light group-focus-visible/menu-item:text-foreground-light">
                  {description}
                </p>
              )}
            </div>
          </>
        )}
      </Link>
    )
  }
)

export default GlobalNavigationMenu
