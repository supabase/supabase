import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import z from 'zod'

import { useProfileIdentitiesQuery } from 'data/profile/profile-identities-query'
import { useProfileUpdateMutation } from 'data/profile/profile-update-mutation'
import { useProfile } from 'lib/profile'
import { groupBy } from 'lodash'
import type { FormSchema } from 'types'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const FormSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  primary_email: z.string().email().optional(),
})

const formId = 'profile-information-form'

export const ProfileInformation = () => {
  const { profile } = useProfile()

  const {
    data: identityData,
    isLoading: isIdentitiesLoading,
    isSuccess: isIdentitiesSuccess,
  } = useProfileIdentitiesQuery()
  const identities = (identityData?.identities ?? []).filter((x) => x.identity_data?.email !== null)
  const dedupedIdentityEmails = Object.keys(groupBy(identities, 'identity_data.email'))

  const defaultValues = {
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    username: profile?.username ?? '',
    primary_email: profile?.primary_email ?? '',
  }

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues,
    values: defaultValues,
  })

  const { mutate: updateProfile, isLoading } = useProfileUpdateMutation({
    onSuccess: (data) => {
      toast.success('Successfully saved profile')
      const { first_name, last_name, username, primary_email } = data
      form.reset({ first_name, last_name, username, primary_email })
    },
    onError: (error) => toast.error(`Failed to update profile: ${error.message}`),
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    updateProfile({
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      username: data.username || '',
      primaryEmail: data.primary_email || '',
    })
  }

  return (
    <Form_Shadcn_ {...form}>
      <form id={formId} className="space-y-6 w-full" onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="mb-8">
          <CardHeader>Profile Information</CardHeader>
          <CardContent className="flex flex-col gap-y-2">
            <FormField_Shadcn_
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItemLayout label="First name" layout="horizontal">
                  <FormControl_Shadcn_ className="col-span-8">
                    <Input_Shadcn_ {...field} className="w-72" />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItemLayout label="Last name" layout="horizontal">
                  <FormControl_Shadcn_ className="col-span-8">
                    <Input_Shadcn_ {...field} className="w-72" />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="primary_email"
              render={({ field }) => (
                <FormItemLayout label="Primary email" layout="horizontal">
                  <FormControl_Shadcn_ className="col-span-8">
                    <div className="flex flex-col gap-1">
                      <Select_Shadcn_
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={profile?.is_sso_user}
                      >
                        <SelectTrigger_Shadcn_ className="col-span-8 w-72">
                          <SelectValue_Shadcn_ placeholder="Select primary email" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_ className="col-span-8">
                          {isIdentitiesSuccess &&
                            dedupedIdentityEmails.map((email) => (
                              <SelectItem_Shadcn_ key={email} value={email}>
                                {email}
                              </SelectItem_Shadcn_>
                            ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                      {(profile?.is_sso_user && (
                        <p className="text-xs text-foreground-light">
                          Primary email is managed by your SSO provider and cannot be changed here.
                        </p>
                      )) || (
                        <p className="text-xs text-foreground-light">
                          Primary email is used for account notifications.
                        </p>
                      )}
                    </div>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItemLayout label="Username" layout="horizontal">
                  <FormControl_Shadcn_ className="col-span-8">
                    <div className="flex flex-col gap-1">
                      <Input_Shadcn_ {...field} className="w-72" disabled={profile?.is_sso_user} />
                      {(profile?.is_sso_user && (
                        <p className="text-xs text-foreground-light">
                          Username is managed by your SSO provider and cannot be changed here.
                        </p>
                      )) || (
                        <p className="text-xs text-foreground-light">
                          Username appears as a display name throughout the dashboard.
                        </p>
                      )}
                    </div>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </CardContent>
          <CardFooter className="justify-end space-x-2">
            {form.formState.isDirty && (
              <Button type="default" onClick={() => form.reset()}>
                Cancel
              </Button>
            )}
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading || isIdentitiesLoading}
              disabled={!form.formState.isDirty}
            >
              Save
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form_Shadcn_>
  )
}
