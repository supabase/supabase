'use client'

import supabaseLogoIcon from 'common/assets/images/supabase-logo-icon.svg'
import { ArrowUpRight, ChevronRight, Code2, Grid2X2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  Button,
  buttonVariants,
  cn,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from 'ui'

import { CommandMenu } from '@/components/command-menu'
import { Sidebar } from '@/components/sidebar'
import { ThemeSwitcherDropdown } from '@/components/theme-switcher-dropdown'
import { getLibraryBlockHref, libraryBlocks, libraryCategories } from '@/config/library'
import { useFramework } from '@/context/framework-context'
import { useMenuAim } from '@/hooks/use-menu-aim'

export function SiteHeader() {
  const { framework } = useFramework()
  const [activeCategory, setActiveCategory] = useState<string>(libraryCategories[0].name)

  const menuAim = useMenuAim(activeCategory, setActiveCategory)

  return (
    <header className="sticky top-0 z-40 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-24 before:bg-gradient-to-b before:from-background before:via-background/90 before:via-60% before:to-transparent">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      <div className="relative mx-auto flex h-14 max-w-site items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium tracking-tight"
            aria-label="Supabase Library home"
          >
            <Image src={supabaseLogoIcon} alt="" width={24} height={24} />
            <span aria-hidden="true" className="hidden text-border sm:inline">
              /
            </span>
            <span className="hidden text-foreground-light sm:inline">Library</span>
          </Link>
        </div>
        <nav aria-label="Main navigation" className="absolute left-1/2 -translate-x-1/2">
          <NavigationMenu
            delayDuration={0}
            className="hidden h-14 md:flex md:flex-none [&>div:last-child]:left-1/2 [&>div:last-child]:-translate-x-1/2"
            viewportClassName="rounded-xl bg-background data-[state=open]:slide-in-from-right-0!"
          >
            <NavigationMenuList className="flex-none gap-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    buttonVariants({ variant: 'text', size: 'small' }),
                    'h-8 rounded-full px-3 text-foreground-light hover:text-foreground data-[state=open]:text-foreground'
                  )}
                >
                  <Grid2X2 aria-hidden="true" className="size-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Explore</span>
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <Tabs
                    value={activeCategory}
                    onValueChange={menuAim.selectCategory}
                    onPointerMove={menuAim.onPointerMove}
                    onPointerLeave={menuAim.onPointerLeave}
                    orientation="vertical"
                    className="flex w-[640px] max-w-[calc(100vw-4rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto"
                  >
                    <div className="flex w-60 shrink-0 flex-col border-r bg-surface-75 py-2">
                      <TabsList
                        aria-label="Block categories"
                        className="h-auto flex-col items-stretch justify-start border-b-0"
                      >
                        {libraryCategories.map((category) => (
                          <TabsTrigger
                            key={category.name}
                            value={category.name}
                            data-menu-category={category.name}
                            className="justify-between gap-3 whitespace-normal border-0 px-4 py-2.5 text-left data-[state=active]:bg-surface-200 data-[state=active]:shadow-none"
                          >
                            {category.name}
                            <ChevronRight
                              size={14}
                              className="shrink-0 text-foreground-lighter group-data-[state=active]:text-brand"
                            />
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <ul className="mx-4 mt-5 flex flex-col border-t pt-2.5">
                        {[
                          { href: '/', label: 'Browse all blocks' },
                          { href: '/docs/getting-started/quickstart', label: 'Quickstart' },
                          { href: '/docs/getting-started/faq', label: 'FAQ' },
                        ].map(({ href, label }) => (
                          <li key={href}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={href}
                                className="block py-1.5 text-xs text-foreground-light hover:text-foreground"
                              >
                                {label}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {libraryCategories.map((category) => {
                      const blocks = libraryBlocks.filter(
                        (block) => block.category === category.name
                      )
                      return (
                        <TabsContent
                          key={category.name}
                          value={category.name}
                          className="m-0 min-w-0 flex-1 p-6"
                        >
                          {blocks.length > 0 ? (
                            <ul className="flex flex-col gap-4">
                              {blocks.map((block) => (
                                <li key={block.slug}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      href={getLibraryBlockHref(block, framework)}
                                      className="group/menu-item flex h-fit flex-col gap-1 rounded-md text-sm text-foreground-light hover:text-foreground select-none leading-none no-underline focus-ring focus-visible:text-foreground"
                                    >
                                      <span className="flex items-center gap-1">
                                        <span className="text-sm leading-snug text-foreground">
                                          {block.title}
                                        </span>
                                        <ChevronRight
                                          strokeWidth={2}
                                          className="h-3 w-3 text-foreground transition-all -translate-x-1 opacity-0 group-hover/menu-item:translate-x-0 group-hover/menu-item:opacity-100"
                                        />
                                      </span>
                                      <span className="text-xs leading-snug text-foreground-lighter group-hover/menu-item:text-foreground-light group-focus-visible/menu-item:text-foreground-light">
                                        {block.description}
                                      </span>
                                    </Link>
                                  </NavigationMenuLink>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-base text-foreground-light">
                              No blocks in this category yet.
                            </p>
                          )}
                        </TabsContent>
                      )
                    })}
                  </Tabs>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </nav>
        <div className="flex items-center gap-2">
          <div className="w-20 sm:w-28 lg:w-36 xl:w-44">
            <CommandMenu />
          </div>
          <Button
            asChild
            variant="text"
            size="tiny"
            className="hidden h-8 w-8 p-0 text-muted-foreground hover:text-foreground sm:inline-flex"
            aria-label="View source on GitHub"
          >
            <a href="https://github.com/supabase/supabase/tree/master/apps/ui-library">
              <Code2 size={16} />
            </a>
          </Button>
          <Button
            asChild
            variant="text"
            size="small"
            className="hidden h-8 px-3 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
            iconRight={<ArrowUpRight size={14} />}
          >
            <a href="https://supabase.com/docs">Docs</a>
          </Button>
          <ThemeSwitcherDropdown />
          <Sidebar />
        </div>
      </div>
    </header>
  )
}
