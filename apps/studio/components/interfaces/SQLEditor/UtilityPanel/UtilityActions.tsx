import { useQueryClient } from '@tanstack/react-query'
import {
  AlignLeft,
  Check,
  ChevronDown,
  Command,
  CornerDownLeft,
  Heart,
  Keyboard,
  Loader2,
  MoreVertical,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { RoleImpersonationPopover } from 'components/interfaces/RoleImpersonationSelector'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { Content, ContentData } from 'data/content/content-query'
import { contentKeys } from 'data/content/keys'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { detectOS } from 'lib/helpers'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'
import SavingIndicator from './SavingIndicator'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { useFlag } from 'hooks/ui/useFlag'
import { Snippet } from 'data/content/sql-folders-query'

const ROWS_PER_PAGE_OPTIONS = [
  { value: -1, label: 'No limit' },
  { value: 100, label: '100 rows' },
  { value: 500, label: '500 rows' },
  { value: 1000, label: '1,000 rows' },
]

export type UtilityActionsProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  hasSelection: boolean
  prettifyQuery: () => void
  executeQuery: () => void
}

const UtilityActions = ({
  id,
  isExecuting = false,
  isDisabled = false,
  hasSelection,
  prettifyQuery,
  executeQuery,
}: UtilityActionsProps) => {
  const os = detectOS()
  const client = useQueryClient()
  const { project } = useProjectContext()

  const snap = useSqlEditorStateSnapshot()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const enableFolders = useFlag('sqlFolderOrganization')

  const [isAiOpen] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.SQL_EDITOR_AI_OPEN, true)
  const [intellisenseEnabled, setIntellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  const snippet = enableFolders ? snapV2.snippets[id] : snap.snippets[id]
  const isFavorite =
    snippet !== undefined
      ? enableFolders
        ? (snippet.snippet as Snippet).favorite
        : snippet.snippet.content.favorite
      : false

  const toggleIntellisense = () => {
    setIntellisenseEnabled(!intellisenseEnabled)
    toast.success(
      `Successfully ${intellisenseEnabled ? 'disabled' : 'enabled'} intellisense. ${intellisenseEnabled ? 'Please refresh your browser for changes to take place.' : ''}`
    )
  }

  const addFavorite = async () => {
    if (enableFolders) {
      snapV2.addFavorite(id)
    } else {
      snap.addFavorite(id)
    }

    client.setQueryData<ContentData>(
      contentKeys.list(project?.ref),
      (oldData: ContentData | undefined) => {
        if (!oldData) return

        return {
          ...oldData,
          content: oldData.content.map((content: Content) => {
            if (content.type === 'sql' && content.id === id) {
              return {
                ...content,
                content: { ...content.content, favorite: true },
              }
            }
            return content
          }),
        }
      }
    )
  }

  const removeFavorite = async () => {
    if (enableFolders) {
      snapV2.removeFavorite(id)
    } else {
      snap.removeFavorite(id)
    }

    client.setQueryData<ContentData>(
      contentKeys.list(project?.ref),
      (oldData: ContentData | undefined) => {
        if (!oldData) return

        return {
          ...oldData,
          content: oldData.content.map((content: Content) => {
            if (content.type === 'sql' && content.id === id) {
              return {
                ...content,
                content: { ...content.content, favorite: false },
              }
            }
            return content
          }),
        }
      }
    )
  }

  return (
    <div className="inline-flex items-center justify-end gap-x-2">
      {IS_PLATFORM && <SavingIndicator id={id} />}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="default"
            className={cn('px-1', isAiOpen ? 'block 2xl:hidden' : 'hidden')}
            icon={<MoreVertical size={14} className="text-foreground-light" />}
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
          <DropdownMenuItem className="gap-x-2" onClick={prettifyQuery}>
            <AlignLeft size={14} strokeWidth={2} />
            Prettify SQL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className={cn('items-center gap-x-2', isAiOpen ? 'hidden 2xl:flex' : 'flex')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="text"
              className="px-1"
              icon={<Keyboard size={14} className="text-foreground-light" />}
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
          <Tooltip_Shadcn_>
            <TooltipTrigger_Shadcn_ asChild>
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
            </TooltipTrigger_Shadcn_>
            <TooltipContent_Shadcn_ side="bottom">
              {isFavorite ? 'Remove from' : 'Add to'} favorites
            </TooltipContent_Shadcn_>
          </Tooltip_Shadcn_>
        )}

        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              type="text"
              onClick={prettifyQuery}
              className="px-1"
              icon={<AlignLeft strokeWidth={2} />}
            />
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ side="bottom">Prettify SQL</TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" iconRight={<ChevronDown size={14} />}>
            {
              ROWS_PER_PAGE_OPTIONS.find(
                (opt) => opt.value === (enableFolders ? snapV2.limit : snap.limit)
              )?.label
            }
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-42">
          <DropdownMenuRadioGroup
            value={enableFolders ? snapV2.limit.toString() : snap.limit.toString()}
            onValueChange={(val) => {
              if (enableFolders) snapV2.setLimit(Number(val))
              else snap.setLimit(Number(val))
            }}
          >
            {ROWS_PER_PAGE_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.label} value={option.value.toString()}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center justify-between gap-x-2">
        <div className="flex items-center">
          <DatabaseSelector
            variant="connected-on-right"
            onSelectId={() => {
              if (enableFolders) snapV2.resetResult(id)
              else snap.resetResult(id)
            }}
          />
          <RoleImpersonationPopover serviceRoleLabel="postgres" variant="connected-on-both" />
          <Button
            onClick={() => executeQuery()}
            disabled={isDisabled || isExecuting}
            type="primary"
            size="tiny"
            iconRight={
              isExecuting ? (
                <Loader2 className="animate-spin" size={10} strokeWidth={1.5} />
              ) : (
                <div className="flex items-center space-x-1">
                  {os === 'macos' ? (
                    <Command size={10} strokeWidth={1.5} />
                  ) : (
                    <p className="text-xs text-foreground-light">CTRL</p>
                  )}
                  <CornerDownLeft size={10} strokeWidth={1.5} />
                </div>
              )
            }
            className="rounded-l-none"
          >
            {hasSelection ? 'Run selected' : 'Run'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UtilityActions
