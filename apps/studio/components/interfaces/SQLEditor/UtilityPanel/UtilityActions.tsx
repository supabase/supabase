import { Hotkey } from '@tanstack/react-hotkeys'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { AlignLeft, Check, ChevronDown, Keyboard, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  KeyboardShortcut,
} from 'ui'

import { SqlRunButton } from './RunButton'
import { SqlSaveButton } from './SaveButton'
import SavingIndicator from './SavingIndicator'
import { RoleImpersonationPopover } from '@/components/interfaces/RoleImpersonationSelector/RoleImpersonationPopover'
import { EXPLORER_DATEPICKER_HELPERS } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsDatePicker } from '@/components/interfaces/Settings/Logs/Logs.DatePickers'
import {
  SQL_SNIPPET_SOURCE_LABELS,
  SqlSnippetSourceIcon,
} from '@/components/interfaces/SQLEditor/SQLEditorSource.utils'
import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { IS_PLATFORM } from '@/lib/constants'
import { useProfile } from '@/lib/profile'
import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import type { SqlSnippets } from '@/types'

export type UtilityActionsProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  hasSelection?: boolean
  source: SqlSnippets.Source
  logDateRange: SqlSnippets.LogDateRange
  prettifyQuery: () => void
  executeQuery: () => void
  onSourceChange: (source: SqlSnippets.Source) => void
  onLogDateRangeChange: (value: SqlSnippets.LogDateRange) => void
  onSave: () => void
}

export const UtilityActions = ({
  id,
  isExecuting = false,
  isDisabled = false,
  hasSelection = false,
  source,
  logDateRange,
  prettifyQuery,
  executeQuery,
  onSourceChange,
  onLogDateRangeChange,
  onSave,
}: UtilityActionsProps) => {
  const { ref } = useParams()
  const { profile } = useProfile()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [intellisenseEnabled, setIntellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )
  const [lastSelectedDb, setLastSelectedDb] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_LAST_SELECTED_DB(ref as string),
    ''
  )

  const snippet = snapV2.snippets[id]
  const isSaving = snapV2.savingStates[id] === 'UPDATING'
  const isReadOnly =
    snippet?.snippet.visibility === 'project' && snippet?.snippet.owner_id !== profile?.id
  const sourceControlsDisabled = isDisabled || isReadOnly

  const hotkeySequnece: Hotkey | undefined =
    SHORTCUT_DEFINITIONS[SHORTCUT_IDS.SQL_EDITOR_FORMAT].sequence[0]
  const formatKeys = hotkeySequnece ? hotkeyToKeys(hotkeySequnece) : undefined

  const toggleIntellisense = () => {
    setIntellisenseEnabled(!intellisenseEnabled)
    toast.success(
      `Successfully ${intellisenseEnabled ? 'disabled' : 'enabled'} intellisense. ${intellisenseEnabled ? 'Please refresh your browser for changes to take place.' : ''}`
    )
  }

  const onSelectSource = (source: string) => {
    if (sourceControlsDisabled) return
    onSourceChange(source as SqlSnippets.Source)
  }

  const onSelectDatabase = (databaseId: string) => {
    snapV2.resetResults(id)
    setLastSelectedDb(databaseId)
  }

  return (
    <div className="flex min-w-0 w-full items-center gap-x-2">
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="ml-auto flex w-max shrink-0 items-center gap-x-2">
          {IS_PLATFORM && <SavingIndicator id={id} />}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="sql-editor-utility-actions"
                type="default"
                className="px-1"
                icon={<MoreVertical className="text-foreground-light" />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              <DropdownMenuItem className="justify-between" onClick={toggleIntellisense}>
                <span className="flex items-center gap-x-2">
                  <Keyboard size={14} className="text-foreground-light" />
                  Intellisense enabled
                </span>
                {intellisenseEnabled && <Check className="text-brand" size={16} />}
              </DropdownMenuItem>
              <DropdownMenuItem className="justify-between" onClick={prettifyQuery}>
                <span className="flex items-center gap-x-2">
                  <AlignLeft size={14} strokeWidth={2} className="text-foreground-light" />
                  Prettify SQL
                </span>
                {formatKeys && <KeyboardShortcut keys={formatKeys} />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                disabled={sourceControlsDisabled}
                icon={<SqlSnippetSourceIcon source={source} />}
                iconRight={<ChevronDown strokeWidth={1.5} size={12} />}
              >
                {SQL_SNIPPET_SOURCE_LABELS[source]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuRadioGroup value={source} onValueChange={onSelectSource}>
                <DropdownMenuRadioItem value="database" className="gap-x-2">
                  <SqlSnippetSourceIcon source="database" />
                  {SQL_SNIPPET_SOURCE_LABELS.database}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="logs" className="gap-x-2">
                  <SqlSnippetSourceIcon source="logs" />
                  {SQL_SNIPPET_SOURCE_LABELS.logs}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {source === 'logs' && (
            <LogsDatePicker
              value={logDateRange}
              onSubmit={onLogDateRangeChange}
              helpers={EXPLORER_DATEPICKER_HELPERS}
              buttonTriggerProps={{ disabled: sourceControlsDisabled }}
            />
          )}

          {source === 'database' && IS_PLATFORM && (
            <DatabaseSelector
              selectedDatabaseId={lastSelectedDb.length === 0 ? undefined : lastSelectedDb}
              showLabel={false}
              onSelectId={onSelectDatabase}
            />
          )}
          {source === 'database' && (
            <RoleImpersonationPopover
              serviceRoleLabel="postgres"
              header="Run SQL query as a role"
            />
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-x-2">
        {IS_PLATFORM && (
          <SqlSaveButton
            isDisabled={isDisabled || isReadOnly}
            isSaving={isSaving}
            onClick={onSave}
          />
        )}
        <SqlRunButton
          hasSelection={hasSelection}
          isDisabled={isDisabled || isExecuting}
          isExecuting={isExecuting}
          onClick={executeQuery}
        />
      </div>
    </div>
  )
}
