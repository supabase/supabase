'use client'

import { SupabaseWordmark } from 'common/SupabaseWordmark'
import { ArrowUpRight, ChevronDown, ChevronRight, Code2 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, cn, Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'

import { CommandMenu } from '@/components/command-menu'
import { Sidebar } from '@/components/sidebar'
import { ThemeSwitcherDropdown } from '@/components/theme-switcher-dropdown'
import { getLibraryBlockHref, libraryBlocks, libraryCategories } from '@/config/library'
import { useFramework } from '@/context/framework-context'

export function SiteHeader() {
  const pathname = usePathname()
  const { framework } = useFramework()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>(libraryCategories[0].name)
  const headerRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-lg"
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setMenuOpen(false)
      }}
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
          setMenuOpen(false)
        }
      }}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-site items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium tracking-tight"
            aria-label="Supabase Library home"
          >
            <SupabaseWordmark />
            <span className="hidden text-foreground-light sm:inline">library</span>
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-1 text-sm md:flex">
            <Button
              ref={triggerRef}
              variant="text"
              size="small"
              aria-expanded={menuOpen}
              aria-controls="library-explore-menu"
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') setMenuOpen(true)
              }}
              onClick={() => setMenuOpen(true)}
              className={cn(
                'px-3 text-sm text-foreground-light',
                (menuOpen || pathname === '/') && 'text-foreground'
              )}
              iconRight={
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', menuOpen && 'rotate-180')}
                />
              }
            >
              Explore
            </Button>
            <Button
              asChild
              variant="text"
              size="small"
              className="px-3 text-sm text-foreground-light"
              onPointerEnter={() => setMenuOpen(false)}
            >
              <Link href="/docs/getting-started/quickstart">Quickstart</Link>
            </Button>
            <Button
              asChild
              variant="text"
              size="small"
              className="px-3 text-sm text-foreground-light"
              onPointerEnter={() => setMenuOpen(false)}
            >
              <Link href="/docs/getting-started/faq">FAQ</Link>
            </Button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 sm:w-28 lg:w-36 xl:w-44">
            <CommandMenu />
          </div>
          <Button
            asChild
            variant="text"
            size="tiny"
            className="hidden px-2 sm:inline-flex"
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
            className="hidden px-3 text-sm sm:inline-flex"
            iconRight={<ArrowUpRight size={14} />}
          >
            <a href="https://supabase.com/docs">Docs</a>
          </Button>
          <ThemeSwitcherDropdown />
          <Sidebar />
        </div>
      </div>
      {menuOpen && (
        <div
          id="library-explore-menu"
          className="absolute inset-x-4 top-full mx-auto hidden max-w-site overflow-hidden rounded-md border bg-background shadow-xl md:inset-x-8 md:block"
        >
          <Tabs
            value={activeCategory}
            onValueChange={setActiveCategory}
            orientation="vertical"
            className="flex max-h-[calc(100dvh-3.5rem)] overflow-y-auto"
          >
            <TabsList
              aria-label="Block categories"
              className="h-auto w-60 shrink-0 flex-col items-stretch justify-start border-b-0 border-r bg-surface-75 py-2"
            >
              {libraryCategories.map((category) => (
                <TabsTrigger
                  key={category.name}
                  value={category.name}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') setActiveCategory(category.name)
                  }}
                  className="justify-between gap-3 whitespace-normal border-0 px-4 py-2.5 text-left data-[state=active]:bg-surface-200 data-[state=active]:shadow-none"
                >
                  {category.name}
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-foreground-lighter group-data-[state=active]:text-brand"
                  />
                </TabsTrigger>
              ))}
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="mx-4 mt-5 border-t pt-4 text-xs text-foreground-light hover:text-foreground"
              >
                Browse all blocks
              </Link>
              <Link
                href="/docs/getting-started/introduction"
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 text-xs text-foreground-light hover:text-foreground"
              >
                Introduction
              </Link>
            </TabsList>
            {libraryCategories.map((category) => {
              const blocks = libraryBlocks.filter((block) => block.category === category.name)
              return (
                <TabsContent
                  key={category.name}
                  value={category.name}
                  className="m-0 min-w-0 flex-1 p-4"
                >
                  {blocks.length > 0 ? (
                    <ul className="flex max-w-4xl flex-col gap-1">
                      {blocks.map((block) => (
                        <li key={block.slug}>
                          <Link
                            href={getLibraryBlockHref(block, framework)}
                            onClick={() => setMenuOpen(false)}
                            className="group flex h-full flex-col gap-1.5 rounded-md px-4 py-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-brand"
                          >
                            <span className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium group-hover:text-brand">
                                {block.title}
                              </span>
                              <Badge className="shrink-0">Block</Badge>
                            </span>
                            <span className="text-sm leading-6 text-foreground-light">
                              {block.description}
                            </span>
                          </Link>
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
        </div>
      )}
    </header>
  )
}
