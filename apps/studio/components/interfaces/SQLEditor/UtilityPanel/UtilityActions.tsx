import { Hotkey } from '@tanstack/react-hotkeys'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { AlignLeft, Check, ChevronDown, Heart, Keyboard, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  KeyboardShortcut,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
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

  const [isAiOpen] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.SQL_EDITOR_AI_OPEN, true)
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

  const addFavorite = () => snapV2.addFavorite(id)

  const removeFavorite = () => snapV2.removeFavorite(id)

  const onSelectSource = (source: string) => {
    if (sourceControlsDisabled) return
    onSourceChange(source as SqlSnippets.Source)
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
            className={cn('px-1', isAiOpen ? 'block 2xl:hidden' : 'hidden')}
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

      <div className={cn('items-center gap-x-2', isAiOpen ? 'hidden 2xl:flex' : 'flex')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="text"
              className="px-1"
              icon={<Keyboard className="text-foreground-light" />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem className="justify-between" onClick={toggleIntellisense}>
              Intellisense enabled
              {intellisenseEnabled && <Check className="text-brand" size={16} />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {IS_PLATFORM && (
          <Tooltip>
            <TooltipTrigger asChild>
              {isFavorite ? (
                <Button
                  type="text"
                  size="tiny"
                  onClick={removeFavorite}
                  className="px-1"
                  icon={<Heart className="fill-brand stroke-none" />}
                />
              ) : (
                <Button
                  type="text"
                  size="tiny"
                  onClick={addFavorite}
                  className="px-1"
                  icon={<Heart className="fill-none stroke-foreground-light" />}
                />
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isFavorite ? 'Remove from' : 'Add to'} favorites
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="text"
              onClick={prettifyQuery}
              className="px-1"
              icon={<AlignLeft strokeWidth={2} className="text-foreground-light" />}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-1 pl-2.5">
            <div className="flex items-center gap-2.5">
              <span>Prettify SQL</span>
              {formatKeys && <KeyboardShortcut keys={formatKeys} />}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex items-center justify-between gap-x-2">
        {IS_PLATFORM && (
          <SqlSaveButton
            isDisabled={isDisabled || isReadOnly}
            isSaving={isSaving}
            onClick={onSave}
          />
        )}
        <div className="flex items-center gap-x-2">
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
                <DropdownMenuRadioItem value="project" className="gap-x-2">
                  <SqlSnippetSourceIcon source="project" />
                  Project
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="logs" className="gap-x-2">
                  <SqlSnippetSourceIcon source="logs" />
                  Logs
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {source === 'logs' && (
            <LogsDatePicker
              value={logDateRange}
              onSubmit={onLogDateRangeChange}
              helpers={EXPLORER_DATEPICKER_HELPERS}
              buttonTriggerProps={{ className: 'h-[30px]', disabled: sourceControlsDisabled }}
            />
          )}

          <div className="flex items-center">
            {source === 'project' && IS_PLATFORM && (
              <DatabaseSelector
                selectedDatabaseId={lastSelectedDb.length === 0 ? undefined : lastSelectedDb}
                variant="connected-on-right"
                showLabel={false}
                onSelectId={onSelectDatabase}
              />
            )}
            {source === 'project' && (
              <RoleImpersonationPopover
                serviceRoleLabel="postgres"
                header="Run SQL query as a role"
                variant={IS_PLATFORM ? 'connected-on-both' : 'connected-on-right'}
              />
            )}
            <SqlRunButton
              hasSelection={hasSelection}
              isDisabled={isDisabled || isExecuting}
              isExecuting={isExecuting}
              className={cn(source === 'project' && 'rounded-l-none')}
              onClick={executeQuery}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
