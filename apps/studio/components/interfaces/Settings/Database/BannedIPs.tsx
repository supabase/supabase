import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Globe } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBannedIPsDeleteMutation } from 'data/banned-ips/banned-ips-delete-mutations'
import { useBannedIPsQuery } from 'data/banned-ips/banned-ips-query'
import { useUserIPAddressQuery } from 'data/misc/user-ip-address-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionDescription,
} from 'components/layouts/Scaffold'
import { Badge, Card, CardContent } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export const BannedIPs = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [selectedIPToUnban, setSelectedIPToUnban] = useState<string | null>(null) // Track the selected IP for unban

  const {
    isLoading: isLoadingIPList,
    isFetching: isFetchingIPList,
    data: ipList,
    error: ipListError,
  } = useBannedIPsQuery({
    projectRef: ref,
  })

  const { data: userIPAddress } = useUserIPAddressQuery()

  const ipListLoading = isLoadingIPList || isFetchingIPList

  const [showUnban, setShowUnban] = useState(false)
  const [confirmingIP, setConfirmingIP] = useState<string | null>(null) // Track the IP being confirmed for unban

  const { can: canUnbanNetworks } = useAsyncCheckProjectPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const { mutate: unbanIPs, isLoading: isUnbanning } = useBannedIPsDeleteMutation({
    onSuccess: () => {
      toast.success('IP address successfully unbanned')
      setSelectedIPToUnban(null) // Reset the selected IP for unban
      setShowUnban(false)
    },
    onError: (error) => {
      toast.error(`Failed to unban IP: ${error?.message}`)
    },
  })

  const onConfirmUnbanIP = () => {
    if (confirmingIP == null || !ref) return
    unbanIPs({
      projectRef: ref,
      ips: [confirmingIP], // Pass the IP as an array
    })
  }

  const openConfirmationModal = (ip: string) => {
    setSelectedIPToUnban(ip) // Set the selected IP for unban
    setConfirmingIP(ip) // Set the IP being confirmed for unban
    setShowUnban(true)
  }

  return (
    <ScaffoldSection id="banned-ips" className="gap-6">
      <ScaffoldSectionTitle className="flex items-center justify-between  gap-2">
        <div className="flex flex-col gap-1">
          Network Bans
          <ScaffoldSectionDescription>
            List of IP addresses that are temporarily blocked if their traffic pattern looks
            abusive.
          </ScaffoldSectionDescription>
        </div>
        <DocsButton href="https://supabase.com/docs/reference/cli/supabase-network-bans" />
      </ScaffoldSectionTitle>

      {ipListLoading ? (
        <Card>
          <CardContent>
            <GenericSkeletonLoader />
          </CardContent>
        </Card>
      ) : ipListError ? (
        <AlertError
          className="border-0 rounded-none"
          error={ipListError}
          subject="Failed to retrieve banned IP addresses"
        />
      ) : ipList && ipList.banned_ipv4_addresses.length > 0 ? (
        <Card>
          {ipList.banned_ipv4_addresses.map((ip) => (
            <CardContent className="flex items-center justify-between gap-4">
              <Globe size={16} className="text-foreground-light" />
              <div className="w-full flex items-center gap-4">
                {ip === userIPAddress && <Badge variant="warning">Your IP address</Badge>}
                <p className="text-sm font-mono">{ip}</p>
              </div>
              <ButtonTooltip
                type="default"
                disabled={!canUnbanNetworks}
                onClick={() => openConfirmationModal(ip)}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canUnbanNetworks
                      ? 'You need additional permissions to unban networks'
                      : undefined,
                  },
                }}
              >
                Unban IP
              </ButtonTooltip>
            </CardContent>
          ))}
        </Card>
      ) : (
        <Card>
          <CardContent className="text-sm text-foreground-light">
            There are no banned IP addresses for your project.
          </CardContent>
        </Card>
      )}

      <ConfirmationModal
        variant="destructive"
        size="medium"
        loading={isUnbanning}
        visible={showUnban}
        title="Confirm Unban IP"
        confirmLabel="Confirm Unban"
        confirmLabelLoading="Unbanning..."
        onCancel={() => setShowUnban(false)}
        onConfirm={onConfirmUnbanIP}
        alert={{
          title: 'This action cannot be undone',
          description: `Are you sure you want to unban this IP address ${selectedIPToUnban}?`,
        }}
      />
    </ScaffoldSection>
  )
}
