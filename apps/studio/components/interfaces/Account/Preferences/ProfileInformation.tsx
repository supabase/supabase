import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import z from 'zod'

import { FormActions } from 'components/ui/Forms/FormActions'
import Panel from 'components/ui/Panel'
import { useProfileIdentitiesQuery } from 'data/profile/profile-identities-query'
import { useProfileUpdateMutation } from 'data/profile/profile-update-mutation'
import { useProfile } from 'lib/profile'
import type { FormSchema } from 'types'

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
  const identities = identityData?.identities ?? []
  const primaryIdentityId = identities.find(
    (identity) => identity.identity_data?.email === profile?.primary_email
  )?.identity_id

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      first_name: profile?.first_name ?? '',
      last_name: profile?.last_name ?? '',
      username: profile?.username ?? '',
      primary_email: profile?.primary_email ?? '',
    },
  })

  const { mutate: updateProfile, isLoading } = useProfileUpdateMutation({
    onSuccess: (data) => {
      toast.success('Successfully saved profile')
      form.reset({
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        primary_email: data.primary_email,
      })
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
    <>
      <Panel
        className="mb-4 md:mb-8"
        title={<h5>Profile Information</h5>}
        footer={
          <FormActions
            form={formId}
            isSubmitting={isLoading || isIdentitiesLoading}
            hasChanges={form.formState.isDirty}
            handleReset={() => form.reset()}
          />
        }
      >
        <Form_Shadcn_ {...form}>
          <form
            id={formId}
            className="space-y-6 w-full p-4 md:p-8"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField_Shadcn_
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                  <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                    First name
                  </FormLabel_Shadcn_>
                  <FormControl_Shadcn_ className="col-span-8">
                    <Input_Shadcn_ {...field} className="w-full" />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                  <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                    Last name
                  </FormLabel_Shadcn_>
                  <FormControl_Shadcn_ className="col-span-8">
                    <Input_Shadcn_ {...field} className="w-full" />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="primary_email"
              render={({ field }) => (
                <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                  <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                    Primary Email
                  </FormLabel_Shadcn_>
                  <FormControl_Shadcn_ className="col-span-8">
                    <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger_Shadcn_ className="col-span-8">
                        <SelectValue_Shadcn_ placeholder="Select primary email" />
                      </SelectTrigger_Shadcn_>

                      <SelectContent_Shadcn_ className="col-span-8">
                        {isIdentitiesSuccess &&
                          identities.map((identity) => {
                            const getProviderName = (provider: string) =>
                              provider === 'github'
                                ? 'GitHub'
                                : provider.startsWith('sso')
                                  ? 'SSO'
                                  : provider
                            const { identity_id, provider } = identity
                            const email = identity.identity_data?.email
                            const providerName = getProviderName(provider)

                            return (
                              <SelectItem_Shadcn_ key={identity_id} value={email}>
                                {email} ({providerName})
                              </SelectItem_Shadcn_>
                            )
                          })}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormControl_Shadcn_>

                  <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                </FormItem_Shadcn_>
              )}
            />
            <FormField_Shadcn_
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem_Shadcn_ className="grid gap-2 md:grid md:grid-cols-12 space-y-0">
                  <FormLabel_Shadcn_ className="flex flex-col space-y-2 col-span-4 text-sm justify-center text-foreground-light">
                    Username
                  </FormLabel_Shadcn_>
                  <FormControl_Shadcn_ className="col-span-8">
                    <Input_Shadcn_ {...field} className="w-full" />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ className="col-start-5 col-span-8" />
                </FormItem_Shadcn_>
              )}
            />
          </form>
        </Form_Shadcn_>
      </Panel>
    </>
  )
}
