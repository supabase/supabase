import { PropsWithChildren } from 'react'

import { SIDEBAR_KEYS, sidebarManagerState } from 'state/sidebar-manager-state'
import { cn } from 'ui'

/**
 * Standardized padding and width layout for non-custom reports
 */
const ReportPadding = ({ children }: PropsWithChildren<{}>) => {
  const isAiAssistantOpen = sidebarManagerState.isSidebarOpen(SIDEBAR_KEYS.AI_ASSISTANT)

  return (
    <div
      className={cn(
        'flex flex-col flex-grow gap-4 px-5 py-6 mx-auto 1xl:px-28 lg:px-16 2xl:px-32 w-full',
        isAiAssistantOpen ? 'xl:px-6' : 'xl:px-22'
      )}
    >
      {children}
    </div>
  )
}
export default ReportPadding
