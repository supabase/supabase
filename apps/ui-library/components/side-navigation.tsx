'use client'

import Link from 'next/link'

import { NavigationItem } from '@/components/side-navigation-item'
import { gettingStarted } from '@/config/docs'
import { getLibraryBlockHref, libraryBlocks, libraryCategories } from '@/config/library'
import { useFramework } from '@/context/framework-context'
import { useMobileMenu } from '@/hooks/use-mobile-menu'

export function SideNavigation() {
  const { framework } = useFramework()
  const { setOpen } = useMobileMenu()

  return (
    <nav aria-label="Library navigation" className="flex min-w-0 flex-col p-5">
      <Link href="/" onClick={() => setOpen(false)} className="mb-8 pr-6 text-sm font-medium">
        Supabase Library
      </Link>
      <div className="mb-6 space-y-0.5">
        <p className="mb-2 px-3 text-xs text-foreground-lighter">Getting started</p>
        <NavigationItem item={{ title: 'Browse All Blocks', href: '/', items: [] }} />
        {gettingStarted.items.map((item) => (
          <NavigationItem item={item} key={item.href} />
        ))}
      </div>
      {libraryCategories.map((category) => {
        const blocks = libraryBlocks.filter((block) => block.category === category.name)
        if (blocks.length === 0) return null

        return (
          <div key={category.name} className="mb-6 space-y-0.5">
            <p className="mb-2 px-3 text-xs text-foreground-lighter">{category.name}</p>
            {blocks.map((block) => (
              <NavigationItem
                key={block.slug}
                item={{
                  title: block.title,
                  href: getLibraryBlockHref(block, framework),
                  items: [],
                }}
              />
            ))}
          </div>
        )
      })}
    </nav>
  )
}
