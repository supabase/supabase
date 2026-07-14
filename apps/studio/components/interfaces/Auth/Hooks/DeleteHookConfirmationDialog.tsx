import { joinSqlFragments } from '@supabase/pg-meta'
import { useParams } from 'common'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  cn,
} from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import { isBeforeFreeTierTemplateBlockCutoff } from '../EmailTemplates/EmailTemplates.utils'
import { isSmtpEnabled } from '../SmtpForm/SmtpForm.utils'
import { type Hook } from './hooks.constants'
import { getRevokePermissionStatements } from './hooks.utils'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthHooksUpdateMutation } from '@/data/auth/auth-hooks-update-mutation'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface DeleteHookConfirmationDialogProps {
  hook?: Hook
  onOpenChange: (open: boolean) => void
  onDeleteSuccess: () => void
}

export const DeleteHookConfirmationDialog = ({
  hook,
  onOpenChange,
  onDeleteSuccess,
}: DeleteHookConfirmationDialogProps) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: authConfig } = useAuthConfigQuery({ projectRef })

  const { mutate: updateAuthHooks, isPending: isDeletingAuthHook } = useAuthHooksUpdateMutation({
    onSuccess: async () => {
      if (!hook) return

      const { method } = hook
      if (method.type === 'postgres') {
        try {
          const revokeStatements = getRevokePermissionStatements(method.schema, method.functionName)
          await executeSql({
            projectRef,
            connectionString: project!.connectionString,
            sql: joinSqlFragments(revokeStatements, '\n'),
          })
          toast.success(`Successfully deleted ${hook.title}`)
        } catch (error) {
          toast.warning(
            `Deleted ${hook.title}, but failed to revoke permissions on ${method.schema}.${method.functionName}. You may want to revoke them manually.`
          )
        }
      }
      onDeleteSuccess()
    },
    onError: (error) => {
      toast.error(`Failed to delete hook: ${error.message}`)
    },
  })

  const open = !!hook

  // Whether deleting the Send Email hook will lock template editing:
  // post-cutoff Free plan projects without custom SMTP.
  const willLockTemplates =
    !!selectedOrganization &&
    selectedOrganization.plan?.id === 'free' &&
    !!project?.inserted_at &&
    !isBeforeFreeTierTemplateBlockCutoff(project.inserted_at) &&
    !isSmtpEnabled(authConfig)

  const handleDeleteSendEmailHook = async (): Promise<void> => {
    if (!hook) return
    updateAuthHooks({
      projectRef: projectRef!,
      config: {
        [hook.enabledKey]: false,
        [hook.uriKey]: null,
        [hook.secretsKey]: null,
      },
    })
  }

  if (hook?.id === 'send-email') {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm to delete Send Email hook</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  The {willLockTemplates ? 'default' : 'built-in'} email templates will be used when
                  sending authentication-related emails.
                </p>
                {willLockTemplates && (
                  <p>Email templates cannot be edited on the Free plan without custom SMTP.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              loading={isDeletingAuthHook}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteSendEmailHook()
              }}
            >
              Delete hook
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <ConfirmationModal
      visible={!!hook && hook.id !== 'send-email'}
      size="small"
      variant="destructive"
      loading={isDeletingAuthHook}
      title={`Confirm to delete ${hook?.title}`}
      className={cn('md:px-0', hook?.method.type === 'postgres' && 'pb-0')}
      confirmLabel="Delete"
      confirmLabelLoading="Deleting"
      onCancel={() => onOpenChange(false)}
      onConfirm={handleDeleteSendEmailHook}
    >
      <div>
        <p className="md:px-5 text-sm text-foreground-light">
          Are you sure you want to delete the {hook?.title}?
        </p>
        {hook?.method.type === 'postgres' && (
          <>
            <p className="md:px-5 text-sm text-foreground-light">
              The following statements will be executed on the {hook?.method.schema}.
              {hook?.method.functionName} function:
            </p>
            <div className="mt-4 h-72">
              <CodeEditor
                isReadOnly
                id="deletion-hook-editor"
                language="pgsql"
                value={getRevokePermissionStatements(
                  hook?.method.schema,
                  hook?.method.functionName
                ).join('\n\n')}
              />
            </div>
          </>
        )}
      </div>
    </ConfirmationModal>
  )
}
