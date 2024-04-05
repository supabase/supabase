import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { useCheckPermissions, useSelectedProject } from 'hooks'
import { Edit } from 'lucide-react'
import Link from 'next/link'
import { Button, Menu } from 'ui'
import { CreateChannelModal } from './CreateChannelModal'

export const RealtimeMenu = () => {
  const router = useRouter()
  const { ref } = useParams()
  const project = useSelectedProject()

  const isBranch = project?.parent_project_ref !== undefined

  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false)
  // service api key is required for creating a new channel
  const canCreateChannels = useCheckPermissions(PermissionAction.READ, 'service_api_keys')

  const page = router.pathname.split('/')[4] as undefined | 'policies' | 'inspector'

  return (
    <>
      <Menu type="pills" className="my-6 flex flex-grow flex-col px-5">
        <div className="mb-6 px-2">
          <Button
            block
            type="default"
            icon={
              <div className="text-foreground-lighter">
                <Edit />
              </div>
            }
            disabled={!canCreateChannels}
            style={{ justifyContent: 'start' }}
            onClick={() => setShowCreateChannelModal(true)}
          >
            New permanent channel
          </Button>
        </div>
        <div className="">
          <Link href={`/project/${ref}/realtime/inspector`} legacyBehavior>
            <Menu.Item rounded active={page === 'inspector'}>
              <p className="truncate">Inspector</p>
            </Menu.Item>
          </Link>
          <Link href={`/project/${ref}/realtime/policies`} legacyBehavior>
            <Menu.Item rounded active={page === 'policies'}>
              <p className="truncate">Policies</p>
            </Menu.Item>
          </Link>
        </div>
      </Menu>

      <CreateChannelModal
        visible={showCreateChannelModal}
        onClose={() => setShowCreateChannelModal(false)}
      />
    </>
  )
}
