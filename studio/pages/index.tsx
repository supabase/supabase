import { Typography, IconBookOpen, IconGitHub } from '@supabase/ui'
import DashboardLayout from '../components/layouts/DashboardLayout'
import ClientLibrary from 'components/utils/ClientLibrary'
import ExampleProject from 'components/utils/ExampleProject'
import exampleProjects from '../lib/example-projects.json'
import cuid from 'cuid'

export default function Home() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto w-full my-16 space-y-16">
        <div className="mx-6 mb-8">
          <Typography.Title level={4}>Client libraries</Typography.Title>
        </div>
        <div className="mx-6 grid md:grid-cols-3 gap-12 mb-12">
          <ClientLibrary
            language="JavaScript"
            officalSupport
            docsUrl="https://supabase.io/docs/reference/javascript/installing"
            gitUrl="https://github.com/supabase/supabase-js"
          />
          <ClientLibrary
            language="Python"
            releaseState="Alpha"
            gitUrl="https://github.com/supabase/supabase-py"
          />
          <ClientLibrary
            language="Dart"
            releaseState="Beta"
            gitUrl="https://github.com/supabase/supabase-dart"
          />
        </div>
        <div className="mx-6 mb-8">
          <Typography.Title level={4}>Example projects</Typography.Title>
        </div>
        <div className="mx-6 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exampleProjects.map((p) => (
            <ExampleProject
              key={cuid()}
              framework={p.framework}
              title={p.title}
              description={p.description}
              url={p.url}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
