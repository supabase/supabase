import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { DocsButton } from 'components/ui/DocsButton'
import { InlineLink } from 'components/ui/InlineLink'
import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionDescription,
} from 'components/layouts/Scaffold'
import { useComplianceConfigUpdateMutation } from 'data/config/project-compliance-config-mutation'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Card, CardContent, Switch, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export const ComplianceConfig = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [isSensitive, setIsSensitive] = useState(false)

  const { can: canUpdateComplianceConfig } = useAsyncCheckProjectPermissions(
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
    isLoading,
    isSuccess,
  } = useProjectSettingsV2Query({ projectRef: ref })
  const initialIsSensitive = settings?.is_sensitive || false

  const { mutate: updateComplianceConfig, isLoading: isSubmitting } =
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
    <ScaffoldSection id="compliance-configuration" className="gap-6">
      <div className="flex items-center justify-between">
        <ScaffoldSectionTitle className="mb-0">
          High Compliance Configuration
          <ScaffoldSectionDescription>
            For projects storing and processing sensitive data (HIPAA)
          </ScaffoldSectionDescription>
        </ScaffoldSectionTitle>
        <DocsButton href="https://supabase.com/docs/guides/platform/hipaa-projects" />
      </div>

      <Card>
        <CardContent className="flex justify-between items-center">
          {isLoading ? (
            <GenericSkeletonLoader />
          ) : isError ? (
            <AlertError error={error} subject="Failed to retrieve project settings" />
          ) : isSuccess ? (
            <>
              <div>
                <p className="text-sm">Apply additional compliance controls to project</p>
                <p className="text-sm text-foreground-light">
                  Enable security warnings in the{' '}
                  <InlineLink href={`/project/${ref}/advisors/security`}>
                    Security Advisor
                  </InlineLink>{' '}
                  to enforce requirements for managing sensitive data
                </p>
              </div>
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
                    You need additional permissions to update the compliance configuration for your
                    project
                  </TooltipContent>
                )}
              </Tooltip>
            </>
          ) : null}
        </CardContent>
      </Card>
    </ScaffoldSection>
  )
}
