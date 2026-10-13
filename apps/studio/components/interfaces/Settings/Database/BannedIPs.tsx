import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Globe } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge, Card, CardContent, Skeleton } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { HighAvailabilityDisabledSectionNotice } from '@/components/ui/HighAvailability/HighAvailabilityDisabledSectionNotice'
import { useBannedIPsDeleteMutation } from '@/data/banned-ips/banned-ips-delete-mutations'
import { useBannedIPsQuery } from '@/data/banned-ips/banned-ips-query'
import { useUserIPAddressQuery } from '@/data/misc/user-ip-address-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useIsAwsK8sCloudProvider, useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

const HA_DISABLED_TITLE = 'Network bans unavailable on High Availability projects'
const HA_DISABLED_DESCRIPTION =
  "We're working to bring network bans to High Availability projects. Contact support if this is blocking your work."
const V3_DISABLED_TITLE = 'Network bans unavailable on v3 projects'

export const BannedIPs = () => {
  const { ref } = useParams()
  const { data: project, error: projectError } = useSelectedProjectQuery()
  const { isHighAvailability } = useHighAvailability()
  const isAwsK8s = useIsAwsK8sCloudProvider()

  const [selectedIPToUnban, setSelectedIPToUnban] = useState<string | null>(null)

  const {
    isPending: isLoadingIPList,
    isFetching: isFetchingIPList,
    data: ipList,
    error: ipListError,
  } = useBannedIPsQuery({ projectRef: ref })

  const { data: userIPAddress } = useUserIPAddressQuery()

  const hasProjectError = !project && !!projectError
  const ipListLoading = isLoadingIPList || isFetchingIPList

  const { can: canUnbanNetworks } = useAsyncCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const isSectionDisabled = isHighAvailability || isAwsK8s || !canUnbanNetworks

  if (isSectionDisabled && selectedIPToUnban !== null) {
    setSelectedIPToUnban(null)
  }

  const sectionDisabledReason = useMemo(() => {
    if (isHighAvailability) return HA_DISABLED_TITLE
    if (isAwsK8s) return V3_DISABLED_TITLE
    return 'You need additional permissions to unban networks'
  }, [isHighAvailability, isAwsK8s])

  const { mutate: unbanIPs, isPending: isUnbanning } = useBannedIPsDeleteMutation({
    onSuccess: () => {
      toast.success('IP address successfully unbanned')
      setSelectedIPToUnban(null)
    },
    onError: (error) => {
      toast.error(`Failed to unban IP: ${error?.message}`)
    },
  })

  const onConfirmUnbanIP = () => {
    if (selectedIPToUnban === null || !ref || isSectionDisabled) return
    unbanIPs({
      projectRef: ref,
      ips: [selectedIPToUnban], // Pass the IP as an array
    })
  }

  return (
    <>
      <PageSection id="banned-ips">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Network bans</PageSectionTitle>
            <PageSectionDescription>
              IP addresses temporarily blocked due to suspicious traffic
            </PageSectionDescription>
          </PageSectionSummary>
          <DocsButton href={`${DOCS_URL}/reference/cli/supabase-network-bans`} />
        </PageSectionMeta>
        <PageSectionContent>
          {hasProjectError && (
            <AlertError
              error={projectError}
              subject="Failed to retrieve project details"
              projectRef={ref}
            />
          )}
          {isHighAvailability && (
            <div className="mb-4">
              <HighAvailabilityDisabledSectionNotice
                title={HA_DISABLED_TITLE}
                description={HA_DISABLED_DESCRIPTION}
              />
            </div>
          )}
          {!isHighAvailability && isAwsK8s && (
            <Admonition
              type="default"
              title={V3_DISABLED_TITLE}
              description="Fail2Ban is not supported on v3 projects."
            />
          )}
          {!hasProjectError && !isHighAvailability && !isAwsK8s && (
            <>
              {ipListError && (
                <AlertError
                  error={ipListError}
                  subject="Failed to retrieve banned IP addresses"
                  projectRef={ref}
                />
              )}
              {!ipListError && ipListLoading && (
                <Card>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              )}
              {!ipListError && !ipListLoading && ipList && (
                <Card>
                  {ipList.banned_ipv4_addresses.length > 0 ? (
                    ipList.banned_ipv4_addresses.map((ip) => (
                      <CardContent key={ip} className="flex items-center justify-between">
                        <div className="flex items-center space-x-5">
                          <Globe size={16} className="text-foreground-lighter" />
                          <p className="text-sm font-mono">{ip}</p>
                          {ip === userIPAddress && <Badge>Your IP address</Badge>}
                        </div>
                        <ButtonTooltip
                          disabled={isSectionDisabled}
                          onClick={() => setSelectedIPToUnban(ip)}
                          tooltip={{
                            content: {
                              side: 'bottom',
                              text: isSectionDisabled ? sectionDisabledReason : undefined,
                            },
                          }}
                        >
                          Unban IP
                        </ButtonTooltip>
                      </CardContent>
                    ))
                  ) : (
                    <CardContent className="text-foreground text-sm">
                      There are no banned IP addresses for your project
                    </CardContent>
                  )}
                </Card>
              )}
            </>
          )}
        </PageSectionContent>
      </PageSection>

      <ConfirmationModal
        variant="destructive"
        size="medium"
        loading={isUnbanning}
        visible={selectedIPToUnban !== null && !isSectionDisabled}
        title="Confirm Unban IP"
        confirmLabel="Confirm Unban"
        confirmLabelLoading="Unbanning..."
        onCancel={() => setSelectedIPToUnban(null)}
        onConfirm={onConfirmUnbanIP}
        alert={{
          title: 'This action cannot be undone',
          description: `Are you sure you want to unban this IP address ${selectedIPToUnban}?`,
        }}
      />
    </>
  )
}
