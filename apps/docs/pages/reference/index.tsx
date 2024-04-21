import ButtonCard from '~/components/ButtonCard'
import { Heading } from '~/components/CustomHTMLElements'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import Layout from '~/layouts/DefaultGuideLayout'

export const meta = {
  id: 'reference',
  title: 'Reference Documentation',
  sidebar_label: 'Reference Documentation',
  hide_table_of_contents: true,
}

const Page = () => (
  <Layout meta={meta} menuId={MenuId.Home}>
    <div className="prose">
      <p>Reference documentation for the official Supabase client libraries, APIs, and tools.</p>

      <div className="container p-0 not-prose">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <ButtonCard
              icon="/docs/img/icons/javascript-icon.svg"
              to="/reference/javascript"
              title="JavaScript"
              description="JavaScript and TypeScript documentation."
            />
          </div>
          <div>
            <ButtonCard
              icon="/docs/img/icons/flutter-icon.svg"
              to="/reference/dart"
              title="Flutter"
              description="Flutter and Dart documentation."
            />
          </div>
          <div>
            <ButtonCard
              icon="/docs/img/icons/cli-icon.svg"
              to="/reference/cli"
              title="Supabase CLI"
              description="Tools for developing your Supabase projects locally."
            />
          </div>
          <div>
            <ButtonCard
              icon="/docs/img/icons/api-icon.svg"
              to="/reference/api"
              title="Management API"
              description="Manage your Supabase projects programmatically."
            />
          </div>
        </div>
      </div>

      <Heading tag="h2">Self-hosting</Heading>

      <p>Reference documentation for self-hosting Supabase features.</p>

      <div className="container">
        <div className="grid grid-cols-2 gap-3 not-prose">
          <div className="w-1/2">
            <ButtonCard
              to="/reference/auth"
              title="Auth Server"
              description=" JSON Web Token (JWT)-based API for managing users and issuing access tokens."
            />
          </div>
          <div>
            <ButtonCard
              to="/reference/realtime"
              title="Realtime"
              description="Build multiplayer applications and listen to your database changes via websockets."
            />
          </div>
          <div>
            <ButtonCard
              to="/reference/storage"
              title="Storage"
              description="S3-compatible object storage service that integrates with Postgres."
            />
          </div>
        </div>
      </div>
    </div>
  </Layout>
)

export default Page
