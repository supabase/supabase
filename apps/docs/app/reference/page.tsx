import { clientSdkIds, REFERENCES } from '~/content/navigation.references'
import { IconLink, IconLinkMenuIcon } from '~/features/ui/IconLink'
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
          <ul className="grid grid-cols-12 gap-3 not-prose">
            {clientSdkIds.map((sdkId) => (
              <li key={REFERENCES[sdkId].name} className="col-span-6 md:col-span-4">
                <IconLink
                  href={`/reference/${REFERENCES[sdkId].libPath}`}
                  title={REFERENCES[sdkId].name}
                  icon={<IconLinkMenuIcon icon={REFERENCES[sdkId].icon} />}
                />
              </li>
            ))}
          </ul>
          <h2 className="mb-8">Management API and CLI</h2>
          <ul className="grid grid-cols-12 gap-3 not-prose">
            <li className="col-span-6 md:col-span-4">
              <IconLink
                href="/reference/api/introduction"
                title="Management API"
                icon={<IconLinkMenuIcon icon={REFERENCES['api'].icon} />}
              />
            </li>
            <li className="col-span-6 md:col-span-4">
              <IconLink
                href="/reference/cli/introduction"
                title="CLI"
                icon={<IconLinkMenuIcon icon={REFERENCES['cli'].icon} />}
              />
            </li>
          </ul>
        </article>
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}
