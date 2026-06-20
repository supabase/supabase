import { Hotkey } from '@tanstack/react-hotkeys'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { AlignLeft, Check, Heart, Keyboard, MoreVertical } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
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
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import {
  clampSqlEditorFontSize,
  SQL_EDITOR_FONT_SIZE_DEFAULT,
  SQL_EDITOR_FONT_SIZE_MAX,
  SQL_EDITOR_FONT_SIZE_MIN,
  SQL_EDITOR_FONT_SIZE_STEP,
} from '../SQLEditor.constants'
import { SqlRunButton } from './RunButton'
import SavingIndicator from './SavingIndicator'
import { RoleImpersonationPopover } from '@/components/interfaces/RoleImpersonationSelector/RoleImpersonationPopover'
import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { IS_PLATFORM } from '@/lib/constants'
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
}

export const UtilityActions = ({
  id,
  isExecuting = false,
  isDisabled = false,
  hasSelection = false,
  prettifyQuery,
  executeQuery,
}: UtilityActionsProps) => {
  const { ref } = useParams()
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

  const [sqlEditorFontSizeStored, setSqlEditorFontSize] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_FONT_SIZE,
    SQL_EDITOR_FONT_SIZE_DEFAULT
  )

  const sqlEditorFontSize = useMemo(
    () =>
      clampSqlEditorFontSize(
        typeof sqlEditorFontSizeStored === 'number' && Number.isFinite(sqlEditorFontSizeStored)
          ? sqlEditorFontSizeStored
          : SQL_EDITOR_FONT_SIZE_DEFAULT
      ),
    [sqlEditorFontSizeStored]
  )

  const bumpSqlEditorFontSize = useCallback(
    (direction: -1 | 1) => {
      setSqlEditorFontSize((prev) => {
        const base =
          typeof prev === 'number' && Number.isFinite(prev) ? prev : SQL_EDITOR_FONT_SIZE_DEFAULT
        return clampSqlEditorFontSize(base + direction * SQL_EDITOR_FONT_SIZE_STEP)
      })
    },
    [setSqlEditorFontSize]
  )

  const [fontToggleValue, setFontToggleValue] = useState<string>()

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

  return (
    <div className="inline-flex items-center justify-end gap-x-2">
      {IS_PLATFORM && <SavingIndicator id={id} />}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid="sql-editor-utility-actions"
            variant="default"
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
          <DropdownMenuItem className="justify-between" onClick={prettifyQuery}>
            <span className="flex items-center gap-x-2">
              <AlignLeft size={14} strokeWidth={2} className="text-foreground-light" />
              Prettify SQL
            </span>
            {formatKeys && <KeyboardShortcut keys={formatKeys} />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={sqlEditorFontSize >= SQL_EDITOR_FONT_SIZE_MAX}
            onClick={() => bumpSqlEditorFontSize(1)}
          >
            Increase font size (A+)
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={sqlEditorFontSize <= SQL_EDITOR_FONT_SIZE_MIN}
            onClick={() => bumpSqlEditorFontSize(-1)}
          >
            Decreased font size (A−)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className={cn('items-center gap-x-2', isAiOpen ? 'hidden 2xl:flex' : 'flex')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="text"
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
                  variant="text"
                  size="tiny"
                  onClick={removeFavorite}
                  className="px-1"
                  icon={<Heart className="fill-brand stroke-none" />}
                />
              ) : (
                <Button
                  variant="text"
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
              variant="text"
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

        <ToggleGroup
          type="single"
          size="sm"
          value={fontToggleValue}
          onValueChange={(val) => {
            if (val === 'dec') bumpSqlEditorFontSize(-1)
            else if (val === 'inc') bumpSqlEditorFontSize(1)
            setFontToggleValue(undefined)
          }}
          className="gap-0 rounded-md border border-strong p-0"
        >
          <ToggleGroupItem
            value="dec"
            size="sm"
            disabled={sqlEditorFontSize <= SQL_EDITOR_FONT_SIZE_MIN}
            className="h-[26px] min-w-[2rem] rounded-none rounded-l-md border-0 px-2 text-xs font-medium data-[state=on]:bg-transparent"
            aria-label="Decrease SQL editor font size"
          >
            A−
          </ToggleGroupItem>
          <ToggleGroupItem
            value="inc"
            size="sm"
            disabled={sqlEditorFontSize >= SQL_EDITOR_FONT_SIZE_MAX}
            className="h-[26px] min-w-[2rem] rounded-none rounded-r-md border-0 border-l border-strong px-2 text-xs font-medium data-[state=on]:bg-transparent"
            aria-label="Increase SQL editor font size"
          >
            A+
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex items-center justify-between gap-x-2">
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
