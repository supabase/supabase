import { yupResolver } from '@hookform/resolvers/yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { object, string } from 'yup'

import { useParams } from 'common'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const schema = object({
  SITE_URL: string().required('Must have a Site URL'),
})

const SiteUrl = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isError,
    isLoading,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig } = useAuthConfigUpdateMutation()
  const [isUpdatingSiteUrl, setIsUpdatingSiteUrl] = useState(false)

  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const siteUrlForm = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      SITE_URL: '',
    },
  })

  useEffect(() => {
    if (authConfig && !isUpdatingSiteUrl) {
      siteUrlForm.reset({
        SITE_URL: authConfig.SITE_URL || '',
      })
    }
  }, [authConfig, isUpdatingSiteUrl])

  const onSubmitSiteUrl = (values: any) => {
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
      <ScaffoldSection isFullWidth>
        <AlertError error={authConfigError} subject="Failed to retrieve auth configuration" />
      </ScaffoldSection>
    )
  }

  if (isLoading) {
    return (
      <ScaffoldSection isFullWidth>
        <GenericSkeletonLoader />
      </ScaffoldSection>
    )
  }

  return (
    <ScaffoldSection isFullWidth>
      <ScaffoldSectionTitle className="mb-4">Site URL</ScaffoldSectionTitle>

      <Form_Shadcn_ {...siteUrlForm}>
        <form onSubmit={siteUrlForm.handleSubmit(onSubmitSiteUrl)} className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <FormField_Shadcn_
                control={siteUrlForm.control}
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
              {siteUrlForm.formState.isDirty && (
                <Button type="default" onClick={() => siteUrlForm.reset()}>
                  Cancel
                </Button>
              )}
              <Button
                type="primary"
                htmlType="submit"
                disabled={!canUpdateConfig || isUpdatingSiteUrl || !siteUrlForm.formState.isDirty}
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
