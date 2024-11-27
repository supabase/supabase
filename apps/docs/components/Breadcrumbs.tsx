'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { Fragment, Suspense } from 'react'

import { useBreakpoint } from 'common'
import {
  Breadcrumb_Shadcn_ as Breadcrumb,
  BreadcrumbList_Shadcn_ as BreadcrumbList,
  BreadcrumbItem_Shadcn_ as BreadcrumbItem,
  BreadcrumbLink_Shadcn_ as BreadcrumbLink,
  BreadcrumbSeparator_Shadcn_ as BreadcrumbSeparator,
  BreadcrumbPage_Shadcn_ as BreadcrumbPage,
  BreadcrumbEllipsis_Shadcn_ as BreadcrumbEllipsis,
  Button,
  cn,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { getMenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu.utils'

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLDivElement> {
  minLength?: number
  forceDisplayOnMobile?: boolean
}

export default function Breadcrumbs(props: BreadcrumbsProps) {
  return (
    <Suspense>
      <BreadcrumbsInternal {...props} />
    </Suspense>
  )
}

const BreadcrumbsInternal = ({
  className,
  minLength = 2,
  forceDisplayOnMobile = false,
}: BreadcrumbsProps) => {
  const breadcrumbs = useBreadcrumbs()
  const [open, setOpen] = React.useState(false)
  const isMobile = useBreakpoint('md')

  const ITEMS_TO_DISPLAY = isMobile ? 4 : 3

  if (!breadcrumbs?.length || breadcrumbs?.length < minLength) return null

  const appendedBreadcrumbs = breadcrumbs?.slice(
    -ITEMS_TO_DISPLAY + 1,
    isMobile && !forceDisplayOnMobile ? -1 : undefined
  )

  return (
    <Breadcrumb className={cn(className)}>
      <BreadcrumbList className="text-foreground-lighter p-0">
        {breadcrumbs.length >= ITEMS_TO_DISPLAY && (
          <>
            <BreadcrumbItem>
              {breadcrumbs[0].url ? (
                <BreadcrumbLink asChild>
                  <Link href={breadcrumbs[0].url}>
                    {breadcrumbs[0].title || breadcrumbs[0].name}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{breadcrumbs[0].title || breadcrumbs[0].name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        {breadcrumbs.length > ITEMS_TO_DISPLAY && (
          <>
            <BreadcrumbItem>
              {!isMobile ? (
                <DropdownMenu open={open} onOpenChange={setOpen}>
                  <DropdownMenuTrigger className="flex items-center gap-1" aria-label="Toggle menu">
                    <BreadcrumbEllipsis className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {breadcrumbs.slice(1, -2).map((crumb, index) => (
                      <DropdownMenuItem
                        key={index}
                        className={cn(!crumb.url && 'pointer-events-none')}
                      >
                        {crumb.url ? (
                          <Link href={crumb.url}>{crumb.title || crumb.name}</Link>
                        ) : (
                          crumb.title || crumb.name
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Drawer open={open} onOpenChange={setOpen}>
                  <DrawerTrigger aria-label="Toggle Menu">
                    <BreadcrumbEllipsis className="h-4 w-4" />
                  </DrawerTrigger>
                  <DrawerContent showHandle={false}>
                    <div className="grid gap-1 px-4">
                      {breadcrumbs
                        .slice(1, -2)
                        .map((crumb) =>
                          crumb.url ? (
                            <Link href={crumb.url}>{crumb.title || crumb.name}</Link>
                          ) : (
                            crumb.title || crumb.name
                          )
                        )}
                    </div>
                    <DrawerFooter className="pt-4">
                      <DrawerClose asChild>
                        <Button type="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        {appendedBreadcrumbs?.map((crumb, i) => (
          <Fragment key={crumb.url}>
            <BreadcrumbItem
              className={cn(
                'flex items-center overflow-hidden',
                i === appendedBreadcrumbs.length - 1 && 'md:text-foreground-light'
              )}
            >
              {crumb.url ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.url}>{crumb.title || crumb.name}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.title || crumb.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator
              className={cn(i === appendedBreadcrumbs.length - 1 && 'md:hidden')}
            />
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function useBreadcrumbs() {
  const pathname = usePathname()

  const isTroubleshootingPage = pathname.startsWith('/guides/troubleshooting')
  if (isTroubleshootingPage) {
    const breadcrumbs = [{ name: 'Troubleshooting', url: '/guides/troubleshooting' }]
    return breadcrumbs
  }

  const isAiPromptsPage = pathname.startsWith('/guides/getting-started/ai-prompts')
  if (isAiPromptsPage) {
    const breadcrumbs = [
      { name: 'Getting started', url: '/guides/getting-started' },
      { name: 'AI Prompts', url: '/guides/getting-started/ai-prompts' },
    ]
    return breadcrumbs
  }

  const menuId = getMenuId(pathname)
  const menu = NavItems[menuId]
  return findMenuItemByUrl(menu, pathname, [])
}

function findMenuItemByUrl(menu, targetUrl, parents = []) {
  // If the menu has items, recursively search through them
  if (menu.items) {
    for (let item of menu.items) {
      const result = findMenuItemByUrl(item, targetUrl, [...parents, menu])
      if (result) {
        return result
      }
    }
  }

  // Check if the current menu object itself has the target URL
  if (menu.url === targetUrl) {
    return [...parents, menu]
  }

  // If the URL is not found, return null
  return null
}
