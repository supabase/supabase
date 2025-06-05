import { ExternalLink, X } from 'lucide-react'
import Image from 'next/image'

import { LOCAL_STORAGE_KEYS } from 'common'
import { useEditorType } from 'components/layouts/editors/EditorsLayout.hooks'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InlineLinkClassName } from 'components/ui/InlineLink'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { BASE_PATH } from 'lib/constants'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Badge,
  Button,
  cn,
  HoverCard,
  HoverCardContent_Shadcn_,
  HoverCardTrigger_Shadcn_,
} from 'ui'
import { useIsSQLEditorTabsEnabled, useIsTableEditorTabsEnabled } from './FeaturePreviewContext'

export const TableEditorTabsPreview = () => {
  return (
    <div className="space-y-2">
      <Image
        src={`${BASE_PATH}/img/previews/tabs-editor.png`}
        width={1860}
        height={970}
        alt="api-docs-side-panel-preview"
        className="rounded border"
      />
      <p className="text-foreground-light text-sm">
        The Table Editor now features tabs for improved navigation and organization. Have multiple
        tables opened across schemas and conveniently go across them without having to switch
        schemas. Collapse the sidebar for a bigger real estate while browsing your data.
      </p>
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Enable opening of tables in the Table Editor as tabs</li>
          <li>Support closing of the navigation sidebar for a larger data grid space</li>
        </ul>
      </div>
    </div>
  )
}

export const TabsUpdateCallout = () => {
  const editor = useEditorType()
  const appSnap = useAppStateSnapshot()

  const isTableEditorTabsEnabled = useIsTableEditorTabsEnabled()
  const isSQLEditorTabsEnabled = useIsSQLEditorTabsEnabled()
  const isTabsEnabled = isTableEditorTabsEnabled || isSQLEditorTabsEnabled

  const [tableEditorTabsPreviewState] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS,
    ''
  )
  const [sqlEditorTabsPreviewState] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS,
    ''
  )

  const [tabsInterfaceAcknowledge, setTabsInterfaceAcknowledge] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TABS_INTERFACE_ACKNOWLEDGED,
    false
  )
  const isDefaultOptedInTabs =
    isTabsEnabled && tableEditorTabsPreviewState === '' && sqlEditorTabsPreviewState === ''

  if (!isDefaultOptedInTabs || tabsInterfaceAcknowledge) return null

  return (
    <Alert_Shadcn_ className="mb-4 relative">
      <AlertTitle_Shadcn_>
        <Badge variant="brand" className="mr-2">
          NEW
        </Badge>
        Tabs Interface for Editors
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        The Table and SQL Editors now feature tabs for improved navigation and organization! Check
        out our{' '}
        <span
          className={cn(InlineLinkClassName, 'cursor-pointer')}
          onClick={() => {
            appSnap.setSelectedFeaturePreview(
              editor === 'table'
                ? LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS
                : LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS
            )
            appSnap.setShowFeaturePreviewModal(true)
          }}
        >
          feature previews
        </span>{' '}
        for more information.
      </AlertDescription_Shadcn_>
      <AlertDescription_Shadcn_ className="mt-4 flex items-center gap-x-2">
        <Button asChild type="default" icon={<ExternalLink />}>
          <a
            target="_blank"
            rel="noreferrer noopener"
            href="https://github.com/orgs/supabase/discussions/35636"
          >
            View announcement
          </a>
        </Button>
      </AlertDescription_Shadcn_>
      <ButtonTooltip
        type="text"
        icon={<X />}
        className="absolute top-2 right-2 px-1"
        onClick={() => setTabsInterfaceAcknowledge(true)}
        tooltip={{ content: { side: 'bottom', text: 'Dismiss' } }}
      />
    </Alert_Shadcn_>
  )
}

export const TabsUpdateTooltip = () => {
  const editor = useEditorType()
  const appSnap = useAppStateSnapshot()

  const isTableEditorTabsEnabled = useIsTableEditorTabsEnabled()
  const isSQLEditorTabsEnabled = useIsSQLEditorTabsEnabled()
  const isTabsEnabled = isTableEditorTabsEnabled || isSQLEditorTabsEnabled

  const [tableEditorTabsPreviewState] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS,
    ''
  )
  const [sqlEditorTabsPreviewState] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS,
    ''
  )
  const [tabsInterfaceAcknowledge, setTabsInterfaceAcknowledge] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.TABS_INTERFACE_ACKNOWLEDGED,
    false
  )

  const isDefaultOptedInTabs =
    isTabsEnabled && tableEditorTabsPreviewState === '' && sqlEditorTabsPreviewState === ''

  if (!isDefaultOptedInTabs || tabsInterfaceAcknowledge) return null

  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger_Shadcn_ asChild>
        <div
          className={cn(
            'flex items-center justify-center px-2 h-10 shrink-0',
            'border-b border-b-default gap-x-2'
          )}
        >
          <Badge variant="brand" className="rounded">
            <span>NEW</span>
          </Badge>
        </div>
      </HoverCardTrigger_Shadcn_>
      <HoverCardContent_Shadcn_ className="p-3 w-72">
        <div className="flex flex-col gap-y-1">
          <p className="text-sm">Tabs Interface for Editors</p>
          <p className="text-xs text-foreground-light">
            The Table and SQL Editors now feature tabs for improved navigation and organization!
            Check out our{' '}
            <span
              className={cn(InlineLinkClassName, 'cursor-pointer')}
              onClick={() => {
                appSnap.setSelectedFeaturePreview(
                  editor === 'table'
                    ? LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS
                    : LOCAL_STORAGE_KEYS.UI_SQL_EDITOR_TABS
                )
                appSnap.setShowFeaturePreviewModal(true)
              }}
            >
              feature previews
            </span>{' '}
            for more information.
          </p>
        </div>
        <Button type="default" className="mt-2" onClick={() => setTabsInterfaceAcknowledge(true)}>
          Dismiss
        </Button>
      </HoverCardContent_Shadcn_>
    </HoverCard>
  )
}
