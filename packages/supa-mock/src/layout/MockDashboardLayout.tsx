import { SidebarInset, SidebarProvider } from 'ui'

import { useMockRouter } from '../router/MockRouterContext'
import { resolveScreen } from '../router/routes'
import { MockHeader } from './MockHeader'
import { MockSidebar } from './MockSidebar'

export function MockDashboardLayout() {
  const { currentPath } = useMockRouter()
  const Screen = resolveScreen(currentPath)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <MockHeader />
      <SidebarProvider style={{ minHeight: 0 }} className="flex-1 min-h-0">
        <MockSidebar />
        <SidebarInset style={{ minHeight: 0 }} className="overflow-auto">
          <Screen />
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
