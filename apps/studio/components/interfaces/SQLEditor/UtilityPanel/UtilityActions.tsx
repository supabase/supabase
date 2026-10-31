import { Hotkey } from '@tanstack/react-hotkeys'
import { LOCAL_STORAGE_KEYS, useFlag, useParams } from 'common'
import {
  AlignLeftIcon,
  ChevronDownIcon,
  HeartIcon,
  KeyboardIcon,
  MoreVerticalIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { useSqlEditorSaveCoordinator } from '@/state/sql-editor/sql-editor-save-coordinator'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

// DropdownMenuCheckboxItem puts its check indicator on the left. These menus show
// it on the right, matching the other toggle items, so move the indicator over.
const CHECKBOX_ITEM_CHECK_ON_RIGHT =
  'gap-x-2 pl-2 pr-8 [&>span:first-child]:left-auto [&>span:first-child]:right-2 [&>span:first-child_svg]:text-primary'

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
  const { saveFavorite } = useSqlEditorSaveCoordinator()

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
  const [confirmUnsavedChanges, setConfirmUnsavedChanges] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_CONFIRM_UNSAVED_CHANGES,
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
                className={cn('px-1', isAiOpen ? 'flex 2xl:hidden' : 'hidden')}
                icon={<MoreVerticalIcon className="text-foreground-light" />}
              />
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">More actions</TooltipContent>
        </Tooltip>
        <DropdownMenuContent className="w-56">
          <DropdownMenuCheckboxItem
            className={CHECKBOX_ITEM_CHECK_ON_RIGHT}
            checked={intellisenseEnabled}
            onCheckedChange={toggleIntellisense}
          >
            <KeyboardIcon size={14} className="text-foreground-light" />
            Intellisense enabled
          </DropdownMenuCheckboxItem>
          {isManualSaveEnabled && (
            <DropdownMenuCheckboxItem
              className={CHECKBOX_ITEM_CHECK_ON_RIGHT}
              checked={confirmUnsavedChanges}
              onCheckedChange={setConfirmUnsavedChanges}
            >
              <TriangleAlertIcon size={14} className="text-foreground-light" />
              Confirm on discard
            </DropdownMenuCheckboxItem>
          )}
          {IS_PLATFORM && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-x-2" onClick={() => saveFavorite(id, !isFavorite)}>
                <HeartIcon
                  size={14}
                  strokeWidth={2}
                  className={
                    isFavorite
                      ? 'fill-primary-bright stroke-none'
                      : 'fill-none stroke-foreground-light'
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
              <AlignLeftIcon size={14} strokeWidth={2} className="text-foreground-light" />
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
                  icon={<MoreVerticalIcon className="text-foreground-light" />}
                  aria-label="More actions"
                />
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">More actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent className="w-56">
            <DropdownMenuCheckboxItem
              className={CHECKBOX_ITEM_CHECK_ON_RIGHT}
              checked={intellisenseEnabled}
              onCheckedChange={toggleIntellisense}
            >
              <KeyboardIcon size={14} className="text-foreground-light" />
              Intellisense enabled
            </DropdownMenuCheckboxItem>
            {isManualSaveEnabled && (
              <DropdownMenuCheckboxItem
                className={CHECKBOX_ITEM_CHECK_ON_RIGHT}
                checked={confirmUnsavedChanges}
                onCheckedChange={setConfirmUnsavedChanges}
              >
                <TriangleAlertIcon size={14} className="text-foreground-light" />
                Confirm on discard
              </DropdownMenuCheckboxItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {IS_PLATFORM && (
          <Tooltip>
            <TooltipTrigger asChild>
              {isFavorite ? (
                <Button
                  variant="text"
                  size="tiny"
                  onClick={() => saveFavorite(id, false)}
                  className="px-1"
                  icon={<HeartIcon className="fill-primary-bright stroke-none" />}
                  aria-label="Remove from favorites"
                />
              ) : (
                <Button
                  variant="text"
                  size="tiny"
                  onClick={() => saveFavorite(id, true)}
                  className="px-1"
                  icon={<HeartIcon className="fill-none stroke-foreground-light" />}
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
          icon={<AlignLeftIcon strokeWidth={2} className="text-foreground-light" />}
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
                <Button iconRight={<ChevronDownIcon size={14} className="text-foreground-light" />}>
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
