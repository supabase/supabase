'use client'

import { usePathname } from 'next/navigation'
import React, { Fragment } from 'react'
import {
  Breadcrumb_Shadcn_ as Breadcrumb,
  BreadcrumbList_Shadcn_ as BreadcrumbList,
  BreadcrumbItem_Shadcn_ as BreadcrumbItem,
  BreadcrumbLink_Shadcn_ as BreadcrumbLink,
  BreadcrumbSeparator_Shadcn_ as BreadcrumbSeparator,
  BreadcrumbPage_Shadcn_ as BreadcrumbPage,
  BreadcrumbEllipsis_Shadcn_ as BreadcrumbEllipsis,
} from 'ui'
import { getMenuId } from '../app/guides/layout'
import * as NavItems from './Navigation/NavigationMenu/NavigationMenu.constants'

const Breadcrumbs = ({ className }: { className?: string }) => {
  const pathname = usePathname()
  const menuId = getMenuId(pathname)
  const menu = NavItems[menuId]
  const breadcrumbs = findParentsByUrl(menu, pathname, [], { removeChild: false })

  if (!breadcrumbs?.length || breadcrumbs?.length === 1) return null

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList className="m-0 mb-2 text-foreground-lighter p-0 [&>li]:before:hidden [&>li]:p-0">
        {/* <BreadcrumbItem>
          <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
        </BreadcrumbItem> */}
        {breadcrumbs?.map((crumb, i) => (
          <Fragment key={crumb.url}>
            {i !== 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.url ? (
                <BreadcrumbLink href={`/docs${crumb.url}`}>
                  {crumb.title || crumb.name}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.title || crumb.name}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
        {/* <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem> */}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
interface Options {
  removeChild?: boolean
}

function findParentsByUrl(menu, targetUrl, parents = [], options?: Options) {
  // Check if the current menu object itself has the target URL
  if (menu.url === targetUrl) {
    return options?.removeChild ? parents : [...parents, menu]
  }

  // If the menu has items, recursively search through them
  if (menu.items) {
    for (let item of menu.items) {
      const result = findParentsByUrl(item, targetUrl, [...parents, menu])
      if (result) {
        return result
      }
    }
  }

  // If the URL is not found, return null
  return null
}

export default Breadcrumbs
