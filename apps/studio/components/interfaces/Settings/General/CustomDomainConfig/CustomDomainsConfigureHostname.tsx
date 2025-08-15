import { SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { FormActions } from 'components/ui/Forms/FormActions'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCheckCNAMERecordMutation } from 'data/custom-domains/check-cname-mutation'
import { useCustomDomainCreateMutation } from 'data/custom-domains/custom-domains-create-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Form_Shadcn_, FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const schema = z.object({
  domain: z.string({ required_error: 'A value for your custom domain is required' }),
})

const formId = 'custom-domains-form'

export const CustomDomainsConfigureHostname = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { domain: '' },
  })
  const { mutate: checkCNAMERecord, isLoading: isCheckingRecord } = useCheckCNAMERecordMutation()
  const { mutate: createCustomDomain, isLoading: isCreating } = useCustomDomainCreateMutation()
  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })
  const { can: canConfigureCustomDomain } = useAsyncCheckProjectPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ domain }) => {
    if (!ref) return console.error('Project ref is required')

    checkCNAMERecord(
      { domain },
      {
        onSuccess: () => {
          createCustomDomain({ projectRef: ref, customDomain: domain })
        },
      }
    )
  }

  const endpoint = settings?.app_config?.endpoint
  const domain = form.watch('domain')

  return (
    <Form_Shadcn_ {...form}>
      <FormPanel
        disabled={!canConfigureCustomDomain}
        footer={
          <div className="flex py-4 px-8">
            <FormActions
              form={formId}
              isSubmitting={isCheckingRecord || isCreating}
              submitText="Add"
              hasChanges={form.formState.isDirty}
              handleReset={form.reset}
              disabled={!true}
              helper={
                !canConfigureCustomDomain ? (
                  "You need additional permissions to update your project's custom domain settings"
                ) : (
                  <DocsButton href="https://supabase.com/docs/guides/platform/custom-domains" />
                )
              }
            />
          </div>
        }
      >
        <FormSection header={<FormSectionLabel>Add a custom domain</FormSectionLabel>}>
          <FormSectionContent loading={false}>
            <form
              id={formId}
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField_Shadcn_
                key="domain"
                name="domain"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout name="domain" label="Name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="domain"
                        className="w-full"
                        disabled={!canConfigureCustomDomain || isCheckingRecord || isCreating}
                        {...field}
                        placeholder="subdomain.example.com"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </form>
          </FormSectionContent>
        </FormSection>
        <FormSection header={<FormSectionLabel>Configure a CNAME record</FormSectionLabel>}>
          <p className="col-span-12 text-sm lg:col-span-7 leading-6">
            Set up a CNAME record for{' '}
            {domain ? <code className="text-xs">{domain}</code> : 'your custom domain'} resolving to{' '}
            {endpoint ? <code className="text-xs">{endpoint}</code> : "your project's API URL"} with
            as low a TTL as possible. If you're using Cloudflare as your DNS provider, disable the
            proxy option.
          </p>
        </FormSection>
      </FormPanel>
    </Form_Shadcn_>
  )
}

export default CustomDomainsConfigureHostname
