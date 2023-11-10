import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Alert, Button, IconDownload, IconExternalLink, IconLoader, Toggle } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useSSLEnforcementQuery } from 'data/ssl-enforcement/ssl-enforcement-query'
import { useSSLEnforcementUpdateMutation } from 'data/ssl-enforcement/ssl-enforcement-update-mutation'
import { useCheckPermissions, useStore } from 'hooks'

const SSLConfiguration = () => {
  const { ui } = useStore()
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
        ui.setNotification({
          category: 'success',
          message: 'Successfully updated SSL configuration',
        })
      },
      onError: (error) => {
        setIsEnforced(initialIsEnforced)
        ui.setNotification({
          error,
          category: 'error',
          message: `Failed to update SSL enforcement: ${error.message}`,
        })
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
          <Button asChild type="default" icon={<IconExternalLink />}>
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
                <IconLoader className="animate-spin" strokeWidth={1.5} size={16} />
              )}
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <Toggle
                    checked={isEnforced}
                    disabled={
                      isLoading ||
                      isSubmitting ||
                      !canUpdateSSLEnforcement ||
                      !hasAccessToSSLEnforcement
                    }
                    onChange={toggleSSLEnforcement}
                  />
                </Tooltip.Trigger>
                {(!canUpdateSSLEnforcement || !hasAccessToSSLEnforcement) && (
                  <Tooltip.Portal>
                    <Tooltip.Content align="center" side="bottom">
                      <Tooltip.Arrow className="radix-tooltip-arrow" />
                      <div
                        className={[
                          'rounded bg-alternative py-1 px-2 leading-none shadow',
                          'border border-background w-[250px]',
                        ].join(' ')}
                      >
                        <span className="text-xs text-foreground text-center flex items-center justify-center">
                          {!canUpdateSSLEnforcement
                            ? 'You need additional permissions to update SSL enforcement for your project'
                            : !hasAccessToSSLEnforcement
                            ? 'Your project does not have access to SSL enforcement'
                            : ''}
                        </span>
                      </div>
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
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
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger>
                <Button type="default" disabled={!hasSSLCertificate} icon={<IconDownload />}>
                  <a
                    href={`https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/${env}/ssl/${env}-ca-2021.crt`}
                  >
                    Download Certificate
                  </a>
                </Button>
              </Tooltip.Trigger>
              {!hasSSLCertificate && (
                <Tooltip.Portal>
                  <Tooltip.Content align="center" side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow',
                        'border border-background w-[250px]',
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        Projects before 15:08 (GMT+08), 29th April 2021 do not have SSL certificates
                        installed
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        </div>
      </FormPanel>
    </div>
  )
}

export default SSLConfiguration
