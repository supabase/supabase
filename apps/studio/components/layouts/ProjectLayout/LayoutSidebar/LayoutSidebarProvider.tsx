import { LOCAL_STORAGE_KEYS } from 'common'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import useLatest from 'hooks/misc/useLatest'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, type PropsWithChildren } from 'react'
import { useRegisterSidebar, useSidebarManagerSnapshot } from 'state/sidebar-manager-state'

import { getSupportLinkQueryParams } from '../LayoutHeader/HelpPanel/HelpPanel.utils'

const AdvisorPanel = dynamic(() =>
  import('components/ui/AdvisorPanel/AdvisorPanel').then((m) => m.AdvisorPanel)
)
const AIAssistant = dynamic(() =>
  import('components/ui/AIAssistantPanel/AIAssistant').then((m) => m.AIAssistant)
)
const EditorPanel = dynamic(() =>
  import('components/ui/EditorPanel/EditorPanel').then((m) => m.EditorPanel)
)
const HelpPanel = dynamic(() =>
  import('components/layouts/ProjectLayout/LayoutHeader/HelpPanel/HelpPanel').then(
    (m) => m.HelpPanel
  )
)

export const SIDEBAR_KEYS = {
  AI_ASSISTANT: 'ai-assistant',
  EDITOR_PANEL: 'editor-panel',
  ADVISOR_PANEL: 'advisor-panel',
  HELP_PANEL: 'help-panel',
} as const

export const LayoutSidebarProvider = ({ children }: PropsWithChildren) => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()
  const { openSidebar, closeSidebar, activeSidebar } = useSidebarManagerSnapshot()

  const [sidebarURLParam, setSidebarUrlParam] = useQueryState('sidebar', parseAsString)
  const [sidebarLocalStorage, setSidebarLocalStorage, { isSuccess: isLoadedLocalStorage }] =
    useLocalStorageQuery(LOCAL_STORAGE_KEYS.LAST_OPENED_SIDE_BAR(project?.ref ?? ''), '')

  const sidebarURLParamRef = useLatest(sidebarURLParam)
  const sidebarLocalStorageRef = useLatest(sidebarLocalStorage)

  useRegisterSidebar(SIDEBAR_KEYS.AI_ASSISTANT, () => <AIAssistant />, {}, 'i', !!project)
  useRegisterSidebar(SIDEBAR_KEYS.EDITOR_PANEL, () => <EditorPanel />, {}, 'e', !!project)
  useRegisterSidebar(SIDEBAR_KEYS.ADVISOR_PANEL, () => <AdvisorPanel />, {}, undefined, true)
  useRegisterSidebar(
    SIDEBAR_KEYS.HELP_PANEL,
    () => (
      <HelpPanel
        onClose={() => closeSidebar(SIDEBAR_KEYS.HELP_PANEL)}
        projectRef={project?.ref}
        supportLinkQueryParams={getSupportLinkQueryParams(
          project,
          org,
          router.query.ref as string | undefined
        )}
      />
    ),
    {},
    undefined,
    true
  )

  useEffect(() => {
    if (!!project) {
      if (activeSidebar) {
        // add event tracking
        sendEvent({
          action: 'sidebar_opened',
          properties: {
            sidebar: activeSidebar.id as (typeof SIDEBAR_KEYS)[keyof typeof SIDEBAR_KEYS],
          },
          groups: {
            project: project?.ref ?? 'Unknown',
            organization: org?.slug ?? 'Unknown',
          },
        })
        setSidebarLocalStorage(activeSidebar.id)
      } else {
        setSidebarLocalStorage('')
        setSidebarUrlParam(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSidebar])

  // Handle toggling of sidebars on page init
  // Prioritize URL params first, then local storage
  useEffect(() => {
    if (router.isReady && isLoadedLocalStorage) {
      if (
        typeof sidebarURLParamRef.current === 'string' &&
        Object.values(SIDEBAR_KEYS).includes(
          sidebarURLParamRef.current as (typeof SIDEBAR_KEYS)[keyof typeof SIDEBAR_KEYS]
        )
      ) {
        console.log('Open sidebar based on URL')
        openSidebar(sidebarURLParamRef.current)
      } else if (
        !!sidebarLocalStorageRef.current &&
        Object.values(SIDEBAR_KEYS).includes(
          sidebarLocalStorageRef.current as (typeof SIDEBAR_KEYS)[keyof typeof SIDEBAR_KEYS]
        )
      ) {
        openSidebar(sidebarLocalStorageRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, isLoadedLocalStorage])

  return <>{children}</>
}
