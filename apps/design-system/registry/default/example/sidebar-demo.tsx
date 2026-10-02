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
  SidebarTrigger,
} from 'ui'

const items = [
  { title: 'Home', url: '#', icon: Home },
  { title: 'Inbox', url: '#', icon: Inbox },
  { title: 'Calendar', url: '#', icon: Calendar },
  { title: 'Search', url: '#', icon: Search },
  { title: 'Settings', url: '#', icon: Settings },
]

export default function SidebarDemo() {
  return (
    <SidebarProvider className="h-[480px] min-h-0! w-full overflow-hidden">
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.title === 'Home'}>
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
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
      </SidebarInset>
    </SidebarProvider>
  )
}
