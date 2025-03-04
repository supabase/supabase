import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import {
  Card,
  CardContent,
  ScrollArea,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
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
    <div className="w-full">
      {isError && (
        <AlertError error={authConfigError} subject="Failed to retrieve auth configuration" />
      )}
      {isLoading && (
        <div className="w-[854px] mt-12">
          <GenericSkeletonLoader />
        </div>
      )}
      {isSuccess && (
        <div className="my-12">
          {builtInSMTP ? (
            <div className="mb-4">
              <EmailRateLimitsAlert />
            </div>
          ) : null}
          <Card>
            <Tabs_Shadcn_ defaultValue={TEMPLATES_SCHEMAS[0].title.trim().replace(/\s+/g, '-')}>
              <TabsList_Shadcn_ className="pt-2 px-6 gap-5 mb-0 overflow-x-scroll no-scrollbar mb-4">
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
                  <TabsContent_Shadcn_ value={panelId} key={panelId} className="mt-0">
                    <TemplateEditor key={template.title} template={template} />
                  </TabsContent_Shadcn_>
                )
              })}
            </Tabs_Shadcn_>
          </Card>
        </div>
      )}
    </div>
  )
}

export default EmailTemplates
