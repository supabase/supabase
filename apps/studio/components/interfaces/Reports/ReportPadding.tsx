import { PropsWithChildren } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { cn } from 'ui'

/**
 * Standardized padding and width layout for non-custom reports
 */
const ReportPadding = ({ children }: PropsWithChildren<{}>) => {
  const { aiAssistantPanel } = useAppStateSnapshot()
  const { open } = aiAssistantPanel

  return (
    <div
      className={cn(
        'flex flex-col gap-4 px-5 py-6 mx-auto 1xl:px-28 lg:px-16 2xl:px-32 w-full',
        open ? 'xl:px-6' : 'xl:px-24'
      )}
    >
      {children}
    </div>
  )
}
export default ReportPadding
