import { Hotkey } from '@tanstack/react-hotkeys'
import { LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  KeyboardShortcut,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { ROWS_PER_PAGE_OPTIONS } from '../SQLEditor.constants'
import { AutosaveStatus } from './AutosaveStatus'
import { QuerySourceMenu } from './QuerySourceMenu/QuerySourceMenu'
import { SqlRunButton } from './RunButton'
import { SqlSaveButton } from './SaveButton'
import SavingIndicator from './SavingIndicator'
import { useIsSqlEditorManualSaveEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { RoleImpersonationPopover } from '@/components/interfaces/RoleImpersonationSelector/RoleImpersonationPopover'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { type QuerySourceBinding } from '@/data/query-sources/query-source-registry'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { IS_PLATFORM } from '@/lib/constants'
import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

export type UtilityActionsProps = {
  id: string
  runSource: QuerySourceBinding
  isExecuting?: boolean
  isDisabled?: boolean
  hasSelection?: boolean
  prettifyQuery: () => void
  executeQuery: () => void
  className?: string
}

export const UtilityActions = ({
  id,
  runSource,
  isExecuting = false,
  isDisabled = false,
  hasSelection = false,
  prettifyQuery,
  executeQuery,
  className,
}: UtilityActionsProps) => {
  const { ref } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const sessionSnap = useSqlEditorSessionSnapshot()
  const isManualSaveEnabled = useIsSqlEditorManualSaveEnabled()

  const isLogsSourceEnabled = useFlag('sqlEditorLogsSource')
  const isOtelLogsEnabled = useFlag('otelLegacyLogs')

  const isLogs = runSource._tag === 'logs'
  const canCreateLogsSnippet = isLogsSourceEnabled && isOtelLogsEnabled
  const canShowSourceIndicator = isLogs || canCreateLogsSnippet
  const isLogsRunBlocked = isLogs && !isOtelLogsEnabled

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
    sessionSnap.resetResult(id)
    setLastSelectedDb(databaseId)
  }

  return (
    <div className={cn('flex items-center justify-end gap-x-2', className)}>
      <AutosaveStatus id={id} />
      {/* SavingIndicator reports auto-save progress (spinner/checkmark). In manual
          mode AutosaveStatus + the Save button own the status, so hide it there. */}
      {IS_PLATFORM && !isManualSaveEnabled && <SavingIndicator id={id} />}

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="More actions"
                data-testid="sql-editor-utility-actions"
                variant="default"
                className={cn('px-1', isAiOpen ? 'block 2xl:hidden' : 'hidden')}
                icon={<MoreVertical className="text-foreground-light" />}
              />
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">More actions</TooltipContent>
        </Tooltip>
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
          <DropdownMenuItemTooltip
            className="justify-between"
            onClick={prettifyQuery}
            disabled={isLogs}
            tooltip={{
              content: {
                side: 'left',
                text: isLogs ? 'Can only prettify database queries' : undefined,
              },
            }}
          >
            <span className="flex items-center gap-x-2">
              <AlignLeft size={14} strokeWidth={2} className="text-foreground-light" />
              Prettify SQL
            </span>
            {formatKeys && <KeyboardShortcut keys={formatKeys} />}
          </DropdownMenuItemTooltip>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className={cn('items-center gap-x-2', isAiOpen ? 'hidden 2xl:flex' : 'flex')}>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="text"
                  className="px-1"
                  icon={<Keyboard className="text-foreground-light" />}
                  aria-label="Enable Intellisense"
                />
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Enable Intellisense</TooltipContent>
          </Tooltip>
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
                  aria-label="Remove from favorites"
                />
              ) : (
                <Button
                  variant="text"
                  size="tiny"
                  onClick={addFavorite}
                  className="px-1"
                  icon={<Heart className="fill-none stroke-foreground-light" />}
                  aria-label="Add to favorites"
                />
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isFavorite ? 'Remove from' : 'Add to'} favorites
            </TooltipContent>
          </Tooltip>
        )}

        <ButtonTooltip
          variant="text"
          onClick={prettifyQuery}
          disabled={isLogs}
          className="px-1"
          icon={<AlignLeft strokeWidth={2} className="text-foreground-light" />}
          aria-label="Prettify SQL"
          tooltip={{
            content: {
              side: 'bottom',
              className: isLogs ? undefined : 'p-1 pl-2.5',
              text: isLogs ? (
                'Can only prettify database queries'
              ) : (
                <div className="flex items-center gap-2.5">
                  <span>Prettify SQL</span>
                  {formatKeys && <KeyboardShortcut keys={formatKeys} />}
                </div>
              ),
            },
          }}
        />
      </div>

      <div className="flex items-center gap-x-2">
        {canShowSourceIndicator ? (
          <QuerySourceMenu
            id={id}
            runSource={runSource}
            canCreateLogsSnippet={canCreateLogsSnippet}
          />
        ) : (
          <>
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
                variant={IS_PLATFORM ? 'connected-on-left' : 'regular'}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  iconRight={<ChevronDown size={14} className="text-foreground-light" />}
                >
                  <span className="text-foreground-light">Limit</span>{' '}
                  {ROWS_PER_PAGE_OPTIONS.find((opt) => opt.value === sessionSnap.limit)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align="end">
                <DropdownMenuRadioGroup
                  value={sessionSnap.limit.toString()}
                  onValueChange={(val) => sessionSnap.setLimit(Number(val))}
                >
                  {ROWS_PER_PAGE_OPTIONS.map((option) => (
                    <DropdownMenuRadioItem key={option.label} value={option.value.toString()}>
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        <div className="flex items-center">
          {isManualSaveEnabled && <SqlSaveButton id={id} className="rounded-r-none" />}
          <SqlRunButton
            hasSelection={hasSelection}
            isDisabled={isDisabled || isExecuting || isLogsRunBlocked}
            isExecuting={isExecuting}
            disabledReason={
              isLogsRunBlocked
                ? "Querying logs from the SQL editor isn't available for this project yet"
                : undefined
            }
            className={isManualSaveEnabled ? 'rounded-l-none' : undefined}
            onClick={executeQuery}
          />
        </div>
      </div>
    </div>
  )
}
