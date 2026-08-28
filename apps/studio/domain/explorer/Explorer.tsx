import { ExplorerSidebar } from './ExplorerSidebar'
import { ExplorerTabs } from './ExplorerTabs'

export const Explorer = () => {
  return (
    <div className="flex h-full">
      <ExplorerSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ExplorerTabs />
      </div>
    </div>
  )
}
