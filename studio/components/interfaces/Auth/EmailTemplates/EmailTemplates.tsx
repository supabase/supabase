import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  IconExternalLink,
  Tabs,
} from 'ui'

import { useParams } from 'common'
import { FormHeader, FormPanel } from 'components/ui/Forms'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { TEMPLATES_SCHEMAS } from 'stores/authConfig/schema'
import TemplateEditor from './TemplateEditor'
import EmailRateLimitsAlert from '../EmailRateLimitsAlert'

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
          <Button type="default" icon={<IconExternalLink size={14} strokeWidth={1.5} />}>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://supabase.com/docs/guides/auth/auth-email-templates"
            >
              Documentation
            </a>
          </Button>
        </div>
      </div>
      {isError && (
        <Alert_Shadcn_ variant="destructive">
          <IconAlertCircle strokeWidth={2} />
          <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
        </Alert_Shadcn_>
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
                  <TemplateEditor
                    key={template.title}
                    template={template}
                    authConfig={authConfig as any}
                  />
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
