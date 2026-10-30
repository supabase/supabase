'use client'

import { ChevronDown } from 'lucide-react'
import type { ElementType, MouseEvent } from 'react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

export interface MobileNavTab {
  label: string
  href?: string
}

export interface MobileNavTabsProps {
  tabs: MobileNavTab[]
  selectedLabel?: string
  // the tab that holds the current page
  currentLabel?: string
  onTabSelect: (label: string) => void
  // shows in the dropdown trigger while no tab is selected
  placeholder?: string
  linkAs?: ElementType
  className?: string
}

export const MobileNavTabs = ({
  tabs,
  selectedLabel,
  currentLabel,
  onTabSelect,
  placeholder,
  linkAs: Link = 'a',
  className,
}: MobileNavTabsProps) => {
  // the current tab stays a tab, since the page's own nav shows under it
  const isLink = (tab: MobileNavTab) => !!tab.href && tab.label !== currentLabel

  const handleTabSelect = (event: MouseEvent<HTMLButtonElement>) =>
    onTabSelect(event.currentTarget.value)

  return (
    <div className={cn('@container', className)}>
      <div className="hidden flex-wrap gap-2 @xl:flex">
        {tabs.map((tab) =>
          isLink(tab) ? (
            <Link
              key={tab.label}
              href={tab.href}
              className="inline-flex h-8 items-center rounded-md border px-4 text-sm text-foreground-light focus-ring aria-pressed:bg-surface-200 aria-pressed:text-foreground aria-[current=true]:text-foreground"
            >
              {tab.label}
            </Link>
          ) : (
            <button
              key={tab.label}
              type="button"
              value={tab.label}
              aria-pressed={tab.label === selectedLabel}
              aria-current={tab.label === currentLabel ? 'true' : undefined}
              onClick={handleTabSelect}
              className="inline-flex h-8 items-center rounded-md border px-4 text-sm text-foreground-light focus-ring aria-pressed:bg-surface-200 aria-pressed:text-foreground aria-[current=true]:text-foreground"
            >
              {tab.label}
            </button>
          )
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-full items-center justify-between rounded-md border-0 control-surface-shadows raised-control-surface pr-2 pl-4 text-sm text-foreground focus-ring @xl:hidden"
          >
            {selectedLabel ?? <span className="text-foreground-lighter">{placeholder}</span>}
            <ChevronDown aria-hidden strokeWidth={2} className="size-4 text-foreground-muted" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
          <DropdownMenuRadioGroup value={selectedLabel} onValueChange={onTabSelect}>
            {tabs.map((tab) =>
              isLink(tab) ? (
                <DropdownMenuItem key={tab.label} asChild inset className="h-10">
                  <Link href={tab.href}>{tab.label}</Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuRadioItem
                  key={tab.label}
                  value={tab.label}
                  aria-current={tab.label === currentLabel ? 'true' : undefined}
                  className="h-10 aria-[current=true]:text-foreground"
                >
                  {tab.label}
                </DropdownMenuRadioItem>
              )
            )}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
