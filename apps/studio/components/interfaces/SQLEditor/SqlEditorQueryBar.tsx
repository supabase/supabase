import { Hotkey } from '@tanstack/react-hotkeys'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { AlignLeft, Check, Heart, Keyboard, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  KeyboardShortcut,
} from 'ui'

import { SqlRunButton } from './UtilityPanel/RunButton'
import SavingIndicator from './UtilityPanel/SavingIndicator'
import { SqlEditorLimitSelector } from './UtilityPanel/SqlEditorLimitSelector'
import { RoleImpersonationPopover } from '@/components/interfaces/RoleImpersonationSelector/RoleImpersonationPopover'
import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { IS_PLATFORM } from '@/lib/constants'
import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'

export type SqlEditorQueryBarProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  hasSelection?: boolean
  prettifyQuery: () => void
  executeQuery: () => void
}

export function SqlEditorQueryBar({
  id,
  isExecuting = false,
  isDisabled = false,
  hasSelection = false,
  prettifyQuery,
  executeQuery,
}: SqlEditorQueryBarProps) {
  const { ref } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [intelliSenseEnabled, setIntellisenseEnabled] = useLocalStorageQuery(
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
    setIntellisenseEnabled(!intelliSenseEnabled)
    toast.success(
      `Successfully ${intelliSenseEnabled ? 'disabled' : 'enabled'} intellisense. ${intelliSenseEnabled ? 'Please refresh your browser for changes to take place.' : ''}`
    )
  }

  const toggleFavorite = () => {
    if (isFavorite) snapV2.removeFavorite(id)
    else snapV2.addFavorite(id)
  }

  const onSelectDatabase = (databaseId: string) => {
    snapV2.resetResults(id)
    setLastSelectedDb(databaseId)
  }

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-b bg-dash-sidebar px-2 dark:bg-surface-100">
      <div className="flex min-w-0 items-center">{IS_PLATFORM && <SavingIndicator id={id} />}</div>

      <div className="flex items-center gap-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-testid="sql-editor-utility-actions"
              variant="default"
              icon={<MoreVertical />}
              className="h-[26px] w-[26px]"
              aria-label="Query options"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
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
                <DropdownMenuItem className="gap-x-2" onClick={toggleFavorite}>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-between" onClick={toggleIntellisense}>
              <span className="flex items-center gap-x-2">
                <Keyboard size={14} className="text-foreground-light" />
                IntelliSense enabled
              </span>
              {intelliSenseEnabled && <Check className="text-brand" size={16} />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {IS_PLATFORM && (
          <DatabaseSelector
            selectedDatabaseId={lastSelectedDb.length === 0 ? undefined : lastSelectedDb}
            onSelectId={onSelectDatabase}
          />
        )}
        <RoleImpersonationPopover serviceRoleLabel="postgres" header="Run SQL query as a role" />
        <SqlEditorLimitSelector />
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
