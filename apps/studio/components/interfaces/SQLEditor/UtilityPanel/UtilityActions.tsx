import { Hotkey } from '@tanstack/react-hotkeys'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { AlignLeft, Check, Heart, Keyboard, MoreVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  KeyboardShortcut,
} from 'ui'

import { SqlRunButton } from './RunButton'
import { SqlSaveButton } from './SaveButton'
import SavingIndicator from './SavingIndicator'
import { QuerySourceSelector } from '@/components/ui/QuerySourceSelector'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { IS_PLATFORM } from '@/lib/constants'
import { useNotebookEditorContext } from '@/state/notebook-editor-context'
import type { QueryExecutionSource } from '@/state/query-execution-source'
import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'

export type UtilityActionsProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  hasSelection?: boolean
  isSaving?: boolean
  isSaveDisabled?: boolean
  prettifyQuery: () => void
  executeQuery: () => void
  saveQuery: () => void
  /** Appended to the more menu (e.g. delete block in notebooks) */
  menuItems?: ReactNode
}

export const UtilityActions = ({
  id,
  isExecuting = false,
  isDisabled = false,
  hasSelection = false,
  isSaving = false,
  isSaveDisabled = false,
  prettifyQuery,
  executeQuery,
  saveQuery,
  menuItems,
}: UtilityActionsProps) => {
  const { ref } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const notebookEditorContext = useNotebookEditorContext()

  const [intellisenseEnabled, setIntellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )
  const [lastSelectedDb, setLastSelectedDb] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_LAST_SELECTED_DB(ref as string),
    ''
  )

  const snippet = snapV2.snippets[id]
  const isFavorite = snippet !== undefined ? snippet.snippet.favorite : false

  const hotkeySequnece: Hotkey | undefined =
    SHORTCUT_DEFINITIONS[SHORTCUT_IDS.SQL_EDITOR_FORMAT].sequence[0]
  const formatKeys = hotkeySequnece ? hotkeyToKeys(hotkeySequnece) : undefined

  const toggleIntellisense = () => {
    setIntellisenseEnabled(!intellisenseEnabled)
    toast.success(
      `Successfully ${intellisenseEnabled ? 'disabled' : 'enabled'} intellisense. ${intellisenseEnabled ? 'Please refresh your browser for changes to take place.' : ''}`
    )
  }

  const addFavorite = () => snapV2.addFavorite(id)

  const removeFavorite = () => snapV2.removeFavorite(id)

  const onSelectDatabase = (databaseId: string) => {
    snapV2.resetResults(id)
    setLastSelectedDb(databaseId)
  }

  const onSourceChange = (source: QueryExecutionSource) => {
    snapV2.resetResults(id)
    snapV2.resetLogsResults(id)
    notebookEditorContext?.persistBlock({ querySource: source })
  }

  const executionSource = notebookEditorContext?.querySource

  return (
    <div className="inline-flex items-center gap-x-2">
      {IS_PLATFORM && <SavingIndicator id={id} />}

      {IS_PLATFORM && (
        <SqlSaveButton
          isDisabled={isSaveDisabled || isDisabled}
          isSaving={isSaving}
          onClick={saveQuery}
        />
      )}

      <div className="flex items-center">
        {IS_PLATFORM ? (
          <QuerySourceSelector
            selectedDatabaseId={lastSelectedDb.length === 0 ? undefined : lastSelectedDb}
            selectedSource={executionSource}
            selectedLogsDatePickerValue={notebookEditorContext?.logsDatePickerValue}
            onSelectDatabase={onSelectDatabase}
            onSourceChange={onSourceChange}
            onLogsDatePickerValueChange={(value) =>
              notebookEditorContext?.persistBlock({ logsDatePickerValue: value })
            }
          />
        ) : null}
        <SqlRunButton
          hasSelection={hasSelection}
          isDisabled={isDisabled || isExecuting}
          isExecuting={isExecuting}
          className={cn(IS_PLATFORM ? 'rounded-l-none' : undefined)}
          onClick={executeQuery}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid="sql-editor-utility-actions"
            type="default"
            className="px-1.5"
            icon={<MoreVertical className="text-foreground-light" />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
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
          {IS_PLATFORM && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-x-2"
                onClick={() => {
                  if (isFavorite) removeFavorite()
                  else addFavorite()
                }}
              >
                <Heart
                  size={14}
                  strokeWidth={2}
                  className={
                    isFavorite ? 'fill-brand stroke-none' : 'fill-none stroke-foreground-light'
                  }
                />
                {isFavorite ? 'Remove from' : 'Add to'} favorites
              </DropdownMenuItem>
            </>
          )}
          {menuItems ? (
            <>
              <DropdownMenuSeparator />
              {menuItems}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
