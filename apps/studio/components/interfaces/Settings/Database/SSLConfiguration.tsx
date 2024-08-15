import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Download, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useSSLEnforcementQuery } from 'data/ssl-enforcement/ssl-enforcement-query'
import { useSSLEnforcementUpdateMutation } from 'data/ssl-enforcement/ssl-enforcement-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Alert,
  Button,
  Switch,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

const SSLConfiguration = () => {
  const { ref } = useParams()
  const [isEnforced, setIsEnforced] = useState(false)

  const { data: projectSettings } = useProjectSettingsQuery({ projectRef: ref })
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

  const { project } = useProjectContext()
  const canUpdateSSLEnforcement = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })
  const initialIsEnforced = isSuccess
    ? sslEnforcementConfiguration.appliedSuccessfully &&
      sslEnforcementConfiguration.currentConfig.database
    : false

  const hasAccessToSSLEnforcement = !sslEnforcementConfiguration?.isNotAllowed
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod' ? 'prod' : 'staging'
  const hasSSLCertificate =
    projectSettings?.project !== undefined &&
    new Date(projectSettings.project.inserted_at) >= new Date('2021-04-30')

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
    <div id="ssl-configuration">
      <div className="flex items-center justify-between">
        <FormHeader title="SSL Configuration" description="" />
        <div className="flex items-center space-x-2 mb-6">
          <Button asChild type="default" icon={<ExternalLink />}>
            <Link href="https://supabase.com/docs/guides/platform/ssl-enforcement" target="_blank">
              Documentation
            </Link>
          </Button>
        </div>
      </div>
      <FormPanel>
        <FormSection
          header={
            <FormSectionLabel
              className="lg:col-span-7"
              description={
                <div className="space-y-4">
                  <p className="text-sm text-foreground-light">
                    Reject non-SSL connections to your database
                  </p>
                  {isSuccess && !sslEnforcementConfiguration?.appliedSuccessfully && (
                    <Alert
                      withIcon
                      variant="warning"
                      title="SSL enforcement was not updated successfully"
                    >
                      Please try updating again, or contact{' '}
                      <Link
                        href="/support/new"
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        support
                      </Link>{' '}
                      if this error persists
                    </Alert>
                  )}
                </div>
              }
            >
              Enforce SSL on incoming connections
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
                    <Switch
                      size="large"
                      checked={isEnforced}
                      disabled={
                        isLoading ||
                        isSubmitting ||
                        !canUpdateSSLEnforcement ||
                        !hasAccessToSSLEnforcement
                      }
                      onCheckedChange={toggleSSLEnforcement}
                    />
                  </TooltipTrigger_Shadcn_>
                  {(!canUpdateSSLEnforcement || !hasAccessToSSLEnforcement) && (
                    <TooltipContent_Shadcn_ side="bottom" className="w-64 text-center">
                      {!canUpdateSSLEnforcement
                        ? 'You need additional permissions to update SSL enforcement for your project'
                        : !hasAccessToSSLEnforcement
                          ? 'Your project does not have access to SSL enforcement'
                          : ''}
                    </TooltipContent_Shadcn_>
                  )}
                </Tooltip_Shadcn_>
              )}
            </div>
          </FormSectionContent>
        </FormSection>

        <div className="grid grid-cols-1 items-center lg:grid-cols-2 p-8">
          <div className="space-y-2">
            <p className="block text-sm">SSL Certificate</p>
            <div style={{ maxWidth: '420px' }}>
              <p className="text-sm opacity-50">
                Use this certificate when connecting to your database to prevent snooping and
                man-in-the-middle attacks.
              </p>
            </div>
          </div>
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
                <a
                  href={`https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/${env}/ssl/${env}-ca-2021.crt`}
                >
                  Download certificate
                </a>
              </Button>
            )}
          </div>
        </div>
      </FormPanel>
    </div>
  )
}

export default SSLConfiguration
