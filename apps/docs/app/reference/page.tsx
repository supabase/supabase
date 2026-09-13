import { clientSdkIds, REFERENCES } from '~/content/navigation.references'
import { IconLinkList, IconLinkMenuIcon } from '~/features/ui/IconLink'
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
          <h2 id="client-libraries" className="mb-8">
            Client Libraries
          </h2>
          <IconLinkList
            labelledBy="client-libraries"
            className="not-prose"
            items={clientSdkIds.map((sdkId) => ({
              title: REFERENCES[sdkId].name,
              href: `/reference/${REFERENCES[sdkId].libPath}`,
              icon: <IconLinkMenuIcon icon={REFERENCES[sdkId].icon} />,
            }))}
          />
          <h2 id="management-api-and-cli" className="mb-8">
            Management API and CLI
          </h2>
          <IconLinkList
            labelledBy="management-api-and-cli"
            className="not-prose"
            items={[
              {
                title: 'Management API',
                href: '/reference/api/introduction',
                icon: <IconLinkMenuIcon icon={REFERENCES['api'].icon} />,
              },
              {
                title: 'CLI',
                href: '/reference/cli/introduction',
                icon: <IconLinkMenuIcon icon={REFERENCES['cli'].icon} />,
              },
            ]}
          />
        </article>
      </LayoutMainContent>
    </SidebarSkeleton>
  )
}
