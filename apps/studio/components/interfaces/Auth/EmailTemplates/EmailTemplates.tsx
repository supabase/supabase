import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { Tabs, Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { TEMPLATES_SCHEMAS } from '../AuthTemplatesValidation'
import EmailRateLimitsAlert from '../EmailRateLimitsAlert'
import TemplateEditor from './TemplateEditor'

const EmailTemplates = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })

  const builtInSMTP =
    isSuccess &&
    authConfig &&
    (!authConfig.SMTP_HOST || !authConfig.SMTP_USER || !authConfig.SMTP_PASS)

  return (
    <div>
      <div className="flex justify-between items-center">
        <FormHeader
          title="Email Templates"
          description="Customize the emails that will be sent out to your users."
        />
        <div className="mb-6">
          <DocsButton href="https://supabase.com/docs/guides/auth/auth-email-templates" />
        </div>
      </div>
      {isError && (
        <AlertError error={authConfigError} subject="Failed to retrieve auth configuration" />
      )}
      {isLoading && <GenericSkeletonLoader />}
      {isSuccess && (
        <FormPanel>
          <Tabs_Shadcn_ defaultValue={TEMPLATES_SCHEMAS[0].title.trim().replace(/\s+/g, '-')}>
            <TabsList_Shadcn_ className="px-8 pt-2 gap-5">
              {TEMPLATES_SCHEMAS.map((template) => {
                return (
                  <TabsTrigger_Shadcn_ value={template.title.trim().replace(/\s+/g, '-')}>
                    {template.title}
                  </TabsTrigger_Shadcn_>
                )
              })}
            </TabsList_Shadcn_>

            {TEMPLATES_SCHEMAS.map((template) => {
              const panelId = template.title.trim().replace(/\s+/g, '-')
              return (
                <TabsContent_Shadcn_ value={panelId} key={panelId}>
                  {builtInSMTP ? (
                    <div className="mx-8">
                      <EmailRateLimitsAlert />
                    </div>
                  ) : null}
                  <TemplateEditor key={template.title} template={template} />
                </TabsContent_Shadcn_>
              )
            })}
          </Tabs_Shadcn_>
        </FormPanel>
      )}
    </div>
  )
}

export default EmailTemplates
