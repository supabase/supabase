import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams, useStore } from 'hooks'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button, IconDownload, Toggle, IconExternalLink, IconLoader, Alert } from 'ui'
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

const SSLConfiguration = () => {
  const { ui } = useStore()
  const { ref } = useParams()
  const [isEnforced, setIsEnforced] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: projectSettings } = useProjectSettingsQuery({ projectRef: ref })
  const { data: sslEnforcementConfiguration, isLoading } = useSSLEnforcementQuery({
    projectRef: ref,
  })
  const { mutateAsync: updateSSLEnforcement } = useSSLEnforcementUpdateMutation()

  const hasAccessToSSLEnforcement = !sslEnforcementConfiguration?.isNotAllowed
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod' ? 'prod' : 'staging'
  const hasSSLCertificate =
    projectSettings?.project !== undefined &&
    new Date(projectSettings.project.inserted_at) >= new Date('2021-04-30')

  useEffect(() => {
    if (!isLoading && sslEnforcementConfiguration) {
      setIsEnforced(
        sslEnforcementConfiguration.appliedSuccessfully &&
          sslEnforcementConfiguration.currentConfig.database
      )
    }
  }, [isLoading])

  const toggleSSLEnforcement = async () => {
    if (!ref) return console.error('Project ref is required')

    setIsEnforced(!isEnforced)
    setIsSubmitting(true)

    try {
      await updateSSLEnforcement({
        projectRef: ref,
        requestedConfig: { database: !isEnforced },
      })
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update SSL enforcement: ${error.message}`,
      })
      setIsEnforced(isEnforced)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasAccessToSSLEnforcement) return <></>

  return (
    <div>
      <div className="flex items-center justify-between">
        <FormHeader title="SSL Configuration" description="" />
        <div className="flex items-center space-x-2 mb-6">
          <Link href="https://supabase.com/docs/guides/platform/ssl-enforcement">
            <a target="_blank">
              <Button type="default" icon={<IconExternalLink />}>
                Documentation
              </Button>
            </a>
          </Link>
        </div>
      </div>
      <FormPanel>
        <FormSection
          header={
            <FormSectionLabel
              className="lg:col-span-7"
              description={
                <div className="space-y-4">
                  <p className="text-sm text-scale-1000">
                    Reject non-SSL connections to your database
                  </p>
                  {!sslEnforcementConfiguration?.appliedSuccessfully && (
                    <Alert
                      withIcon
                      variant="warning"
                      title="SSL enforcement was not updated successfully"
                    >
                      Please try updating again, or contact{' '}
                      <Link href="/support/new">
                        <a target="_blank" className="underline">
                          support
                        </a>
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
              <Toggle
                checked={isEnforced}
                disabled={isLoading || isSubmitting}
                onChange={toggleSSLEnforcement}
              />
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
                <Tooltip.Content align="center" side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                      'border border-scale-200 w-[250px]',
                    ].join(' ')}
                  >
                    <span className="text-xs text-scale-1200">
                      Projects before 15:08 (GMT+08), 29th April 2021 do not have SSL certificates
                      installed
                    </span>
                  </div>
                </Tooltip.Content>
              )}
            </Tooltip.Root>
          </div>
        </div>
      </FormPanel>
    </div>
  )
}

export default SSLConfiguration
