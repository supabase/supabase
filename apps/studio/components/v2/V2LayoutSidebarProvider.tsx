'use client'

import dynamic from 'next/dynamic'
import { type PropsWithChildren } from 'react'

import { useV2Params } from '@/app/v2/V2ParamsContext'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { getSupportLinkQueryParams } from 'components/ui/HelpPanel/HelpPanel.utils'
import { useRegisterSidebar, useSidebarManagerSnapshot } from 'state/sidebar-manager-state'

const HelpPanel = dynamic(() =>
  import('components/ui/HelpPanel/HelpPanel').then((m) => m.HelpPanel)
)

const AdvisorPanel = dynamic(() =>
  import('components/ui/AdvisorPanel/AdvisorPanel').then((m) => m.AdvisorPanel)
)
const AIAssistant = dynamic(() =>
  import('components/ui/AIAssistantPanel/AIAssistant').then((m) => m.AIAssistant)
)
const SqlPanel = dynamic(() => import('components/v2/SqlPanel').then((m) => m.SqlPanel))

export const V2LayoutSidebarProvider = ({ children }: PropsWithChildren) => {
  const { projectRef } = useV2Params()
  const hasProject = Boolean(projectRef)
  const { closeSidebar } = useSidebarManagerSnapshot()
  const { orgSlug } = useV2Params()

  const supportLinkQueryParams = getSupportLinkQueryParams(undefined, { slug: orgSlug }, projectRef)

  useRegisterSidebar(SIDEBAR_KEYS.AI_ASSISTANT, () => <AIAssistant />, {}, 'i', hasProject)
  useRegisterSidebar(SIDEBAR_KEYS.EDITOR_PANEL, () => <SqlPanel />, {}, 'e', hasProject)
  useRegisterSidebar(SIDEBAR_KEYS.ADVISOR_PANEL, () => <AdvisorPanel />, {}, undefined, true)
  useRegisterSidebar(
    SIDEBAR_KEYS.HELP_PANEL,
    () => (
      <HelpPanel
        onClose={() => closeSidebar(SIDEBAR_KEYS.HELP_PANEL)}
        projectRef={projectRef}
        supportLinkQueryParams={supportLinkQueryParams}
      />
    ),
    {},
    undefined,
    true
  )

  return <>{children}</>
}
