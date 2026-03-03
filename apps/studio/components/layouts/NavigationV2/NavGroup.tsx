import { LOCAL_STORAGE_KEYS } from 'common'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { isValidElement } from 'react'
import type { ReactNode } from 'react'
import {
  Badge,
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from 'ui'

export interface NavGroupItem {
  title: string
  url: string
  icon?: LucideIcon | ReactNode
  isActive?: boolean
  label?: string
  items?: {
    title: string
    url: string
    isActive?: boolean
  }[]
}

export interface NavGroupProps {
  id?: string
  label?: string
  items: NavGroupItem[]
  isCollapsible?: boolean
}

export function NavGroup({ id, label, items, isCollapsible = true }: NavGroupProps) {
  // Load the sidebar state from localStorage using react-query for cross-component sync
  const [sidebarState, setSidebarState] = useLocalStorageQuery<Record<string, boolean>>(
    LOCAL_STORAGE_KEYS.DASHBOARD_SIDEBAR_STATE,
    {}
  )

  // Get the current group's open state, defaulting to true (open)
  const isOpen = id ? sidebarState[id] ?? true : true

  // Handler to update the open state for this specific group
  const handleOpenChange = (open: boolean) => {
    if (id && isCollapsible) {
      setSidebarState((prev) => ({ ...prev, [id]: open }))
    }
  }

  const content = (
    <SidebarMenu className="gap-[2px]">
      {items.map((item) =>
        item.items && item.items.length > 0 ? (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={item.isActive}
                  className="gap-2 text-foreground-light !py-1.5 !h-7"
                >
                  <NavItemIcon icon={item.icon} />
                  <span className="truncate">{item.title}</span>
                  {item.label && (
                    <Badge className="ml-1 px-1.5 py-0.5 bg-transparent !border-stronger text-[10px] leading-none font-medium">
                      {item.label}
                    </Badge>
                  )}
                  <ChevronRight
                    strokeWidth={1.5}
                    className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-foreground-lighter hidden !w-4 !h-4 group-hover:block"
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="gap-[2px] ml-3 mr-0 pl-3.5 pr-0">
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild isActive={subItem.isActive}>
                        <Link href={subItem.url}>
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ) : (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={item.isActive}
              asChild
              className="gap-2 text-foreground-light !py-1.5 !h-7"
            >
              <Link href={item.url}>
                <NavItemIcon icon={item.icon} />
                <span>{item.title}</span>
                {item.label && (
                  <Badge className="ml-1 px-1.5 py-0.5 bg-transparent !border-stronger text-[10px] leading-none font-medium">
                    {item.label}
                  </Badge>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      )}
    </SidebarMenu>
  )

  if (label) {
    return (
      <Collapsible
        open={isOpen}
        onOpenChange={handleOpenChange}
        className="group/group-collapsible"
      >
        <SidebarGroup>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel
              className={`group/label text-foreground-lighter flex items-center gap-1 ${
                isCollapsible ? 'cursor-pointer hover:text-foreground-light' : 'pointer-events-none'
              }`}
            >
              <span>{label}</span>
              {isCollapsible && (
                <ChevronRight
                  strokeWidth={1.5}
                  className="!w-4 !h-4 text-foreground-muted group-hover/label:text-foreground-light transition-transform duration-200 group-data-[state=open]/group-collapsible:rotate-90 hidden group-hover:block"
                />
              )}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>{content}</CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    )
  }

  return <SidebarGroup>{content}</SidebarGroup>
}

function NavItemIcon({ icon }: { icon?: LucideIcon | ReactNode }) {
  if (!icon) return null

  // If it's already a rendered React element (e.g. <SomeIcon />), use it as-is
  if (isValidElement(icon)) {
    return icon
  }

  // Otherwise it's a component reference (function or forwardRef) - render it
  const IconComponent = icon as LucideIcon
  return <IconComponent strokeWidth={1.5} className="!w-4 !h-4" />
}
