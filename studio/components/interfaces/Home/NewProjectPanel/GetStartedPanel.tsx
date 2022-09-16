import { FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, IconDatabase, IconKey, IconArchive } from '@supabase/ui'
import Panel from 'components/ui/Panel'

interface Props {}

const GetStartedPanel: FC<Props> = ({}) => {
  const router = useRouter()
  const { ref } = router.query
  return (
    <>
      <div className="flex flex-col space-y-6">
        <div>
          <div className="flex flex-col justify-between h-full space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl text-scale-1200">Welcome to your new project</h3>
              <p className="lg:max-w-lg text-base text-scale-1000">
                Your project has been deployed on its own instance, with its own url and API all set
                up and ready to use.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <Panel>
            <Panel.Content className=" flex flex-col space-y-4 lg:h-40">
              <div className="flex items-center space-x-3">
                <div className="bg-scale-600 text-scale-1000 shadow-sm rounded p-1.5">
                  <IconDatabase strokeWidth={2} size={16} />
                </div>
                <h5>Database</h5>
              </div>
              <div className="flex flex-grow">
                <p className="text-scale-1000 text-sm">
                  Supabase is built on top of Postgres, an extremely scalable Relational Database.
                </p>
              </div>
              <div className="space-x-2">
                <Link href={`/project/${ref}/editor`}>
                  <a>
                    <Button type="default">Table editor</Button>
                  </a>
                </Link>
                <Link href={`/project/${ref}/sql`}>
                  <a>
                    <Button type="default">SQL editor</Button>
                  </a>
                </Link>
                <a href="https://supabase.com/docs/guides/database" target="_blank">
                  <Button type="text">Documentation</Button>
                </a>
              </div>
            </Panel.Content>
          </Panel>

          <Panel className="">
            <Panel.Content className=" flex flex-col space-y-4 lg:h-40">
              <div className="flex items-center space-x-3">
                <div className="bg-scale-600 text-scale-1000 shadow-sm rounded p-1.5">
                  <IconKey strokeWidth={2} size={16} />
                </div>
                <h5>Auth</h5>
              </div>
              <div className="flex flex-grow">
                <p className="text-scale-1000 text-sm">
                  Supabase makes it simple to manage your users.
                </p>
              </div>
              <div className="space-x-2">
                <Link href={`/project/${ref}/auth/users`}>
                  <a>
                    <Button type="default">Try Auth</Button>
                  </a>
                </Link>
                <a href="https://supabase.com/docs/guides/auth" target="_blank">
                  <Button type="text">Documentation</Button>
                </a>
              </div>
            </Panel.Content>
          </Panel>

          <Panel>
            <Panel.Content className=" flex flex-col space-y-4 lg:h-40">
              <div className="flex items-center space-x-3">
                <div className="bg-scale-600 text-scale-1000 shadow-sm rounded p-1.5">
                  <IconArchive strokeWidth={2} size={16} />
                </div>
                <h5>Storage</h5>
              </div>
              <div className="flex flex-grow">
                <p className="text-scale-1000 text-sm">
                  Store and serve large files from multiple buckets.
                </p>
              </div>
              <div className="space-x-2">
                <Link href={`/project/${ref}/storage/buckets`}>
                  <a>
                    <Button type="default">Try Storage</Button>
                  </a>
                </Link>
                <a href="https://supabase.com/docs/guides/storage" target="_blank">
                  <Button type="text">Documentation</Button>
                </a>
              </div>
            </Panel.Content>
          </Panel>
        </div>
      </div>
    </>
  )
}

export default GetStartedPanel
