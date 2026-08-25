import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { template } from 'lodash'
import { Download, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Card, CardContent, Switch, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { SSLEnforcementConfirmDialog } from './SSLEnforcementConfirmDialog'
import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { useJitDbAccessQuery } from '@/data/jit-db-access/jit-db-access-query'
import { useSSLEnforcementQuery } from '@/data/ssl-enforcement/ssl-enforcement-query'
import { useSSLEnforcementUpdateMutation } from '@/data/ssl-enforcement/ssl-enforcement-update-mutation'
import { useCustomContent } from '@/hooks/custom-content/useCustomContent'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

export const SSLConfiguration = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })

  // High Availability projects always enforce SSL and the API rejects any
  // attempt to read or change the setting, so skip the query for them and
  // show the setting as always on.
  const { isHighAvailability, isPending: isHighAvailabilityPending } = useHighAvailability()
  const canLoadSSLEnforcement = !isHighAvailability && !isHighAvailabilityPending
  const {
    data: sslEnforcementConfiguration,
    isPending: isSSLEnforcementPending,
    isSuccess: isSSLEnforcementSuccess,
  } = useSSLEnforcementQuery({ projectRef: ref }, { enabled: canLoadSSLEnforcement })

  const isLoading = isHighAvailabilityPending || (!isHighAvailability && isSSLEnforcementPending)
  const isSuccess = isHighAvailability || isSSLEnforcementSuccess
  const { data: jitDbAccessConfiguration } = useJitDbAccessQuery({ projectRef: ref })
  const { mutateAsync: updateSSLEnforcement, isPending: isSubmitting } =
    useSSLEnforcementUpdateMutation({
      onSuccess: () => {
        toast.success('Successfully updated SSL configuration')
      },
      onError: (error) => {
        toast.error(`Failed to update SSL enforcement: ${error.message}`)
      },
    })

  const { can: canUpdateSSLEnforcement } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  // Derived directly from the query so a refetch triggered elsewhere (e.g.
  // enabling SSL enforcement from the JIT DB access unavailable banner) is
  // reflected here too, instead of relying on a mirrored local state that
  // would only resync on the initial load.
  const isEnforced =
    isHighAvailability ||
    (isSSLEnforcementSuccess &&
      sslEnforcementConfiguration.appliedSuccessfully &&
      sslEnforcementConfiguration.currentConfig.database)

  const hasAccessToSSLEnforcement = !(
    sslEnforcementConfiguration !== undefined &&
    'isNotAllowed' in sslEnforcementConfiguration &&
    sslEnforcementConfiguration.isNotAllowed
  )

  // Temporary access requires SSL enforcement to be enabled, so SSL enforcement
  // can't be turned off again while temporary access is still enabled.
  const isTemporaryAccessEnabled =
    jitDbAccessConfiguration?.state === 'enabled' && jitDbAccessConfiguration.appliedSuccessfully

  const isSwitchDisabled =
    isLoading ||
    isSubmitting ||
    isHighAvailability ||
    !canUpdateSSLEnforcement ||
    !hasAccessToSSLEnforcement ||
    isTemporaryAccessEnabled

  let switchTooltipMessage: string | undefined
  if (isHighAvailability) {
    switchTooltipMessage = 'SSL is always enforced on High Availability projects'
  } else if (!canUpdateSSLEnforcement) {
    switchTooltipMessage =
      'You need additional permissions to update SSL enforcement for your project'
  } else if (!hasAccessToSSLEnforcement) {
    switchTooltipMessage = 'Your project does not have access to SSL enforcement'
  } else if (isTemporaryAccessEnabled) {
    switchTooltipMessage =
      'Temporary access must first be disabled before SSL enforcement can be disabled'
  }

  const env = process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod' ? 'prod' : 'staging'
  const hasSSLCertificate =
    settings?.inserted_at !== undefined && new Date(settings.inserted_at) >= new Date('2021-04-30')

  const { sslCertificateUrl: sslCertificateUrlTemplate } = useCustomContent(['ssl:certificate_url'])
  const sslCertificateUrl = useMemo(
    () => template(sslCertificateUrlTemplate ?? '')({ env }),
    [sslCertificateUrlTemplate, env]
  )

  const toggleSSLEnforcement = async () => {
    if (!ref) return console.error('Project ref is required')
    await updateSSLEnforcement({ projectRef: ref, requestedConfig: { database: !isEnforced } })
  }

  return (
    <PageSection id="ssl-configuration">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>SSL configuration</PageSectionTitle>
        </PageSectionSummary>
        <DocsButton href={`${DOCS_URL}/guides/platform/ssl-enforcement`} />
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent className="space-y-4">
            <FormLayout
              layout="flex-row-reverse"
              label="Enforce SSL on incoming connections"
              description="Reject non-SSL connections to your database"
            >
              <div className="flex items-center justify-end mt-2.5 space-x-2">
                {(isLoading || isSubmitting) && (
                  <Loader2
                    className="animate-spin motion-reduce:animate-none"
                    strokeWidth={1.5}
                    size={16}
                  />
                )}
                {isSuccess && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* [Joshen] Added div as tooltip is messing with data state property of toggle */}
                      {/* A disabled switch can't take focus, so the wrapper becomes the focus
                          target to keep the tooltip reachable by keyboard */}
                      <div tabIndex={isSwitchDisabled ? 0 : undefined}>
                        {/* The dialog is opened from the switch itself rather than a wrapping
                            trigger, so a disabled switch can never open it. */}
                        <Switch
                          size="large"
                          checked={isEnforced}
                          disabled={isSwitchDisabled}
                          onCheckedChange={() => setIsConfirmDialogOpen(true)}
                        />
                      </div>
                    </TooltipTrigger>
                    {switchTooltipMessage && (
                      <TooltipContent side="bottom" className="w-64 text-center">
                        {switchTooltipMessage}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
              </div>
              <SSLEnforcementConfirmDialog
                open={isConfirmDialogOpen}
                onOpenChange={setIsConfirmDialogOpen}
                isTargetEnforced={!isEnforced}
                isSubmitting={isSubmitting}
                onConfirm={toggleSSLEnforcement}
              />
            </FormLayout>
            {isSSLEnforcementSuccess && !sslEnforcementConfiguration.appliedSuccessfully && (
              <Admonition
                type="warning"
                layout="horizontal"
                title="SSL enforcement was not updated successfully"
                description={
                  <>
                    Please try updating again, or contact{' '}
                    <SupportLink className={InlineLinkClassName}>support</SupportLink> if this error
                    persists
                  </>
                }
              />
            )}
          </CardContent>
          <CardContent>
            <FormLayout
              layout="flex-row-reverse"
              label="SSL Certificate"
              description="Use this certificate when connecting to your database to prevent snooping and man-in-the-middle attacks."
            >
              <div className="flex items-end justify-end">
                {!hasSSLCertificate ? (
                  <ButtonTooltip
                    disabled
                    variant="default"
                    icon={<Download />}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: 'Projects before 15:08 (GMT+08), 29th April 2021 do not have SSL certificates installed',
                      },
                    }}
                  >
                    Download certificate
                  </ButtonTooltip>
                ) : (
                  <Button variant="default" icon={<Download />}>
                    <a href={sslCertificateUrl}>Download certificate</a>
                  </Button>
                )}
              </div>
            </FormLayout>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
