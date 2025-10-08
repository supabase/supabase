import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import CopyButton from 'components/ui/CopyButton'
import { FormActions } from 'components/ui/Forms/FormActions'
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { invalidateOrganizationsQuery } from 'data/organizations/organizations-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import type { ResponseError } from 'types'
import {
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_ as Input,
  PrePostTab,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const OrgDetailsSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
})

export const OrganizationDetailsForm = () => {
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const { can: canUpdateOrganization } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'organizations'
  )

  const { mutate: updateOrganization, isLoading: isUpdatingDetails } =
    useOrganizationUpdateMutation()

  const orgDetailsForm = useForm<z.infer<typeof OrgDetailsSchema>>({
    resolver: zodResolver(OrgDetailsSchema),
    defaultValues: { name: selectedOrganization?.name ?? '' },
  })

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

  useEffect(() => {
    if (selectedOrganization && !isUpdatingDetails) {
      orgDetailsForm.reset({ name: selectedOrganization.name ?? '' })
    }
  }, [selectedOrganization, orgDetailsForm, isUpdatingDetails])

  return (
    <Form_Shadcn_ {...orgDetailsForm}>
      <form
        id="org-details-form"
        onSubmit={orgDetailsForm.handleSubmit(onUpdateOrganizationDetails)}
      >
        <Card>
          <CardContent>
            <FormField_Shadcn_
              control={orgDetailsForm.control}
              name="name"
              render={({ field }) => (
                <FormItemLayout label="Organization name" layout="flex-row-reverse">
                  <FormControl_Shadcn_>
                    <Input
                      {...field}
                      className="w-full max-w-full md:w-96"
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
                className="w-full [&>div:first-child]:flex-grow [&>div:last-child]:px-1.5"
                postTab={
                  <CopyButton type="text" iconOnly text={selectedOrganization?.slug ?? ''} />
                }
              >
                <Input
                  disabled
                  className="w-full max-w-full md:w-64"
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
