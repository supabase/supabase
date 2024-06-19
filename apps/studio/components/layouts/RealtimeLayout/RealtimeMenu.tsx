import Link from 'next/link'
import { useRouter } from 'next/router'

import { useParams } from 'common'
import { Menu } from 'ui'

export const RealtimeMenu = () => {
  const router = useRouter()
  const { ref } = useParams()

  const page = router.pathname.split('/')[4] as undefined | 'policies' | 'inspector'

  return (
    <>
      <Menu type="pills" className="mt-6">
        <div className="flex flex-col px-2 gap-y-6">
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
    </>
  )
}
