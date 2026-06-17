import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useState } from 'react'
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
  AlertDialogTrigger,
  Button,
} from 'ui'

import { type AuthTemplate } from './EmailTemplates.types'
import { getAuthTemplateType } from './EmailTemplates.utils'
import { AuthConfigResponse } from '@/data/auth/auth-config-query'
import { useAuthTemplateResetMutation } from '@/data/auth/auth-template-reset-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

export const ResetTemplateDialog = ({
  template,
  hasUnsavedChanges,
  onResetSuccess,
}: {
  template: AuthTemplate
  hasUnsavedChanges: boolean
  onResetSuccess: (config: AuthConfigResponse) => void
}) => {
  const { ref: projectRef } = useParams()
  const [open, setOpen] = useState(false)
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const { id } = template
  const templateType = getAuthTemplateType(id)

  const { mutate: resetAuthTemplate, isPending: isResetting } = useAuthTemplateResetMutation()

  const resetTemplateToDefault = async () => {
    if (!projectRef) throw new Error('Project ref is required')
    if (!templateType) throw new Error('Template type is required')

    resetAuthTemplate(
      { projectRef, template: templateType },
      {
        onSuccess: (config) => {
          toast.success('Email template reset to default')
          onResetSuccess(config)
        },
      }
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="default" type="button" disabled={!canUpdateConfig}>
          Reset template
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset template to default</AlertDialogTitle>
          <AlertDialogDescription>
            {hasUnsavedChanges
              ? 'This will discard your unsaved changes and use the default subject line and email body content.'
              : 'This will remove your custom subject line and email body content. The default values will be used instead.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="warning"
            loading={isResetting}
            onClick={(e) => {
              e.preventDefault()
              resetTemplateToDefault()
            }}
          >
            Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
