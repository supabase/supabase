import { Plug } from 'lucide-react'
import {
  Button,
  cn,
  SidebarHeader as SidebarHeaderPrimitive,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { useSidebarHeader, type SidebarHeaderProps } from './useSidebarHeader'
import { OrgSelector } from '@/components/layouts/Navigation/NavigationBar/OrgSelector'
import { ProjectBranchSelector } from '@/components/layouts/Navigation/NavigationBar/ProjectBranchSelector'

export type { SidebarHeaderProps }

export function SidebarHeader(props: SidebarHeaderProps) {
  const {
    setShowConnect,
    isProjectScope,
    isActiveHealthy,
    shouldShowOrgSelector,
    selectorHeaderClass,
    isCollapsedRail,
  } = useSidebarHeader(props)

  return (
    <SidebarHeaderPrimitive className={cn(selectorHeaderClass, 'shrink-0 pb-0')}>
      {shouldShowOrgSelector && <OrgSelector isCollapsed={isCollapsedRail} />}
      {isProjectScope && (
        <>
          <ProjectBranchSelector isCollapsed={isCollapsedRail} />
          {/* <div className="flex items-center px-0">
            {isCollapsedRail ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="default"
                    size="tiny"
                    disabled={!isActiveHealthy}
                    onClick={() => setShowConnect(true)}
                    className="h-8 w-8 shrink-0 p-0"
                    icon={<Plug size={16} className="rotate-90 !size-4" strokeWidth={1.5} />}
                  />
                </TooltipTrigger>
                <TooltipContent side="right">Connect</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type="default"
                size="small"
                disabled={!isActiveHealthy}
                onClick={() => setShowConnect(true)}
                className="h-8 flex-1 justify-center gap-0 pl-2"
                icon={<Plug className="rotate-90" strokeWidth={1.5} />}
              >
                Connect
              </Button>
            )}
          </div> */}
        </>
      )}
    </SidebarHeaderPrimitive>
  )
}
