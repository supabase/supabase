import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCheckCNAMERecordMutation } from 'data/custom-domains/check-cname-mutation'
import { useCustomDomainCreateMutation } from 'data/custom-domains/custom-domains-create-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const schema = z.object({
  domain: z.string().trim().min(1, 'A value for your custom domain is required'),
})

const CustomDomainsConfigureHostname = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { mutate: checkCNAMERecord, isPending: isCheckingRecord } = useCheckCNAMERecordMutation()
  const { mutate: createCustomDomain, isPending: isCreating } = useCustomDomainCreateMutation()
  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })

  const endpoint = settings?.app_config?.endpoint
  const { can: canConfigureCustomDomain } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      domain: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const onCreateCustomDomain = async (values: z.infer<typeof schema>) => {
    if (!ref) return console.error('Project ref is required')

    checkCNAMERecord(
      { domain: values.domain.trim() },
      {
        onSuccess: () => {
          createCustomDomain({ projectRef: ref, customDomain: values.domain.trim() })
        },
      }
    )
  }

  const domain = form.watch('domain')
  const isSubmitting = isCheckingRecord || isCreating

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onCreateCustomDomain)}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
            <CardTitle>Add a custom domain</CardTitle>
            <DocsButton href={`${DOCS_URL}/guides/platform/custom-domains`} />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Custom domain"
                    description="Enter the subdomain you want to use."
                    className="[&>div]:md:w-1/2"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        placeholder="subdomain.example.com"
                        disabled={!canConfigureCustomDomain || isSubmitting}
                        autoComplete="off"
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItemLayout>
                )}
              />
            </div>
          </CardContent>
          <CardContent>
            <h4 className="text-sm mb-1">Configure a CNAME record</h4>
            <p className="text-sm text-foreground-light">
              Set up a CNAME record for{' '}
              {domain ? <code className="text-code-inline">{domain}</code> : 'your custom domain'}{' '}
              resolving to{' '}
              {endpoint ? (
                <code className="text-code-inline">{endpoint}</code>
              ) : (
                "your project's API URL"
              )}{' '}
              with as low a TTL as possible. If you're using Cloudflare as your DNS provider,
              disable the proxy option.
            </p>
          </CardContent>

          <CardFooter className="justify-end space-x-2">
            {form.formState.isDirty && (
              <Button
                type="default"
                disabled={isSubmitting}
                onClick={() => form.reset({ domain: '' })}
              >
                Cancel
              </Button>
            )}
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              disabled={!form.formState.isDirty || isSubmitting || !canConfigureCustomDomain}
            >
              Add
            </Button>
          </CardFooter>
        </Card>

        {!canConfigureCustomDomain && (
          <p className="text-xs text-foreground-light">
            You need additional permissions to update your project's custom domain settings.
          </p>
        )}
      </form>
    </Form_Shadcn_>
  )
}

export default CustomDomainsConfigureHostname
