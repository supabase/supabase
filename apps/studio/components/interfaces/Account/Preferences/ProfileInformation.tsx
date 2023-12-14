import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
import {
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormLabel_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import z from 'zod'

import { FormActions } from 'components/ui/Forms'
import Panel from 'components/ui/Panel'
import { useProfileUpdateMutation } from 'data/profile/profile-update-mutation'
import { Profile } from 'data/profile/types'
import { useStore } from 'hooks'
import { FormSchema } from 'types'

const FormSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
})

const formId = 'profile-information-form'

export const ProfileInformation = ({ profile }: { profile: Profile }) => {
  const { ui } = useStore()

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { first_name: profile.first_name, last_name: profile.last_name },
  })

  const { mutateAsync: updateProfile, isLoading } = useProfileUpdateMutation({
    onSuccess: () => {
      ui.setNotification({ category: 'success', message: 'Successfully saved profile' })
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: "Couldn't update profile. Please try again later.",
      })
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    try {
      await updateProfile({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
      })
    } finally {
    }
  }

  return (
    <>
      <Panel
        className="mb-8"
        title={<h5>Profile Information</h5>}
        footer={
          <FormActions
            form={formId}
            isSubmitting={isLoading}
            hasChanges={form.formState.isDirty}
            handleReset={() => form.reset()}
          />
        }
      >
        <Form_Shadcn_ {...form}>
          <form
            id={formId}
            className="space-y-6 w-full px-8 py-8"
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
                    <Input_Shadcn_ {...field} className="w-full !mt-0" />
                  </FormControl_Shadcn_>
                  <FormMessage_Shadcn_ />
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
                    <Input_Shadcn_ {...field} className="w-full mt-0" />
                  </FormControl_Shadcn_>
                </FormItem_Shadcn_>
              )}
            />
          </form>
        </Form_Shadcn_>
      </Panel>
    </>
  )
}
