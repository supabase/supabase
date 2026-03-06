import { useParams } from 'common'
import { Auth, EdgeFunctions, Realtime, SqlEditor, Storage, TableEditor } from 'icons'
import { ExternalLink, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

import { APIKeys } from './APIKeys'
import { GetStartedHero } from './GetStartedHero'
import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLink } from '@/components/ui/InlineLink'
import Panel from '@/components/ui/Panel'
import { EditorIndexPageLink } from '@/data/prefetchers/project.$ref.editor'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'

export const NewProjectPanel = () => {
  const { ref } = useParams()

  const {
    projectAuthAll: authEnabled,
    projectEdgeFunctionAll: edgeFunctionsEnabled,
    projectStorageAll: storageEnabled,
  } = useIsFeatureEnabled(['project_auth:all', 'project_edge_function:all', 'project_storage:all'])

  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-20">
      <div className="col-span-12">
        <div className="flex flex-col space-y-12 md:space-y-20">
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-2">
              <h2>Welcome to your new project</h2>
              <p className="text-base text-foreground-light">
                Your project has been deployed on its own instance, with its own API all set up and
                ready to use.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 flex flex-col justify-center space-y-8 lg:col-span-7">
              <div className="space-y-2">
                <h2>Build out your database</h2>
                <p className="text-base text-foreground-light">
                  Start building your app by creating tables and inserting data. Our Table Editor
                  makes Postgres as easy to use as a spreadsheet, but there's also our SQL Editor if
                  you need something more.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild type="default" icon={<TableEditor strokeWidth={1.5} />}>
                  <EditorIndexPageLink projectRef={ref}>Table Editor</EditorIndexPageLink>
                </Button>
                <Button asChild type="default" icon={<SqlEditor strokeWidth={1.5} />}>
                  <Link href={`/project/${ref}/sql/new`}>SQL Editor</Link>
                </Button>
                <Button asChild type="default" icon={<ExternalLink />}>
                  <Link href={`${DOCS_URL}/guides/database`} target="_blank" rel="noreferrer">
                    About Database
                  </Link>
                </Button>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-5">
              <GetStartedHero />
            </div>
          </div>

          {authEnabled && edgeFunctionsEnabled && storageEnabled && (
            <div className="flex h-full flex-col justify-between space-y-6">
              <div className="max-w-2xl space-y-2">
                <h2>Explore our other products</h2>
                <p className="text-base text-foreground-light">
                  Supabase provides all the backend features you need to build a product. You can
                  use it completely, or just the features you need.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 md:gap-y-0 xl:grid-cols-4">
                <Panel>
                  <Panel.Content className="flex flex-col space-y-4 md:px-3">
                    <div className="flex items-center space-x-3">
                      <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">
                        <Auth size={16} strokeWidth={1.5} />
                      </div>
                      <h5>Authentication</h5>
                    </div>
                    <div className="flex flex-grow md:min-h-[50px] xl:min-h-[75px]">
                      <p className="text-sm text-foreground-light">
                        A complete user management system that works without any additional tools.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button type="default" asChild>
                        <Link href={`/project/${ref}/auth/users`}>Explore Auth</Link>
                      </Button>

                      <Button
                        className="translate-y-[1px]"
                        icon={<ExternalLink />}
                        type="default"
                        asChild
                      >
                        <Link href={`${DOCS_URL}/guides/auth`} target="_blank" rel="noreferrer">
                          About Auth
                        </Link>
                      </Button>
                    </div>
                  </Panel.Content>
                </Panel>

                <Panel>
                  <Panel.Content className="flex flex-col space-y-4 md:px-3">
                    <div className="flex items-center space-x-3">
                      <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">
                        <Storage size={16} strokeWidth={1.5} />
                      </div>
                      <h5>Storage</h5>
                    </div>
                    <div className="flex md:min-h-[50px] xl:min-h-[75px]">
                      <p className="text-sm text-foreground-light">
                        Store, organize, and serve any file types of any size from multiple buckets.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button type="default" asChild>
                        <Link href={`/project/${ref}/storage/buckets`}>Explore Storage</Link>
                      </Button>

                      <Button
                        className="translate-y-[1px]"
                        icon={<ExternalLink />}
                        type="default"
                        asChild
                      >
                        <Link href={`${DOCS_URL}/guides/storage`} target="_blank" rel="noreferrer">
                          About Storage
                        </Link>
                      </Button>
                    </div>
                  </Panel.Content>
                </Panel>

                <Panel>
                  <Panel.Content className="flex flex-col space-y-4 md:px-3">
                    <div className="flex items-center space-x-3">
                      <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">
                        <EdgeFunctions size={16} strokeWidth={1.5} />
                      </div>
                      <h5>Edge Functions</h5>
                    </div>
                    <div className="flex md:min-h-[50px] xl:min-h-[75px]">
                      <p className="text-sm text-foreground-light">
                        Write custom code without deploying or scaling servers, with fast deploy
                        times and low latency.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button type="default" asChild>
                        <Link href={`/project/${ref}/functions`}>Explore Functions</Link>
                      </Button>
                      <Button
                        className="translate-y-[1px]"
                        icon={<ExternalLink />}
                        type="default"
                        asChild
                      >
                        <Link
                          href={`${DOCS_URL}/guides/functions`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          About Functions
                        </Link>
                      </Button>
                    </div>
                  </Panel.Content>
                </Panel>
                <Panel>
                  <Panel.Content className="flex flex-col space-y-4 md:px-3">
                    <div className="flex items-center space-x-4">
                      <div className="rounded bg-surface-300 p-1.5 text-foreground-light shadow-sm">
                        <Realtime size={16} strokeWidth={1.5} />
                      </div>
                      <h5>Realtime</h5>
                    </div>
                    <div className="flex md:min-h-[50px] xl:min-h-[75px]">
                      <p className="text-sm text-foreground-light">
                        Listen to your PostgreSQL database in realtime via websockets.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button type="default" asChild>
                        <Link href={`/project/${ref}/realtime/inspector`}>Explore Realtime</Link>
                      </Button>
                      <Button
                        className="translate-y-[1px]"
                        icon={<ExternalLink />}
                        type="default"
                        asChild
                      >
                        <Link href={`${DOCS_URL}/guides/realtime`} target="_blank" rel="noreferrer">
                          About Realtime
                        </Link>
                      </Button>
                    </div>
                  </Panel.Content>
                </Panel>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-12 lg:col-span-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2>Connect to your project</h2>
            <p className="text-base text-foreground-light text-balance">
              Interact with your database through the{' '}
              <InlineLink href={`${DOCS_URL}/reference`}>Supabase client libraries</InlineLink> and
              your API keys.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild type="default" icon={<Settings size={16} strokeWidth={1.5} />}>
              <Link href={`/project/${ref}/settings/api-keys`}>API Keys settings</Link>
            </Button>
            <DocsButton href={`${DOCS_URL}/guides/database/api`} />
          </div>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-8">
        <APIKeys />
      </div>
    </div>
  )
}
