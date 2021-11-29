import { FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Typography, Button, IconDatabase, IconKey, IconArchive } from '@supabase/ui'
import Panel from 'components/to-be-cleaned/Panel'

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
              <Typography.Title level={4} className="m-0">
                Welcome to your new project
              </Typography.Title>
              <div className="lg:max-w-lg">
                <Typography.Text className="block" type="secondary">
                  <p>
                    Your project has been deployed on its own instance, with its own url and API all
                    set up and ready to use.
                  </p>
                </Typography.Text>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <Panel>
            <Panel.Content className=" flex flex-col space-y-4 lg:h-40">
              <div className="flex items-center space-x-3">
                <Typography.Text>
                  <IconDatabase size="medium" />
                </Typography.Text>
                <Typography.Title level={5} className="mb-0">
                  Database
                </Typography.Title>
              </div>
              <div className="flex flex-grow">
                <Typography.Text type="secondary" className="opacity-50">
                  Supabase is built on top of Postgres, an extremely scalable Relational Database.
                </Typography.Text>
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
                <Typography.Text>
                  <IconKey size="medium" />
                </Typography.Text>
                <Typography.Title level={5} className="mb-0">
                  Auth
                </Typography.Title>
              </div>
              <div className="flex flex-grow">
                <Typography.Text type="secondary" className="opacity-50">
                  Supabase makes it simple to manage your users.
                </Typography.Text>
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
                <Typography.Text>
                  <IconArchive size="medium" />
                </Typography.Text>
                <Typography.Title level={5} className="mb-0">
                  Storage
                </Typography.Title>
              </div>
              <div className="flex flex-grow">
                <Typography.Text type="secondary" className="opacity-50">
                  Store and serve large files from multiple buckets.
                </Typography.Text>
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
