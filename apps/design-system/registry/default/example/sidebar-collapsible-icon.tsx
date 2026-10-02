'use client'

import { Calendar, Home, Inbox, Search, Settings } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from 'ui'

const items = [
  { title: 'Home', url: '#', icon: Home },
  { title: 'Inbox', url: '#', icon: Inbox },
  { title: 'Calendar', url: '#', icon: Calendar },
  { title: 'Search', url: '#', icon: Search },
  { title: 'Settings', url: '#', icon: Settings },
]

export default function SidebarCollapsibleIcon() {
  return (
    <SidebarProvider
      defaultOpen
      className="h-[380px] min-h-0! w-full max-w-3xl overflow-hidden rounded-lg border"
    >
      <Sidebar collapsible="icon">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <span className="text-sm text-foreground-light">Icon collapse</span>
        </header>
        <div className="p-4 text-sm text-foreground-muted">
          Use the trigger or rail to collapse to icons.
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
