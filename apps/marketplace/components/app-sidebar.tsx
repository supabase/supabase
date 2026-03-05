'use client'

import { Package2, Settings2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from 'ui'

import { type PartnerSidebarData } from '@/lib/marketplace/server'

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  partners: PartnerSidebarData[]
}

export function AppSidebar({ partners, ...props }: AppSidebarProps) {
  const pathname = usePathname()
  const { isMobile, open, setOpen } = useSidebar()
  const [, , partnerSlug = ''] = pathname.split('/')
  const currentPartner = partners.find((partner) => partner.slug === partnerSlug) ?? partners[0]

  React.useEffect(() => {
    if (!isMobile && open) {
      setOpen(false)
    }
  }, [isMobile, open, setOpen])

  if (!currentPartner) {
    return null
  }

  const settingsHref = `/protected/${currentPartner.slug}/settings`
  const itemsHref = `/protected/${currentPartner.slug}/items`
  const reviewsHref = `/protected/${currentPartner.slug}/reviews`
  const isItemsActive = pathname === itemsHref || pathname.startsWith(`${itemsHref}/`)
  const showInbox =
    currentPartner.partnerRole === 'reviewer' || currentPartner.partnerRole === 'admin'

  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarContent className="pt-2">
        <SidebarMenu className="items-center gap-1">
          <SidebarMenuItem className="flex w-full justify-center">
            <SidebarMenuButton asChild tooltip="Settings" isActive={pathname === settingsHref}>
              <Link href={settingsHref}>
                <Settings2 size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                <span className="sr-only">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="flex w-full justify-center">
            <SidebarMenuButton asChild tooltip="Items" isActive={isItemsActive}>
              <Link href={itemsHref}>
                <Package2 size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                <span className="sr-only">Items</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {showInbox ? (
            <SidebarMenuItem className="flex w-full justify-center">
              <SidebarMenuButton
                asChild
                tooltip="Inbox"
                isActive={pathname === reviewsHref || pathname.startsWith(`${reviewsHref}/`)}
              >
                <Link href={reviewsHref}>
                  <ShieldCheck size={16} strokeWidth={1.5} className="text-foreground-lighter" />
                  <span className="sr-only">Inbox</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
