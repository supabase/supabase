import { useParams } from 'common'
import { useIsSecurityNotificationsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { TEMPLATES_SCHEMAS } from '../AuthTemplatesValidation'
import EmailRateLimitsAlert from '../EmailRateLimitsAlert'
import { slugifyTitle } from './EmailTemplates.utils'
import TemplateEditor from './TemplateEditor'

export const EmailTemplates = () => {
  const isSecurityNotificationsEnabled = useIsSecurityNotificationsEnabled()
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
    <ScaffoldSection isFullWidth className="!pt-0">
      {isError && (
        <AlertError
          className="mt-12"
          error={authConfigError}
          subject="Failed to retrieve auth configuration"
        />
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
          {isSecurityNotificationsEnabled ? (
            <Card>
              {TEMPLATES_SCHEMAS.map((template) => {
                const templateSlug = slugifyTitle(template.title)
                return (
                  <CardContent key={`${template.id}`} className="p-0">
                    <Link
                      href={`/project/${projectRef}/auth/templates/${templateSlug}`}
                      className="flex items-center justify-between hover:bg-surface-200 transition-colors py-4 px-6 w-full h-full"
                    >
                      <div className="flex flex-col">
                        <h3 className="text-sm text-foreground">{template.title}</h3>
                        {template.purpose && (
                          <p className="text-sm text-foreground-lighter">{template.purpose}</p>
                        )}
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-foreground-muted group-hover:text-foreground transition-colors"
                      />
                    </Link>
                  </CardContent>
                )
              })}
            </Card>
          ) : (
            <Card>
              <Tabs_Shadcn_ defaultValue={slugifyTitle(TEMPLATES_SCHEMAS[0].title)}>
                <TabsList_Shadcn_ className="pt-2 px-6 gap-5 mb-0 overflow-x-scroll no-scrollbar mb-4">
                  {TEMPLATES_SCHEMAS.map((template) => {
                    return (
                      <TabsTrigger_Shadcn_
                        key={`${template.id}`}
                        value={slugifyTitle(template.title)}
                      >
                        {template.title}
                      </TabsTrigger_Shadcn_>
                    )
                  })}
                </TabsList_Shadcn_>
                {TEMPLATES_SCHEMAS.map((template) => {
                  const panelId = slugifyTitle(template.title)
                  return (
                    <TabsContent_Shadcn_ key={panelId} value={panelId} className="mt-0">
                      <TemplateEditor key={template.title} template={template} />
                    </TabsContent_Shadcn_>
                  )
                })}
              </Tabs_Shadcn_>
            </Card>
          )}
        </div>
      )}
    </ScaffoldSection>
  )
}
