import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { Tabs } from 'ui'
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
          <Tabs
            scrollable
            size="small"
            type="underlined"
            listClassNames="px-8 pt-4"
            defaultActiveId={TEMPLATES_SCHEMAS[0].title.trim().replace(/\s+/g, '-')}
          >
            {TEMPLATES_SCHEMAS.map((template) => {
              const panelId = template.title.trim().replace(/\s+/g, '-')
              return (
                <Tabs.Panel id={panelId} label={template.title} key={panelId}>
                  {builtInSMTP ? (
                    <div className="mx-8">
                      <EmailRateLimitsAlert />
                    </div>
                  ) : null}
                  <TemplateEditor key={template.title} template={template} />
                </Tabs.Panel>
              )
            })}
          </Tabs>
        </FormPanel>
      )}
    </div>
  )
}

export default EmailTemplates
