import { ChevronDown, Loader2, RefreshCw, Trash } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { forwardRef, useCallback, useState } from 'react'
import { toast } from 'sonner'

import {
  IntegrationConnection,
  IntegrationConnectionProps,
} from 'components/interfaces/Integrations/VercelGithub/IntegrationPanels'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useIntegrationsVercelConnectionSyncEnvsMutation } from 'data/integrations/integrations-vercel-connection-sync-envs-mutation'
import type { IntegrationProjectConnection } from 'data/integrations/integrations.types'
import { useProjectsQuery } from 'data/projects/projects-query'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

interface IntegrationConnectionItemProps extends IntegrationConnectionProps {
  disabled?: boolean
  onDeleteConnection: (connection: IntegrationProjectConnection) => void | Promise<void>
}

const IntegrationConnectionItem = forwardRef<HTMLLIElement, IntegrationConnectionItemProps>(
  ({ disabled, onDeleteConnection, ...props }, ref) => {
    const router = useRouter()

    const { type, connection } = props
    const { data: projects } = useProjectsQuery()
    const project = projects?.find((project) => project.ref === connection.supabase_project_ref)
    const isBranchingEnabled = project?.is_branch_enabled === true

    const [isOpen, setIsOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [dropdownVisible, setDropdownVisible] = useState(false)

    const onConfirm = useCallback(async () => {
      try {
        setIsDeleting(true)
        await onDeleteConnection(connection)
      } catch (error) {
        // [Joshen] No need for error handler
      } finally {
        setIsDeleting(false)
        setIsOpen(false)
      }
    }, [connection, onDeleteConnection])

    const onCancel = useCallback(() => {
      setIsOpen(false)
    }, [])

    const { mutate: syncEnvs, isLoading: isSyncEnvLoading } =
      useIntegrationsVercelConnectionSyncEnvsMutation({
        onSuccess: () => {
          toast.success('Successfully synced environment variables')
          setDropdownVisible(false)
        },
      })

    const onReSyncEnvVars = useCallback(async () => {
      syncEnvs({ connectionId: connection.id })
    }, [connection, syncEnvs])

    const projectIntegrationUrl = `/project/[ref]/settings/integrations`

    return (
      <>
        <IntegrationConnection
          showNode={false}
          actions={
            disabled ? (
              <ButtonTooltip
                disabled
                iconRight={<ChevronDown size={14} />}
                type="default"
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: 'You need additional permissions to manage this connection',
                  },
                }}
              >
                Manage
              </ButtonTooltip>
            ) : (
              <DropdownMenu
                open={dropdownVisible}
                onOpenChange={() => setDropdownVisible(!dropdownVisible)}
                modal={false}
              >
                <DropdownMenuTrigger asChild>
                  <Button iconRight={<ChevronDown size={14} />} type="default">
                    <span>Manage</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end">
                  {router.pathname !== projectIntegrationUrl && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={projectIntegrationUrl.replace(
                          '[ref]',
                          connection.supabase_project_ref
                        )}
                      >
                        Configure connection
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {type === 'Vercel' && (
                    <DropdownMenuItem
                      className="space-x-2"
                      onSelect={(event) => {
                        event.preventDefault()
                        onReSyncEnvVars()
                      }}
                      disabled={isSyncEnvLoading}
                    >
                      {isSyncEnvLoading ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      <p>Resync environment variables</p>
                    </DropdownMenuItem>
                  )}
                  {(type === 'Vercel' || router.pathname !== projectIntegrationUrl) && (
                    <DropdownMenuSeparator />
                  )}
                  <DropdownMenuItem className="space-x-2" onSelect={() => setIsOpen(true)}>
                    <Trash size={14} />
                    <p>Delete connection</p>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }
          {...props}
        />

        <ConfirmationModal
          variant="destructive"
          size={type === 'GitHub' && isBranchingEnabled ? 'medium' : 'small'}
          visible={isOpen}
          title={`Confirm to delete ${type} connection`}
          confirmLabel="Delete connection"
          onCancel={onCancel}
          onConfirm={onConfirm}
          loading={isDeleting}
          alert={
            type === 'GitHub' && isBranchingEnabled
              ? {
                  title: 'Branching will be disabled for this project',
                  description: ` Deleting this GitHub connection will remove all preview branches on this project,
                and also disable branching for ${project.name}`,
                }
              : undefined
          }
        >
          <p className="text-sm text-foreground-light">
            This action cannot be undone. Are you sure you want to delete this {type} connection?
          </p>
        </ConfirmationModal>
      </>
    )
  }
)

IntegrationConnectionItem.displayName = 'IntegrationConnectionItem'

export { IntegrationConnectionItem }
