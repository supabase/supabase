import { Keyboard } from 'lucide-react'
import toast from 'react-hot-toast'

import { RoleImpersonationPopover } from 'components/interfaces/RoleImpersonationSelector'
import DatabaseSelector from 'components/ui/DatabaseSelector'
import { useLocalStorageQuery, useSelectedProject } from 'hooks'
import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'lib/constants'
import { detectOS } from 'lib/helpers'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconAlignLeft,
  IconCheck,
  IconCommand,
  IconCornerDownLeft,
  IconLoader,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import FavoriteButton from './FavoriteButton'
import SavingIndicator from './SavingIndicator'

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
  const project = useSelectedProject()
  const snap = useSqlEditorStateSnapshot()
  const showReadReplicasUI = project?.is_read_replicas_enabled

  const [intellisenseEnabled, setIntellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  return (
    <div className="inline-flex items-center justify-end gap-x-2">
      {IS_PLATFORM && <SavingIndicator id={id} />}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="text"
            className="px-1"
            icon={<Keyboard size={14} className="text-foreground-light" />}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem
            className="justify-between"
            onClick={() => {
              setIntellisenseEnabled(!intellisenseEnabled)
              toast.success(
                `Successfully ${intellisenseEnabled ? 'disabled' : 'enabled'} intellisense. ${intellisenseEnabled ? 'Please refresh your browser for changes to take place.' : ''}`
              )
            }}
          >
            <p>Intellisense enabled</p>
            {intellisenseEnabled && <IconCheck className="text-brand" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {IS_PLATFORM && <FavoriteButton id={id} />}

      <Tooltip_Shadcn_>
        <TooltipTrigger_Shadcn_ asChild>
          <Button
            type="text"
            onClick={() => prettifyQuery()}
            className="px-1"
            icon={<IconAlignLeft size="tiny" strokeWidth={2} className="text-gray-1100" />}
          />
        </TooltipTrigger_Shadcn_>
        <TooltipContent_Shadcn_ side="bottom">Prettify SQL</TooltipContent_Shadcn_>
      </Tooltip_Shadcn_>

      <div className="flex items-center justify-between gap-x-2 mx-2">
        <div className="flex items-center">
          {showReadReplicasUI && (
            <DatabaseSelector
              variant="connected-on-right"
              onSelectId={() => snap.resetResult(id)}
            />
          )}
          <RoleImpersonationPopover
            serviceRoleLabel="postgres"
            variant={showReadReplicasUI ? 'connected-on-both' : 'connected-on-right'}
          />
          <Button
            onClick={() => executeQuery()}
            disabled={isDisabled || isExecuting}
            type="primary"
            size="tiny"
            iconRight={
              isExecuting ? (
                <IconLoader className="animate-spin" size={10} strokeWidth={1.5} />
              ) : (
                <div className="flex items-center space-x-1">
                  {os === 'macos' ? (
                    <IconCommand size={10} strokeWidth={1.5} />
                  ) : (
                    <p className="text-xs text-foreground-light">CTRL</p>
                  )}
                  <IconCornerDownLeft size={10} strokeWidth={1.5} />
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
