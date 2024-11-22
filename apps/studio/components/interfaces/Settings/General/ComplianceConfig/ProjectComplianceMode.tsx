import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useComplianceConfigUpdateMutation } from 'data/config/project-compliance-config-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

import { Switch, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_ } from 'ui'

const ComplianceConfig = () => {
  const { ref } = useParams()
  const [isSensitive, setIsSensitive] = useState(false)
  const selectedOrganization = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrganization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)
  const { data: settings, isLoading, isSuccess } = useProjectSettingsV2Query({ projectRef: ref }, { enabled: hasHipaaAddon })

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

  const { project } = useProjectContext()
  const canUpdateComplianceConfig = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })
  const initialIsSensitive = settings?.is_sensitive || false

  useEffect(() => {
    if (!isLoading) {
      setIsSensitive(initialIsSensitive)
    }
  }, [isLoading])

  const toggleIsSensitive = async () => {
    if (!ref) return console.error('Project ref is required')
    setIsSensitive(!isSensitive)
    updateComplianceConfig({ projectRef: ref, isSensitive: !isSensitive })
  }

  // this is only setable on compliance orgs, currently that means HIPAA orgs
  if (!hasHipaaAddon) {
    return
  }

  return (
    <div id="compliance-configuration">
      <div className="flex items-center justify-between mb-6">
        <FormHeader className="mb-0" title="High Compliance Configuration" description="" />
        <DocsButton href="https://supabase.com/docs/guides/deployment/shared-responsibility-model#managing-healthcare-data" />
      </div>
      <FormPanel>
        <FormSection
          header={
            <FormSectionLabel
              className="lg:col-span-7"
              description={
                <div className="space-y-4">
                  <p className="text-sm text-foreground-light">
                    Apply additional compliance controls to this project
                  </p>
                </div>
              }
            >
              Project processes sensitive data (HIPAA)
            </FormSectionLabel>
          }
        >
          <FormSectionContent loading={false} className="lg:!col-span-5">
            <div className="flex items-center justify-end mt-2.5 space-x-2">
              {(isLoading || isSubmitting) && (
                <Loader2 className="animate-spin" strokeWidth={1.5} size={16} />
              )}
              {isSuccess && (
                <Tooltip_Shadcn_>
                  <TooltipTrigger_Shadcn_ asChild>
                    {/* [Joshen] Added div as tooltip is messing with data state property of toggle */}
                    <div>
                      <Switch
                        size="large"
                        checked={isSensitive}
                        disabled={isLoading || isSubmitting || !canUpdateComplianceConfig}
                        onCheckedChange={toggleIsSensitive}
                      />
                    </div>
                  </TooltipTrigger_Shadcn_>
                  {!canUpdateComplianceConfig && (
                    <TooltipContent_Shadcn_ side="bottom" className="w-64 text-center">
                      You need additional permissions to update the compliance configuration for
                      your project
                    </TooltipContent_Shadcn_>
                  )}
                </Tooltip_Shadcn_>
              )}
            </div>
          </FormSectionContent>
        </FormSection>
      </FormPanel>
    </div>
  )
}

export default ComplianceConfig
