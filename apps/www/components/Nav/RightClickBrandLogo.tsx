import React, { Fragment, PropsWithChildren } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from 'ui/src/components/shadcn/ui/context-menu'

import * as supabaseLogoWordmarkDark from 'common/assets/images/supabase-logo-wordmark--dark.png'
import * as supabaseLogoWordmarkLight from 'common/assets/images/supabase-logo-wordmark--light.png'

interface MenuItem extends PropsWithChildren {
  label: string
  type: 'clipboard' | 'download' | 'link'
  icon?: string
  onClick?: VoidFunction
  action?: string
  href?: string
}

const contextMenu: MenuItem[][] = [
  [
    {
      label: 'Copy logo as SVG',
      type: 'clipboard',
    },
    {
      label: 'Copy dark wordmark as SVG',
      type: 'clipboard',
    },
    {
      label: 'Copy light wordmark as SVG',
      type: 'clipboard',
    },
    {
      label: 'Download brand assets',
      type: 'download',
      action: `/brand-assets.zip`,
    },
  ],
  [
    {
      label: 'Visit brand guidelines',
      type: 'link',
      href: '/brand-assets',
    },
    {
      label: 'Visit design system',
      type: 'link',
      href: 'https://supabase.com/brand-assets',
    },
  ],
]

const RightClickBrandLogo = () => {
  const MenuItem = ({ type, children, ...menuItem }: MenuItem) => {
    switch (type) {
      case 'download':
        return (
          <form method="get" action={`/brand-assets.zip`}>
            <button type="submit">{children}</button>
          </form>
        )
      case 'link':
        return (
          <Link href={menuItem.href ?? ''} {...menuItem}>
            {children}
          </Link>
        )
      case 'clipboard':
        return <button {...menuItem}>{children}</button>
    }
  }
  return (
    <ContextMenu onOpenChange={(e) => console.log(e)}>
      <ContextMenuTrigger asChild>
        <Link
          href="/"
          className="block w-auto h-6 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded-sm"
        >
          <Image
            src={supabaseLogoWordmarkLight}
            width={124}
            height={24}
            alt="Supabase Logo"
            className="dark:hidden"
            priority
          />
          <Image
            src={supabaseLogoWordmarkDark}
            width={124}
            height={24}
            alt="Supabase Logo"
            className="hidden dark:block"
            priority
          />
        </Link>
      </ContextMenuTrigger>
      <ContextMenuContent alignOffset={50} className="p-0">
        {contextMenu.map((section, sectionIdx) => (
          <Fragment key={`cxtMenu-section-${sectionIdx}`}>
            {sectionIdx !== 0 && <Divider />}
            <div className="p-1">
              {section.map((menuItem) => (
                <ContextMenuItem key={menuItem.label}>
                  <MenuItem {...menuItem}>{menuItem.label}</MenuItem>
                </ContextMenuItem>
              ))}{' '}
            </div>
          </Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  )
}

const Divider = () => {
  return <div className="h-px w-full bg-border my-1"></div>
}
export default RightClickBrandLogo
