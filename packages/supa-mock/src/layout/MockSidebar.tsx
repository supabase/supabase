import { PanelLeftDashed } from 'lucide-react'
import {
  Button,
  cn,
  Separator,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
} from 'ui'

import { useMockRouter } from '../router/MockRouterContext'
import { MOCK_ROUTES, OTHER_KEYS, PRODUCT_KEYS, SETTINGS_KEYS, TOOL_KEYS } from '../router/routes'

const ICON_SIZE = 32
const ICON_STROKE_WIDTH = 1.5

function MockNavLink({
  routeKey,
  label,
  icon,
  path,
  isActive,
  disabled,
}: {
  routeKey: string
  label: string
  icon: React.ReactNode
  path: string
  isActive: boolean
  disabled?: boolean
}) {
  const { navigate } = useMockRouter()

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        className={cn(
          'text-sm !px-2',
          disabled
            ? 'opacity-50 cursor-default pointer-events-none'
            : 'hover:bg-surface-200 hover:text-foreground',
          isActive && '!bg-selection !text-foreground'
        )}
        size="default"
        onClick={() => !disabled && navigate(path)}
      >
        {icon}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function RouteGroup({ keys }: { keys: string[] }) {
  const { currentPath } = useMockRouter()
  const routes = MOCK_ROUTES.filter((r) => keys.includes(r.key))

  return (
    <SidebarGroup className="gap-0.5">
      {routes.map((route) => (
        <MockNavLink
          key={route.key}
          routeKey={route.key}
          label={route.label}
          icon={route.icon}
          path={route.path}
          isActive={currentPath === route.path}
          disabled={route.disabled}
        />
      ))}
    </SidebarGroup>
  )
}

export function MockSidebar() {
  const { currentPath, navigate } = useMockRouter()
  const homeRoute = MOCK_ROUTES.find((r) => r.key === 'HOME')

  return (
    <SidebarPrimitive collapsible="icon" variant="sidebar">
      <SidebarContent>
        <SidebarMenu>
          {/* Home + Tools */}
          <SidebarGroup className="gap-0.5">
            {homeRoute && (
              <MockNavLink
                routeKey={homeRoute.key}
                label={homeRoute.label}
                icon={homeRoute.icon}
                path={homeRoute.path}
                isActive={currentPath === homeRoute.path}
              />
            )}
            {MOCK_ROUTES.filter((r) => TOOL_KEYS.includes(r.key)).map((route) => (
              <MockNavLink
                key={route.key}
                routeKey={route.key}
                label={route.label}
                icon={route.icon}
                path={route.path}
                isActive={currentPath === route.path}
                disabled={route.disabled}
              />
            ))}
          </SidebarGroup>

          <Separator className="w-[calc(100%-1rem)] mx-auto" />

          {/* Products */}
          <RouteGroup keys={PRODUCT_KEYS} />

          <Separator className="w-[calc(100%-1rem)] mx-auto" />

          {/* Other */}
          <RouteGroup keys={OTHER_KEYS} />

          {/* Settings */}
          <RouteGroup keys={SETTINGS_KEYS} />
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup className="p-0"></SidebarGroup>
      </SidebarFooter>
    </SidebarPrimitive>
  )
}
