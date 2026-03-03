'use client'

import { Home, Package2, Plus, Settings2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from 'ui'

import { type PartnerSidebarData } from '@/lib/marketplace/server'

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  partners: PartnerSidebarData[]
}

export function AppSidebar({ partners, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const [, , partnerSlug = ''] = pathname.split('/')
  const currentPartner = partners.find((partner) => partner.slug === partnerSlug) ?? partners[0]

  if (!currentPartner) {
    return null
  }

  const itemLinks = currentPartner.items.map((item) => ({
    title: item.title,
    href: `/protected/${currentPartner.slug}/items/${item.slug}`,
  }))
  const overviewHref = `/protected/${currentPartner.slug}`
  const settingsHref = `/protected/${currentPartner.slug}/settings`
  const reviewsHref = `/protected/${currentPartner.slug}/reviews`
  const newItemHref = `/protected/${currentPartner.slug}/items/new`

  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="heading-meta text-foreground-lighter">
            Partner
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Overview" isActive={pathname === overviewHref}>
                  <Link href={overviewHref}>
                    <Home size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings" isActive={pathname === settingsHref}>
                  <Link href={settingsHref}>
                    <Settings2 size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {currentPartner.reviewer ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Reviews"
                    isActive={pathname === reviewsHref || pathname.startsWith(`${reviewsHref}/`)}
                  >
                    <Link href={reviewsHref}>
                      <ShieldCheck
                        size={16}
                        strokeWidth={1.5}
                        className="text-foreground-lighter"
                      />
                      <span>Reviews</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="heading-meta text-foreground-lighter">
            Marketplace Items
          </SidebarGroupLabel>
          <SidebarGroupAction
            asChild
            title="Create item"
            className="text-foreground-lighter size-4"
          >
            <Link href={newItemHref}>
              <Plus size={14} strokeWidth={1.5} />
              <span className="sr-only">Create item</span>
            </Link>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {itemLinks.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  >
                    <Link href={item.href}>
                      <Package2 size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
