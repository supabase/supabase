import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect } from 'react'

import { FormActions } from 'components/ui/Forms/FormActions'
import { useAIOptInForm } from 'hooks/forms/useAIOptInForm'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Card, CardContent, CardFooter, Form_Shadcn_ } from 'ui'
import { AIOptInLevelSelector } from './AIOptInLevelSelector'

export const DataPrivacyForm = () => {
  const { form, onSubmit, isUpdating, currentOptInLevel } = useAIOptInForm()
  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')

  const permissionsHelperText = !canUpdateOrganization
    ? "You need additional permissions to manage this organization's settings"
    : undefined

  useEffect(() => {
    form.reset({ aiOptInLevel: currentOptInLevel })
  }, [currentOptInLevel, form])

  return (
    <Form_Shadcn_ {...form}>
      <form id="org-privacy-form" onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="pt-6">
            <AIOptInLevelSelector
              control={form.control}
              disabled={!canUpdateOrganization || isUpdating}
              layout="flex-row-reverse"
              label="Supabase Assistant Opt-in Level"
            />
          </CardContent>
          <CardFooter className="flex justify-end p-4 md:px-8">
            <FormActions
              form="org-privacy-form"
              isSubmitting={isUpdating}
              hasChanges={form.formState.isDirty}
              handleReset={() => form.reset()}
              helper={permissionsHelperText}
              disabled={!canUpdateOrganization}
            />
          </CardFooter>
        </Card>
      </form>
    </Form_Shadcn_>
  )
}
