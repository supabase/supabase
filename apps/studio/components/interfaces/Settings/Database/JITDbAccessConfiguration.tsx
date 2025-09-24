import { PermissionAction } from '@supabase/shared-types/out/constants'
import { template } from 'lodash'
import { Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useJitDbAccessQuery } from 'data/jit-db-access/jit-db-access-query'
import { useJitDbAccessUpdateMutation } from 'data/jit-db-access/jit-db-access-update-mutation'
import { useCustomContent } from 'hooks/custom-content/useCustomContent'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Alert, Button, Switch, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

const JitDbAccessConfiguration = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [isEnabled, setIsEnabled] = useState(false)

  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })
  const {
    data: jitDbAccessConfiguration,
    isLoading,
    isSuccess,
  } = useJitDbAccessQuery({
    projectRef: ref,
  })
  const { mutate: updateJitDbAccess, isLoading: isSubmitting } = useJitDbAccessUpdateMutation({
    onSuccess: () => {
      toast.success('Successfully updated just-in-time (JIT) database access configuration')
    },
    onError: (error) => {
      setIsEnabled(initialIsEnabled)
      toast.error(
        `Failed to update just-in-time (JIT) database access enforcement: ${error.message}`
      )
    },
  })

  const { can: canUpdateJitDbAccess } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )
  const initialIsEnabled = isSuccess
    ? jitDbAccessConfiguration.appliedSuccessfully && jitDbAccessConfiguration.state == 'enabled'
    : false

  const hasAccessToJitDbAccess = !(
    jitDbAccessConfiguration !== undefined &&
    'isUnavailable' in jitDbAccessConfiguration &&
    jitDbAccessConfiguration.isUnavailable
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
    if (!isLoading && jitDbAccessConfiguration) {
      setIsEnabled(initialIsEnabled)
    }
  }, [isLoading])

  const toggleJitDbAccess = async () => {
    if (!ref) return console.error('Project ref is required')
    setIsEnabled(!isEnabled)
    updateJitDbAccess({
      projectRef: ref,
      requestedConfig: { state: !isEnabled ? 'enabled' : 'disabled' },
    })
  }

  return (
    <div id="jit-db-access-configuration">
      <div className="flex items-center justify-between mb-6">
        <FormHeader
          className="mb-0"
          title="Just-in-time (JIT) database access Configuration"
          description=""
        />
        <DocsButton href="https://supabase.com/docs/guides/platform/just-in-time-database-access" />
      </div>
      <FormPanel>
        <FormSection
          header={
            <FormSectionLabel
              className="lg:col-span-7"
              description={
                <div className="space-y-4">
                  <p className="text-sm text-foreground-light">
                    Allow Just-in-time (JIT) authenticated connections to your database
                  </p>
                  {isSuccess && !jitDbAccessConfiguration?.appliedSuccessfully && (
                    <Alert
                      withIcon
                      variant="warning"
                      title="JIT access was not updated successfully"
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
              Enabled Just-in-time (JIT) database authentication
            </FormSectionLabel>
          }
        >
          <FormSectionContent loading={false} className="lg:!col-span-5">
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
                        checked={isEnabled}
                        disabled={
                          isLoading ||
                          isSubmitting ||
                          !canUpdateJitDbAccess ||
                          !hasAccessToJitDbAccess
                        }
                        onCheckedChange={toggleJitDbAccess}
                      />
                    </div>
                  </TooltipTrigger>
                  {(!canUpdateJitDbAccess || !hasAccessToJitDbAccess) && (
                    <TooltipContent side="bottom" className="w-64 text-center">
                      {!canUpdateJitDbAccess
                        ? 'You need additional permissions to update SSL enforcement for your project'
                        : !hasAccessToJitDbAccess
                          ? 'Your project does not have access to Just-in-time database access. Please update to the latest Postgres version'
                          : undefined}
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </div>
          </FormSectionContent>
        </FormSection>
        {isSuccess && jitDbAccessConfiguration?.state === 'enabled' && (
          <div className="grid grid-cols-1 items-center lg:grid-cols-2 p-8">
            <div className="space-y-2">
              <p className="block text-sm">Users with JIT access</p>
              <div style={{ maxWidth: '420px' }}>
                <p className="text-sm opacity-50">
                  Configure the users that have access JIT access and the roles they can assume
                </p>
              </div>
            </div>
            <div className="flex items-end justify-end"></div>
          </div>
        )}
      </FormPanel>
    </div>
  )
}

export default JitDbAccessConfiguration
