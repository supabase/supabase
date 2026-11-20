'use client'

import { isFeatureEnabled } from 'common'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { Fragment } from 'react'
import { DropdownMenuItem, DropdownMenuSeparator } from 'ui'
import { TopNavDropdown, TopNavThemeGroup } from 'ui-patterns/TopNav/TopNavDropdown'

import MenuIconPicker from './MenuIconPicker'

const menu = [
  [
    isFeatureEnabled('docs:navigation_dropdown_links_home')
      ? {
          label: 'Supabase.com',
          icon: 'home',
          href: 'https://supabase.com',
          otherProps: {
            target: '_blank',
            rel: 'noreferrer noopener',
          },
        }
      : {
          label: 'Dashboard',
          icon: 'home',
          href: '../dashboard',
        },
    {
      label: 'GitHub',
      icon: 'github',
      href: 'https://github.com/supabase/supabase',
      otherProps: {
        target: '_blank',
        rel: 'noreferrer noopener',
      },
    },
    {
      label: 'Support',
      icon: 'support',
      href: 'https://supabase.com/support',
      otherProps: {
        target: '_blank',
        rel: 'noreferrer noopener',
      },
    },
  ],
]

const DocsTopNavDropdown = () => {
  const { theme, setTheme } = useTheme()

  return (
    <TopNavDropdown>
      {menu.map((menuSection) => (
        <Fragment key={menuSection[0].label}>
          {menuSection.map((sectionItem) => (
            <DropdownMenuItem key={sectionItem.label} asChild className="gap-2">
              <Link href={sectionItem.href} {...sectionItem.otherProps}>
                <MenuIconPicker icon={sectionItem.icon} className="text-foreground-lighter" />
                {sectionItem.label}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
        </Fragment>
      ))}
      <TopNavThemeGroup value={theme} onValueChange={setTheme} />
    </TopNavDropdown>
  )
}

export default DocsTopNavDropdown
