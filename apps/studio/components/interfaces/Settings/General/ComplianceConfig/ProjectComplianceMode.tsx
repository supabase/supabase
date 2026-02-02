import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { InlineLink } from 'components/ui/InlineLink'
import { useComplianceConfigUpdateMutation } from 'data/config/project-compliance-config-mutation'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { Card, CardContent, Switch, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

export const ComplianceConfig = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [isSensitive, setIsSensitive] = useState(false)

  const { can: canUpdateComplianceConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: { project_id: project?.id },
    }
  )

  const {
    data: settings,
    error,
    isError,
    isPending: isLoading,
    isSuccess,
  } = useProjectSettingsV2Query({ projectRef: ref })
  const initialIsSensitive = settings?.is_sensitive || false

  const { mutate: updateComplianceConfig, isPending: isSubmitting } =
    useComplianceConfigUpdateMutation({
      onSuccess: () => {
        toast.success('Successfully updated project compliance configuration')
      },
      onError: (error) => {
        setIsSensitive(initialIsSensitive)
        toast.error(`Failed to update project compliance configuration: ${error.message}`)
      },
    })

  const toggleIsSensitive = async () => {
    if (!ref) return console.error('Project ref is required')
    setIsSensitive(!isSensitive)
    updateComplianceConfig({ projectRef: ref, isSensitive: !isSensitive })
  }

  useEffect(() => {
    if (!isLoading) setIsSensitive(initialIsSensitive)
  }, [isLoading])

  return (
    <PageSection id="compliance-configuration">
      <PageSectionMeta>
        <div className="flex flex-col gap-3 @lg:flex-row @lg:items-center @lg:justify-between">
          <PageSectionSummary>
            <PageSectionTitle>High Compliance Configuration</PageSectionTitle>
            <PageSectionDescription>
              For projects storing and processing sensitive data (HIPAA).
            </PageSectionDescription>
          </PageSectionSummary>
          <DocsButton href={`${DOCS_URL}/guides/platform/hipaa-projects`} />
        </div>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent className="flex flex-col gap-4 @lg:flex-row @lg:items-center @lg:justify-between">
            <div className="space-y-2 max-w-2xl">
              <p className="text-sm">Apply additional compliance controls to project</p>
              <p className="text-sm text-foreground-light">
                Enable security warnings in the{' '}
                <InlineLink href={`/project/${ref}/advisors/security`}>Security Advisor</InlineLink>{' '}
                to enforce requirements for managing sensitive data.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-2">
              {(isLoading || isSubmitting) && (
                <Loader2 className="animate-spin" strokeWidth={1.5} size={16} />
              )}
              {isError && (
                <AlertError error={error} subject="Failed to retrieve project settings" />
              )}
              {isSuccess && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* [Joshen] Added div as tooltip is messing with data state property of toggle */}
                    <div>
                      <Switch
                        size="large"
                        checked={isSensitive}
                        disabled={isLoading || isSubmitting || !canUpdateComplianceConfig}
                        onCheckedChange={toggleIsSensitive}
                      />
                    </div>
                  </TooltipTrigger>
                  {!canUpdateComplianceConfig && (
                    <TooltipContent side="bottom" className="w-64 text-center">
                      You need additional permissions to update the compliance configuration for
                      your project
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </div>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
