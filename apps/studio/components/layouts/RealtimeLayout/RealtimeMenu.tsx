import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { useCheckPermissions } from 'hooks'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button, Menu } from 'ui'
import { CreateChannelModal } from './CreateChannelModal'

export const RealtimeMenu = () => {
  const router = useRouter()
  const { ref } = useParams()

  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false)
  // service api key is required for creating a new channel
  const canCreateChannels = useCheckPermissions(PermissionAction.READ, 'service_api_keys')

  const page = router.pathname.split('/')[4] as undefined | 'policies' | 'inspector'

  return (
    <>
      <Menu type="pills" className="mt-6">
        <div className="flex flex-col px-2 gap-y-6">
          <div className="mb-6 px-2">
            <Button
              block
              type="default"
              icon={<Plus strokeWidth={1} />}
              disabled={!canCreateChannels}
              style={{ justifyContent: 'start' }}
              onClick={() => setShowCreateChannelModal(true)}
            >
              New permanent channel
            </Button>
          </div>
          <div>
            <Link href={`/project/${ref}/realtime/policies`} legacyBehavior>
              <Menu.Item rounded active={page === 'policies'}>
                <p className="truncate">Policies</p>
              </Menu.Item>
            </Link>
            <Link href={`/project/${ref}/realtime/inspector`} legacyBehavior>
              <Menu.Item rounded active={page === 'inspector'}>
                <p className="truncate">Inspector</p>
              </Menu.Item>
            </Link>
          </div>
        </div>
      </Menu>

      <CreateChannelModal
        visible={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
      />
    </>
  )
}
