import { Hotkey } from '@tanstack/react-hotkeys'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { AlignLeft, Check, Keyboard, MoreVertical, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  KeyboardShortcut,
} from 'ui'

import { SqlRunButton } from './RunButton'
import SavingIndicator from './SavingIndicator'
import { RoleImpersonationPopover } from '@/components/interfaces/RoleImpersonationSelector/RoleImpersonationPopover'
import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { IS_PLATFORM } from '@/lib/constants'
import { useProfile } from '@/lib/profile'
import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'

export type UtilityActionsProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  hasSelection?: boolean
  prettifyQuery: () => void
  executeQuery: () => void
  onSave: () => void
}

export const UtilityActions = ({
  id,
  isExecuting = false,
  isDisabled = false,
  hasSelection = false,
  prettifyQuery,
  executeQuery,
  onSave,
}: UtilityActionsProps) => {
  const { ref } = useParams()
  const { profile } = useProfile()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [intellisenseEnabled, setIntellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )
  const [autoSaveSnippets, setAutoSaveSnippets] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_AUTO_SAVE_SNIPPETS,
    true
  )
  const [lastSelectedDb, setLastSelectedDb] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_LAST_SELECTED_DB(ref as string),
    ''
  )

  const snippet = snapV2.snippets[id]
  const isSaving = snapV2.savingStates[id] === 'UPDATING'
  const sql = snippet?.snippet.content?.unchecked_sql ?? ''
  const isDraft = snippet?.snippet.isDraftTab === true
  const savedSql = snapV2.savedSql[id]
  const hasUnsavedSqlChanges = isDraft
    ? sql.trim().length > 0
    : savedSql !== undefined && sql !== savedSql
  const isReadOnly =
    snippet?.snippet.visibility === 'project' && snippet?.snippet.owner_id !== profile?.id

  const hotkeySequnece: Hotkey | undefined =
    SHORTCUT_DEFINITIONS[SHORTCUT_IDS.SQL_EDITOR_FORMAT].sequence[0]
  const formatKeys = hotkeySequnece ? hotkeyToKeys(hotkeySequnece) : undefined

  const toggleIntellisense = () => {
    setIntellisenseEnabled(!intellisenseEnabled)
    toast.success(
      `Successfully ${intellisenseEnabled ? 'disabled' : 'enabled'} intellisense. ${intellisenseEnabled ? 'Please refresh your browser for changes to take place.' : ''}`
    )
  }

  const toggleAutoSaveSnippets = () => {
    setAutoSaveSnippets(!autoSaveSnippets)
  }

  const onSelectDatabase = (databaseId: string) => {
    snapV2.resetResults(id)
    setLastSelectedDb(databaseId)
  }

  return (
    <div className="inline-flex items-center justify-end gap-x-2">
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
          <DropdownMenuItem className="justify-between" onClick={toggleAutoSaveSnippets}>
            <span className="flex items-center gap-x-2">
              <Save size={14} className="text-foreground-light" />
              Auto save snippets
            </span>
            {autoSaveSnippets && <Check className="text-brand" size={16} />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center justify-between gap-x-2">
        {IS_PLATFORM && (!autoSaveSnippets || isDraft) && (
          <Button
            onClick={onSave}
            disabled={isDisabled || isReadOnly || !hasUnsavedSqlChanges}
            loading={isSaving}
            type="default"
            size="tiny"
            data-testid="sql-save-button"
            iconRight={<KeyboardShortcut keys={['Meta', 'S']} variant="inline" />}
          >
            Save
          </Button>
        )}
        <div className="flex items-center">
          {IS_PLATFORM && (
            <DatabaseSelector
              selectedDatabaseId={lastSelectedDb.length === 0 ? undefined : lastSelectedDb}
              variant="connected-on-right"
              onSelectId={onSelectDatabase}
            />
          )}
          <RoleImpersonationPopover
            serviceRoleLabel="postgres"
            header="Run SQL query as a role"
            variant={IS_PLATFORM ? 'connected-on-both' : 'connected-on-right'}
          />
          <SqlRunButton
            hasSelection={hasSelection}
            isDisabled={isDisabled || isExecuting}
            isExecuting={isExecuting}
            className="rounded-l-none"
            onClick={executeQuery}
          />
        </div>
      </div>
    </div>
  )
}
