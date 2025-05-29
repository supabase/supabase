import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'

// Import hooks for org and permissions
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import type { ResponseError } from 'types' // Removed Organization import as it's now fetched internally
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { invalidateOrganizationsQuery } from 'data/organizations/organizations-query'
import {
  Form_Shadcn_,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_ as Input,
  PrePostTab,
} from 'ui'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import CopyButton from 'components/ui/CopyButton'

// Schema for organization details using Zod
const OrgDetailsSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
})

const OrganizationDetailsForm = () => {
  const selectedOrganization = useSelectedOrganization()
  const canUpdateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const { slug } = useParams()
  const queryClient = useQueryClient()

  const { mutate: updateOrganization, isLoading: isUpdatingDetails } =
    useOrganizationUpdateMutation()

  const orgDetailsForm = useForm<z.infer<typeof OrgDetailsSchema>>({
    resolver: zodResolver(OrgDetailsSchema),
    defaultValues: { name: selectedOrganization?.name ?? '' },
  })

  useEffect(() => {
    if (selectedOrganization && !isUpdatingDetails) {
      orgDetailsForm.reset({ name: selectedOrganization.name ?? '' })
    }
  }, [selectedOrganization, orgDetailsForm.reset, isUpdatingDetails])

  const onUpdateOrganizationDetails = async (values: z.infer<typeof OrgDetailsSchema>) => {
    if (!canUpdateOrganization) {
      return toast.error('You do not have the required permissions to update this organization')
    }
    if (!slug) return console.error('Slug is required')

    updateOrganization(
      { slug, name: values.name },
      {
        onSuccess: () => {
          invalidateOrganizationsQuery(queryClient)
          toast.success('Successfully updated organization name')
        },
        onError: (error: ResponseError) => {
          toast.error(`Failed to update organization name: ${error.message}`)
        },
      }
    )
  }

  const permissionsHelperText = !canUpdateOrganization
    ? "You need additional permissions to manage this organization's settings"
    : undefined

  return (
    <Form_Shadcn_ {...orgDetailsForm}>
      <form
        id="org-details-form"
        onSubmit={orgDetailsForm.handleSubmit(onUpdateOrganizationDetails)}
      >
        <Card>
          <CardContent className="pt-6">
            <FormField_Shadcn_
              control={orgDetailsForm.control}
              name="name"
              render={({ field }) => (
                <FormItemLayout label="Organization name" layout="flex-row-reverse">
                  <FormControl_Shadcn_>
                    <Input
                      {...field}
                      className="w-96 max-w-full"
                      disabled={!canUpdateOrganization || isUpdatingDetails}
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </CardContent>
          <CardContent>
            <FormItemLayout label="Organization slug" layout="flex-row-reverse">
              <PrePostTab
                postTab={
                  <CopyButton type="text" iconOnly text={selectedOrganization?.slug ?? ''} />
                }
              >
                <Input
                  disabled
                  className="w-64 max-w-full"
                  id="slug"
                  value={selectedOrganization?.slug ?? ''}
                />
              </PrePostTab>
            </FormItemLayout>
          </CardContent>
          <CardFooter className="flex justify-end p-4 md:px-8">
            <FormActions
              form="org-details-form"
              isSubmitting={isUpdatingDetails}
              hasChanges={orgDetailsForm.formState.isDirty}
              handleReset={() => orgDetailsForm.reset()}
              helper={permissionsHelperText}
              disabled={!canUpdateOrganization}
            />
          </CardFooter>
        </Card>
      </form>
    </Form_Shadcn_>
  )
}

export default OrganizationDetailsForm
