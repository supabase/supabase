import Link from 'next/link'

import { REFERENCES, clientSdkIds } from '~/content/navigation.references'
import { IconPanelWithIconPicker } from '~/features/ui/IconPanelWithIconPicker'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

export default function ReferenceIndexPage() {
  return (
    <SidebarSkeleton>
      <LayoutMainContent>
        <article className="prose">
          <h1>API References</h1>
          <p>
            The Supabase client libraries help you interact with Supabase products, such as the
            Postgres Database, Auth, and Realtime. They are available in several popular programming
            languages.
          </p>
          <p>
            Supabase also has a Management API to help with managing your Supabase Platform, and a
            CLI for local development and CI workflows.
          </p>
          <h2 className="mb-8">Client Libraries</h2>
          <div className="grid col-span-8 grid-cols-12 gap-6 not-prose">
            {clientSdkIds.map((sdkId) => {
              return (
                <Link
                  key={REFERENCES[sdkId].name}
                  href={`/reference/${REFERENCES[sdkId].libPath}`}
                  passHref
                  className="col-span-6 md:col-span-4"
                >
                  <IconPanelWithIconPicker
                    title={REFERENCES[sdkId].name}
                    icon={REFERENCES[sdkId].icon}
                  />
                </Link>
              )
            })}
          </div>
          <h2 className="mb-8">Management API and CLI</h2>
          <div className="grid col-span-8 grid-cols-12 gap-6 not-prose">
            <Link
              href={`/reference/api/introduction`}
              passHref
              className="col-span-6 md:col-span-4"
            >
              <IconPanelWithIconPicker title="Management API" icon={REFERENCES['api'].icon} />
            </Link>
            <Link
              href={`/reference/cli/introduction`}
              passHref
              className="col-span-6 md:col-span-4"
            >
              <IconPanelWithIconPicker title="CLI" icon={REFERENCES['cli'].icon} />
            </Link>
          </div>
        </article>
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}
