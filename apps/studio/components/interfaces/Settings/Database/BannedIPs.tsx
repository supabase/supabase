import Link from 'next/link'
import { useState } from 'react'
import { useParams } from 'common/hooks'
import { useStore } from 'hooks'
import { FormHeader, FormPanel } from 'components/ui/Forms'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertTriangle,
  IconExternalLink,
  IconGlobe,
  Modal,
} from 'ui'
import ConfirmationModal from 'components/ui/ConfirmationModal'

import { useBannedIPsQuery } from 'data/banned-ips/banned-ips-query'
import { useBannedIPsDeleteMutation } from 'data/banned-ips/banned-ips-delete-mutations'

const BannedIPs = () => {
  const { ref } = useParams()
  const [selectedIPToUnban, setSelectedIPToUnban] = useState<string | null>(null) // Track the selected IP for unban
  const { data: ipList } = useBannedIPsQuery({
    projectRef: ref,
  })

  const { ui } = useStore()
  const [showUnban, setShowUnban] = useState(false)
  const [confirmingIP, setConfirmingIP] = useState<string | null>(null) // Track the IP being confirmed for unban

  const { mutate: unbanIPs, isLoading: isUnbanning } = useBannedIPsDeleteMutation({
    onSuccess: () => {
      ui.setNotification({
        category: 'success',
        message: 'IP address successfully unbanned',
      })
      setSelectedIPToUnban(null) // Reset the selected IP for unban
      setShowUnban(false)
    },
    onError: (error) => {
      ui.setNotification({
        category: 'error',
        message: `Failed to unban IP: ${error?.message}`,
      })
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
    <div id="banned-ips">
      <div className="flex items-center justify-between">
        <FormHeader
          title="Network Bans"
          description="List of IP addresses that are temporarily blocked if their traffic pattern looks abusive"
        />
        <div className="flex items-center space-x-2 mb-6">
          <Button asChild type="default" icon={<IconExternalLink />}>
            <Link
              href="https://supabase.com/docs/reference/cli/supabase-network-bans"
              target="_blank"
            >
              Documentation
            </Link>
          </Button>
        </div>
      </div>
      <FormPanel>
        {ipList && ipList.banned_ipv4_addresses.length > 0 ? (
          ipList.banned_ipv4_addresses.map((ip) => (
            <div key={ip} className="px-8 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-5">
                <IconGlobe size={16} className="text-foreground-lighter" />
                <p className="text-sm font-mono">{ip}</p>
              </div>
              <div>
                <Button type="default" onClick={() => openConfirmationModal(ip)}>
                  Unban IP
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-foreground-light text-sm px-8 py-4">
            There are no banned IP addresses for your project.
          </p>
        )}
      </FormPanel>

      <ConfirmationModal
        danger
        size="medium"
        loading={isUnbanning}
        visible={showUnban}
        header="Confirm Unban IP"
        buttonLabel="Confirm Unban"
        buttonLoadingLabel="Unbanning..."
        onSelectConfirm={onConfirmUnbanIP}
        onSelectCancel={() => setShowUnban(false)}
      >
        <Modal.Content>
          <div className="py-6">
            <Alert_Shadcn_ variant="warning">
              <IconAlertTriangle strokeWidth={2} />
              <AlertTitle_Shadcn_>This action cannot be undone</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Are you sure you want to unban this IP address {selectedIPToUnban}?
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          </div>
        </Modal.Content>
      </ConfirmationModal>
    </div>
  )
}

export default BannedIPs
