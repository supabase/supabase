import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useSSLEnforcementQuery } from 'data/ssl-enforcement/ssl-enforcement-query'
import { useSSLEnforcementUpdateMutation } from 'data/ssl-enforcement/ssl-enforcement-update-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { ScaffoldSection, ScaffoldSectionTitle } from 'components/layouts/Scaffold'
import { Card, CardHeader, CardContent, Switch, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Admonition } from 'ui-patterns/admonition'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

export const SSLConfiguration = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [isEnforced, setIsEnforced] = useState(false)

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })
  const {
    data: sslEnforcementConfiguration,
    isLoading,
    isSuccess,
  } = useSSLEnforcementQuery({
    projectRef: ref,
  })
  const { mutate: updateSSLEnforcement, isLoading: isSubmitting } = useSSLEnforcementUpdateMutation(
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

  const { can: canUpdateSSLEnforcement } = useAsyncCheckProjectPermissions(
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
    <ScaffoldSection id="ssl-configuration" className="gap-6">
      <ScaffoldSectionTitle className="flex items-center justify-between">
        SSL
        <DocsButton href="https://supabase.com/docs/guides/platform/ssl-enforcement" />
      </ScaffoldSectionTitle>

      <Card>
        <CardHeader>SSL Configuration</CardHeader>

        <CardContent id="pause-project" className="flex flex-col gap-4">
          <FormLayout
            layout="flex-row-reverse"
            label="Enforce SSL on incoming connections"
            description="Reject non-SSL connections to your database"
          >
            {isLoading || isSubmitting ? (
              <div className="w-11 flex justify-center">
                <Loader2 className="animate-spin" strokeWidth={1.5} size={16} />
              </div>
            ) : (
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
                        !isSuccess ||
                        !canUpdateSSLEnforcement ||
                        !hasAccessToSSLEnforcement
                      }
                      onCheckedChange={toggleSSLEnforcement}
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
          </FormLayout>
          {isSuccess && !sslEnforcementConfiguration?.appliedSuccessfully && (
            <Admonition
              type="warning"
              title="SSL enforcement was not updated successfully"
              description={
                <>
                  Please try updating again, or contact{' '}
                  <Link href="/support/new" target="_blank" rel="noreferrer" className="underline">
                    support
                  </Link>{' '}
                  if this error persists
                </>
              }
            />
          )}
        </CardContent>

        <CardContent className="flex justify-between items-center">
          <FormLayout
            layout="flex-row-reverse"
            label="SSL Certificate"
            description="Use this certificate when connecting to your database to prevent snooping and man-in-the-middle attacks."
          >
            <ButtonTooltip
              type="default"
              icon={<Download />}
              disabled={!hasSSLCertificate}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !hasSSLCertificate
                    ? 'Projects before 15:08 (GMT+08), 29th April 2021 do not have SSL certificates installed'
                    : undefined,
                },
              }}
            >
              {hasSSLCertificate ? (
                <a
                  href={`https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/${env}/ssl/${env}-ca-2021.crt`}
                >
                  Download certificate
                </a>
              ) : (
                `Download certificate`
              )}
            </ButtonTooltip>
          </FormLayout>
        </CardContent>
      </Card>
    </ScaffoldSection>
  )
}
