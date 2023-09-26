import Link from 'next/link'
import { useRouter } from 'next/router'
import SVG from 'react-inlinesvg'
import { Button, IconActivity, IconArchive, IconCode, IconExternalLink, IconKey } from 'ui'

import Panel from 'components/ui/Panel'
import { useFlag } from 'hooks'
import APIKeys from './APIKeys'
import GetStartedHero from './GetStartedHero'

const NewProjectPanel = () => {
  const router = useRouter()
  const { ref } = router.query
  const supabaseAIEnabled = useFlag('sqlEditorSupabaseAI')

  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-20">
      <div className="col-span-12">
        <div className="flex flex-col space-y-20">
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-xl text-foreground">Welcome to your new project</h3>
              <p className="text-base text-foreground-light">
                Your project has been deployed on its own instance, with its own API all set up and
                ready to use.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 flex flex-col justify-center space-y-8 lg:col-span-7">
              <div className="space-y-2">
                <h3 className="text-xl text-foreground">
                  Get started by building out your database
                </h3>
                <p className="text-base text-foreground-light">
                  Start building your app by creating tables and inserting data. Our Table Editor
                  makes Postgres as easy to use as a spreadsheet, but there's also our SQL Editor if
                  you need something more.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/project/${ref}/editor`}>
                  <a>
                    <Button
                      type="default"
                      icon={
                        <SVG
                          src={`${router.basePath}/img/table-editor.svg`}
                          style={{ width: `${14}px`, height: `${14}px` }}
                          preProcessor={(code) =>
                            code.replace(/svg/, 'svg class="m-auto text-color-inherit"')
                          }
                        />
                      }
                    >
                      Table Editor
                    </Button>
                  </a>
                </Link>
                <Link
                  href={
                    supabaseAIEnabled ? `/project/${ref}/sql/new` : `/project/${ref}/sql/templates`
                  }
                >
                  <a>
                    <Button
                      type="default"
                      icon={
                        <SVG
                          src={`${router.basePath}/img/sql-editor.svg`}
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
                  <a target="_blank" rel="noreferrer">
                    <Button type="default" icon={<IconExternalLink size={14} />}>
                      About Database
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-5">
              <GetStartedHero />
            </div>
          </div>

          <div className="flex h-full flex-col justify-between space-y-6">
            <div className="max-w-2xl space-y-2">
              <h3 className="text-xl text-foreground">Explore our other products</h3>
              <p className="text-base text-foreground-light">
                Supabase provides all the backend features you need to build a product. You can use
                it completely, or just the features you need.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 md:gap-y-0 xl:grid-cols-4">
              <Panel>
                <Panel.Content className="flex flex-col space-y-4 md:px-3">
                  <div className="flex items-center space-x-3">
                    <div className="rounded bg-scale-600 p-1.5 text-foreground-light shadow-sm">
                      <IconKey strokeWidth={2} size={16} />
                    </div>
                    <h5>Authentication</h5>
                  </div>
                  <div className="flex flex-grow md:min-h-[50px] xl:min-h-[75px]">
                    <p className="text-sm text-foreground-light">
                      A complete user management system that works without any additional tools.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/project/${ref}/auth/users`}>
                      <a>
                        <Button type="default">Explore Auth</Button>
                      </a>
                    </Link>
                    <Link href="https://supabase.com/docs/guides/auth">
                      <a target="_blank" rel="noreferrer">
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
                <Panel.Content className="flex flex-col space-y-4 md:px-3">
                  <div className="flex items-center space-x-3">
                    <div className="rounded bg-scale-600 p-1.5 text-foreground-light shadow-sm">
                      <IconArchive strokeWidth={2} size={16} />
                    </div>
                    <h5>Storage</h5>
                  </div>
                  <div className="flex md:min-h-[50px] xl:min-h-[75px]">
                    <p className="text-sm text-foreground-light">
                      Store, organize, and serve any file types of any size from multiple buckets.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/project/${ref}/storage/buckets`}>
                      <a>
                        <Button type="default">Explore Storage</Button>
                      </a>
                    </Link>
                    <Link href="https://supabase.com/docs/guides/storage">
                      <a target="_blank" rel="noreferrer">
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
                <Panel.Content className="flex flex-col space-y-4 md:px-3">
                  <div className="flex items-center space-x-3">
                    <div className="rounded bg-scale-600 p-1.5 text-foreground-light shadow-sm">
                      <IconCode strokeWidth={2} size={16} />
                    </div>
                    <h5>Edge Functions</h5>
                  </div>
                  <div className="flex md:min-h-[50px] xl:min-h-[75px]">
                    <p className="text-sm text-foreground-light">
                      Write custom code without deploying or scaling servers, with fast deploy times
                      and low latency.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href={`/project/${ref}/functions`}>
                      <a>
                        <Button type="default">Explore Functions</Button>
                      </a>
                    </Link>
                    <Link href="https://supabase.com/docs/guides/functions">
                      <a target="_blank" rel="noreferrer">
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
              <Panel>
                <Panel.Content className="flex flex-col space-y-4 md:px-3">
                  <div className="flex items-center space-x-4">
                    <div className="rounded bg-scale-600 p-1.5 text-foreground-light shadow-sm">
                      <IconActivity strokeWidth={2} size={16} />
                    </div>
                    <h5>Realtime</h5>
                  </div>
                  <div className="flex md:min-h-[50px] xl:min-h-[75px]">
                    <p className="text-sm text-foreground-light">
                      Listen to your PostgreSQL database in realtime via websockets.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link href="https://supabase.com/docs/guides/realtime">
                      <a target="_blank" rel="noreferrer">
                        <Button
                          className="translate-y-[1px]"
                          icon={<IconExternalLink size={14} />}
                          type="default"
                        >
                          About Realtime
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

      <div className="col-span-12 lg:col-span-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl text-foreground">Connecting to your new project</h3>
            <p className="text-base text-foreground-light lg:max-w-sm">
              Interact with your database through the{' '}
              <Link href="https://supabase.com/docs/reference">
                <a className="text-brand">Supabase client libraries</a>
              </Link>{' '}
              with your API keys.
            </p>
            <p className="text-base text-foreground-light lg:max-w-sm">
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
            <Link href="https://supabase.com/docs/guides/database/api">
              <a target="_blank" rel="noreferrer">
                <Button className="translate-y-[1px]" type="default" icon={<IconExternalLink />}>
                  About APIs
                </Button>
              </a>
            </Link>
          </div>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-8">
        <APIKeys />
      </div>
    </div>
  )
}

export default NewProjectPanel
