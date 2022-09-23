import Link from 'next/link'
import { FC } from 'react'
import SVG from 'react-inlinesvg'
import { useRouter } from 'next/router'
import { Button, IconKey, IconArchive, IconExternalLink, IconCode } from '@supabase/ui'

import Panel from 'components/ui/Panel'
import APIKeys from './APIKeys'
import GetStartedHero from './GetStartedHero'

interface Props {}

const NewProjectPanel: FC<Props> = ({}) => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <div className="grid grid-cols-12 gap-20">
      <div className="col-span-12">
        <div className="flex flex-col space-y-20">
          <div className="flex flex-col justify-between h-full">
            <div className="space-y-2">
              <h3 className="text-xl text-scale-1200">Welcome to your new project</h3>
              <p className="text-base text-scale-1100">
                Your project has been deployed on its own instance, with its own API all set up and
                ready to use.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 flex gap-4">
            <div className="col-span-7 space-y-8 flex flex-col justify-center">
              <div className="space-y-2">
                <h3 className="text-xl text-scale-1200">
                  Get started by building out your database
                </h3>
                <p className="text-base text-scale-1100">
                  Start building your app by creating tables and inserting data. Our table editor
                  makes Postgres as easy to use as a spreadsheet, but there's also our SQL editor if
                  you need something more.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Link href={`/project/${ref}/editor`}>
                  <a>
                    <Button
                      type="default"
                      icon={
                        <SVG
                          src="/img/table-editor.svg"
                          style={{ width: `${14}px`, height: `${14}px` }}
                          preProcessor={(code) =>
                            code.replace(/svg/, 'svg class="m-auto text-color-inherit"')
                          }
                        />
                      }
                    >
                      Table editor
                    </Button>
                  </a>
                </Link>
                <Link href={`/project/${ref}/sql`}>
                  <a>
                    <Button
                      type="default"
                      icon={
                        <SVG
                          src="/img/sql-editor.svg"
                          style={{ width: `${14}px`, height: `${14}px` }}
                          preProcessor={(code) =>
                            code.replace(/svg/, 'svg class="m-auto text-color-inherit"')
                          }
                        />
                      }
                    >
                      SQL editor
                    </Button>
                  </a>
                </Link>
                <Link href="https://supabase.com/docs/guides/database">
                  <a>
                    <Button type="default" icon={<IconExternalLink size={14} />}>
                      About Database
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
            <GetStartedHero />
          </div>

          <div className="flex flex-col justify-between h-full space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl text-scale-1200">Explore our other products</h3>
              <p className="text-base text-scale-1100">
                Supabase provides all the backend features you need to build a product. You can use
                it completely, or just the features you need.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
              <Panel>
                <Panel.Content className="flex flex-col space-y-4 lg:h-40">
                  <div className="flex items-center space-x-3">
                    <div className="bg-scale-600 text-scale-1000 shadow-sm rounded p-1.5">
                      <IconKey strokeWidth={2} size={16} />
                    </div>
                    <h5>Authentication</h5>
                  </div>
                  <div className="flex flex-grow">
                    <p className="text-scale-1000 text-sm">
                      A complete user management system that works without any additional tools.
                    </p>
                  </div>
                  <div className="space-x-2 flex items-center">
                    <Link href={`/project/${ref}/auth/users`}>
                      <a>
                        <Button type="default">Explore Auth</Button>
                      </a>
                    </Link>
                    <Link href="https://supabase.com/docs/guides/auth">
                      <a>
                        <Button
                          className="translate-y-[1px]"
                          icon={<IconExternalLink size={14} />}
                          type="default"
                        >
                          About Auth
                        </Button>
                      </a>
                    </Link>
                  </div>
                </Panel.Content>
              </Panel>

              <Panel>
                <Panel.Content className="flex flex-col space-y-4 lg:h-40">
                  <div className="flex items-center space-x-3">
                    <div className="bg-scale-600 text-scale-1000 shadow-sm rounded p-1.5">
                      <IconArchive strokeWidth={2} size={16} />
                    </div>
                    <h5>Storage</h5>
                  </div>
                  <div className="flex flex-grow">
                    <p className="text-scale-1000 text-sm">
                      Store, organize, and serve any file types of any size from multiple buckets.
                    </p>
                  </div>
                  <div className="space-x-2 flex items-center">
                    <Link href={`/project/${ref}/storage/buckets`}>
                      <a>
                        <Button type="default">Explore Storage</Button>
                      </a>
                    </Link>
                    <Link href="https://supabase.com/docs/guides/storage">
                      <a>
                        <Button
                          className="translate-y-[1px]"
                          icon={<IconExternalLink size={14} />}
                          type="default"
                        >
                          About Storage
                        </Button>
                      </a>
                    </Link>
                  </div>
                </Panel.Content>
              </Panel>

              <Panel>
                <Panel.Content className="flex flex-col space-y-4 lg:h-40">
                  <div className="flex items-center space-x-3">
                    <div className="bg-scale-600 text-scale-1000 shadow-sm rounded p-1.5">
                      <IconCode strokeWidth={2} size={16} />
                    </div>
                    <h5>Edge Functions</h5>
                  </div>
                  <div className="flex flex-grow">
                    <p className="text-scale-1000 text-sm">
                      Write custom code without deploying or scaling servers, with fast deploy times
                      and low latency.
                    </p>
                  </div>
                  <div className="space-x-2 flex items-center">
                    <Link href={`/project/${ref}/functions`}>
                      <a>
                        <Button type="default">Explore Functions</Button>
                      </a>
                    </Link>
                    <Link href="https://supabase.com/docs/guides/functions">
                      <a>
                        <Button
                          className="translate-y-[1px]"
                          icon={<IconExternalLink size={14} />}
                          type="default"
                        >
                          About Functions
                        </Button>
                      </a>
                    </Link>
                  </div>
                </Panel.Content>
              </Panel>
            </div>
          </div>
        </div>
      </div>
      <div className="col-span-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl text-scale-1200">Connecting to your new project</h3>
            <p className="lg:max-w-sm text-scale-1100">
              Interact with your database through the{' '}
              <Link href="https://supabase.com/docs/reference">
                <a className="text-brand-900">Supabase client libraries</a>
              </Link>{' '}
              with your API keys.
            </p>
            <p className="lg:max-w-sm text-scale-1100">
              More information about your project's keys can be found in your project's API
              settings.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/project/${ref}/settings/api`}>
              <a>
                <Button type="default">View API settings</Button>
              </a>
            </Link>
            <Link href="https://supabase.com/docs/guides/api">
              <a>
                <Button className="translate-y-[1px]" type="default" icon={<IconExternalLink />}>
                  About APIs
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
      <div className="col-span-8">
        <APIKeys />
      </div>
    </div>
  )
}

export default NewProjectPanel
