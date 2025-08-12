import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { toast } from 'sonner'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const schema = z.object({
  SITE_URL: z.string().url('Must have a Site URL'),
})

const SiteUrl = () => {
  const { ref: projectRef } = useParams()
  const { data: authConfig, error: authConfigError, isError } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig } = useAuthConfigUpdateMutation()
  const [isUpdatingSiteUrl, setIsUpdatingSiteUrl] = useState(false)

  const { can: canUpdateConfig } = useAsyncCheckProjectPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      SITE_URL: '',
    },
  })

  useEffect(() => {
    if (authConfig && !isUpdatingSiteUrl) {
      form.reset({
        SITE_URL: authConfig.SITE_URL || '',
      })
    }
  }, [authConfig, isUpdatingSiteUrl])

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = (values) => {
    setIsUpdatingSiteUrl(true)

    updateAuthConfig(
      { projectRef: projectRef!, config: values },
      {
        onError: (error) => {
          toast.error(`Failed to update site URL: ${error?.message}`)
          setIsUpdatingSiteUrl(false)
        },
        onSuccess: () => {
          toast.success('Successfully updated site URL')
          setIsUpdatingSiteUrl(false)
        },
      }
    )
  }

  if (isError) {
    return (
      <Alert_Shadcn_ variant="destructive">
        <AlertCircle strokeWidth={2} />
        <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle className="mb-4">Site URL</ScaffoldSectionTitle>

      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <FormField_Shadcn_
                control={form.control}
                name="SITE_URL"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Site URL"
                    description="Configure the default redirect URL used when a redirect URL is not specified or doesn't match one from the allow list. This value is also exposed as a template variable in the email templates section. Wildcards cannot be used here."
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} disabled={!canUpdateConfig} />
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
                disabled={!canUpdateConfig || isUpdatingSiteUrl || !form.formState.isDirty}
                loading={isUpdatingSiteUrl}
              >
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form_Shadcn_>
    </ScaffoldSection>
  )
}

export default SiteUrl
