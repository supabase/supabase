import { PermissionAction } from '@supabase/shared-types/out/constants'
import { template } from 'lodash'
import { Download, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { InlineLinkClassName } from 'components/ui/InlineLink'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useSSLEnforcementQuery } from 'data/ssl-enforcement/ssl-enforcement-query'
import { useSSLEnforcementUpdateMutation } from 'data/ssl-enforcement/ssl-enforcement-update-mutation'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import {
  Alert,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

const SSLConfiguration = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [isEnforced, setIsEnforced] = useState(false)

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })
  const {
    data: sslEnforcementConfiguration,
    isPending: isLoading,
    isSuccess,
  } = useSSLEnforcementQuery({
    projectRef: ref,
  })
  const { mutate: updateSSLEnforcement, isPending: isSubmitting } = useSSLEnforcementUpdateMutation(
    {
      onSuccess: () => {
        toast.success('Successfully updated SSL configuration')
      },
      onError: (error) => {
        setIsEnforced(initialIsEnforced)
        toast.error(`Failed to update SSL enforcement: ${error.message}`)
      },
    }
  )

  const { can: canUpdateSSLEnforcement } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )
  const initialIsEnforced = isSuccess
    ? sslEnforcementConfiguration.appliedSuccessfully &&
      sslEnforcementConfiguration.currentConfig.database
    : false

  const hasAccessToSSLEnforcement = !(
    sslEnforcementConfiguration !== undefined &&
    'isNotAllowed' in sslEnforcementConfiguration &&
    sslEnforcementConfiguration.isNotAllowed
  )
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod' ? 'prod' : 'staging'
  const hasSSLCertificate =
    settings?.inserted_at !== undefined && new Date(settings.inserted_at) >= new Date('2021-04-30')

  const { sslCertificateUrl: sslCertificateUrlTemplate } = useCustomContent(['ssl:certificate_url'])
  const sslCertificateUrl = useMemo(
    () => template(sslCertificateUrlTemplate ?? '')({ env }),
    [sslCertificateUrlTemplate, env]
  )

  useEffect(() => {
    if (!isLoading && sslEnforcementConfiguration) {
      setIsEnforced(initialIsEnforced)
    }
  }, [isLoading])

  const toggleSSLEnforcement = async () => {
    if (!ref) return console.error('Project ref is required')
    setIsEnforced(!isEnforced)
    updateSSLEnforcement({ projectRef: ref, requestedConfig: { database: !isEnforced } })
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div className="flex items-center justify-end mt-2.5 space-x-2">
                    {(isLoading || isSubmitting) && (
                      <Loader2 className="animate-spin" strokeWidth={1.5} size={16} />
                    )}
                    {isSuccess && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {/* [Joshen] Added div as tooltip is messing with data state property of toggle */}
                          <div>
                            <Switch
                              size="large"
                              checked={isEnforced}
                              disabled={
                                isLoading ||
                                isSubmitting ||
                                !canUpdateSSLEnforcement ||
                                !hasAccessToSSLEnforcement
                              }
                            />
                          </div>
                        </TooltipTrigger>
                        {(!canUpdateSSLEnforcement || !hasAccessToSSLEnforcement) && (
                          <TooltipContent side="bottom" className="w-64 text-center">
                            {!canUpdateSSLEnforcement
                              ? 'You need additional permissions to update SSL enforcement for your project'
                              : !hasAccessToSSLEnforcement
                                ? 'Your project does not have access to SSL enforcement'
                                : undefined}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    )}
                  </div>
                </AlertDialogTrigger>
                <AlertDialogContent size="medium">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Updating SSL enforcement involves a brief downtime
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      A database restart is required for SSL enforcement changes to take place, and
                      this involves a few minutes of downtime. Confirm to proceed now?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="warning"
                      disabled={isSubmitting}
                      onClick={toggleSSLEnforcement}
                    >
                      {!isEnforced ? 'Enable SSL' : 'Disable SSL'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </FormLayout>
            {isSuccess && !sslEnforcementConfiguration?.appliedSuccessfully && (
              <Alert
                withIcon
                variant="warning"
                title="SSL enforcement was not updated successfully"
              >
                Please try updating again, or contact{' '}
                <SupportLink className={InlineLinkClassName}>support</SupportLink> if this error
                persists
              </Alert>
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
                    type="default"
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
                  <Button type="default" icon={<Download />}>
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

export default SSLConfiguration
