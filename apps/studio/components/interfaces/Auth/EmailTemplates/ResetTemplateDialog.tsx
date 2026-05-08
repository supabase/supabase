import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
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
  onResetSuccess,
}: {
  template: AuthTemplate
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

  const { mutate: resetAuthTemplate, isPending: isResettingTemplate } =
    useAuthTemplateResetMutation()

  const resetTemplateToDefault = () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!templateType) return console.error('Template type is required')

    resetAuthTemplate(
      {
        projectRef,
        template: templateType,
      },
      {
        onSuccess: (config) => {
          toast.success('Email template reset to default')
          onResetSuccess(config)
          setOpen(false)
        },
      }
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="default" htmlType="button" disabled={!canUpdateConfig || isResettingTemplate}>
          Reset template
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset template to default</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove your custom subject line and email body content. The default values
            will be used instead.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResettingTemplate}>Cancel</AlertDialogCancel>
          <Button type="warning" onClick={resetTemplateToDefault} loading={isResettingTemplate}>
            Reset
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
