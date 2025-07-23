import { Card, CardHeader, CardTitle } from 'ui'
import { CodeBlock } from '~/features/ui/CodeBlock/CodeBlock'
import { Edit, Terminal, Sparkles, Users, AtSign, Github } from 'lucide-react'
import { Image } from 'ui'
import StepHikeCompact from '~/components/StepHikeCompact'

export async function CodeFirstSchemaContent() {
  return (
    <div>
      <p className="text-foreground-light text-lg mb-8">
        Use a declarative schema file to define your database structure. The Supabase CLI compares
        this to your database state to generate migration files.
      </p>
      <StepHikeCompact>
        <StepHikeCompact.Step step={1} title="Define your schema">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              Create or edit a SQL file in the <code>supabase/schemas</code> directory to define
              your tables, views, and functions.
            </p>
          </StepHikeCompact.Details>
          <StepHikeCompact.Code>
            <CodeBlock
              lang="sql"
              contents={`create table "employees" (
  "id" integer not null,
  "name" text
);`}
            />
          </StepHikeCompact.Code>
        </StepHikeCompact.Step>
        <StepHikeCompact.Step step={2} title="Generate a migration">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              This command creates a new migration file with the SQL needed to update your database.
            </p>
          </StepHikeCompact.Details>
          <StepHikeCompact.Code>
            <CodeBlock lang="bash" contents={`supabase db diff -f <migration_name>`} />
          </StepHikeCompact.Code>
        </StepHikeCompact.Step>
        <StepHikeCompact.Step step={3} title="Deploy your changes">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              Apply the migrations to your production database.
            </p>
          </StepHikeCompact.Details>
          <StepHikeCompact.Code>
            <CodeBlock lang="bash" contents={`supabase db push`} />
          </StepHikeCompact.Code>
        </StepHikeCompact.Step>
      </StepHikeCompact>
    </div>
  )
}

export function CreateProjectContent() {
  return (
    <div>
      <h2 className="text-3xl font-medium mb-2">Create a new Supabase project</h2>
      <p className="text-foreground-light text-lg mb-8">
        Before you can start building, you need to create a project in the Supabase Dashboard.
      </p>
      <StepHikeCompact>
        <StepHikeCompact.Step step={1} title="Go to the Supabase Dashboard">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              Navigate to{' '}
              <a
                href="https://app.supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand underline"
              >
                app.supabase.com
              </a>{' '}
              to get started.
            </p>
          </StepHikeCompact.Details>
        </StepHikeCompact.Step>
        <StepHikeCompact.Step step={2} title="Create a new project">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              Click on "New project" and choose the organization you want to create the project in.
            </p>
          </StepHikeCompact.Details>
        </StepHikeCompact.Step>
        <StepHikeCompact.Step step={3} title="Fill in project details">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              Provide a name for your project, generate a secure database password, and choose the
              region closest to your users.
            </p>
          </StepHikeCompact.Details>
        </StepHikeCompact.Step>
      </StepHikeCompact>
    </div>
  )
}

export async function CodeFirstAuthConfig() {
  return (
    <div>
      <p className="text-foreground-light text-lg mb-8">
        Manage your authentication settings by defining them in your{' '}
        <code>supabase/config.toml</code> file. This allows you to keep your auth configuration in
        version control.
      </p>
      <StepHikeCompact>
        <StepHikeCompact.Step step={1} title="Configure Site URLs">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              Set your application's site URL and any additional redirect URLs. This is crucial for
              security and ensures that users are redirected to the correct location after
              authentication.
            </p>
          </StepHikeCompact.Details>
          <StepHikeCompact.Code>
            <CodeBlock
              lang="toml"
              contents={`[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = [
  "https://example.com/welcome"
]`}
            />
          </StepHikeCompact.Code>
        </StepHikeCompact.Step>
        <StepHikeCompact.Step step={2} title="Manage User Sign-ups">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              You can enable or disable new user sign-ups. For many applications, you might want to
              disable sign-ups after an initial period.
            </p>
          </StepHikeCompact.Details>
          <StepHikeCompact.Code>
            <CodeBlock
              lang="toml"
              contents={`[auth]
disable_signup = false # set to true to disable new sign-ups`}
            />
          </StepHikeCompact.Code>
        </StepHikeCompact.Step>
        <StepHikeCompact.Step step={3} title="Enable Social Providers">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              Enable social providers like GitHub by adding their configuration. You'll need to get
              the client ID and secret from the provider's developer console.
            </p>
          </StepHikeCompact.Details>
          <StepHikeCompact.Code>
            <CodeBlock
              lang="toml"
              contents={`[auth.external.github]
enabled = true
client_id = "your-github-client-id"
secret = "your-github-client-secret"
`}
            />
          </StepHikeCompact.Code>
        </StepHikeCompact.Step>
      </StepHikeCompact>
    </div>
  )
}

export function NoCodeSchemaContent() {
  return (
    <div>
      <p className="text-foreground-light text-lg mb-8">
        The Dashboard provides several ways to modify your database schema
      </p>
      <div className="space-y-4">
        <Card className="p-0 relative">
          <Image
            fill
            alt="Diagram showing the state transitions of a signing key"
            src={{
              light: '/docs/img/walkthrough/schema-table.webp',
              dark: '/docs/img/walkthrough/schema-table.webp',
            }}
          />
          <div className="p-4 flex items-start gap-4 border-t">
            <Edit className="w-6 h-6 mt-1 text-foreground-light" />
            <div>
              <h4 className="font-medium">Table Editor</h4>
              <p className="text-foreground-light">
                Visually create, edit, and delete tables and columns. This is the easiest way to get
                started and manage your database for most use cases.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-0 relative">
          <Image
            fill
            alt="Diagram showing the state transitions of a signing key"
            src={{
              light: '/docs/img/walkthrough/schema-ai.webp',
              dark: '/docs/img/walkthrough/schema-ai.webp',
            }}
          />
          <div className="p-4 flex items-start gap-4 border-t">
            <Sparkles className="w-6 h-6 mt-1 text-foreground-light" />
            <div>
              <h4 className="font-medium">AI Assistant</h4>
              <p className="text-foreground-light">
                Use the AI Assistant to generate SQL from natural language prompts. Describe what
                you want to do, and the AI will generate the SQL for you to review and run.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-0 relative">
          <Image
            fill
            alt="Diagram showing the state transitions of a signing key"
            src={{
              light: '/docs/img/walkthrough/schema-sql.webp',
              dark: '/docs/img/walkthrough/schema-sql.webp',
            }}
          />
          <div className="p-4 flex items-start gap-4 border-t">
            <Terminal className="w-6 h-6 mt-1 text-foreground-light" />
            <div>
              <h4 className="font-medium">SQL Editor</h4>
              <p className="text-foreground-light">
                For more complex needs, use the SQL Editor to run any SQL command. You can create
                views, functions, and advanced policies. You can also save your favorite queries as
                snippets.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function NoCodeAuthConfig() {
  return (
    <div>
      <p className="text-foreground-light text-lg mb-8">
        Configure authentication using the Supabase Dashboard. Navigate to the Authentication
        section in the sidebar to get started.
      </p>
      <div className="space-y-4">
        <Card className="p-4 flex items-start gap-4">
          <Users className="w-6 h-6 mt-1 text-foreground-light" />
          <div>
            <h4 className="font-medium">Enable user sign-ups</h4>
            <p className="text-foreground-light">
              In the Providers section, you can enable or disable sign-ups for different methods,
              like email and password, or phone-based login.
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-start gap-4">
          <AtSign className="w-6 h-6 mt-1 text-foreground-light" />
          <div>
            <h4 className="font-medium">Set up email provider</h4>
            <p className="text-foreground-light">
              In the Settings section, configure your SMTP settings to customize the emails sent to
              your users for confirmations, password resets, and more.
            </p>
          </div>
        </Card>
        <Card className="p-4 flex items-start gap-4">
          <Github className="w-6 h-6 mt-1 text-foreground-light" />
          <div>
            <h4 className="font-medium">Configure Social Providers</h4>
            <p className="text-foreground-light">
              In the Providers section, you can easily enable social logins like Google, GitHub, and
              more. Simply toggle the provider and add your Client ID and Secret.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export async function ConnectToAppContent() {
  return (
    <div>
      <StepHikeCompact>
        <StepHikeCompact.Step step={1} title="Create a Next.js app">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              The quickest way to get started is with the `with-supabase` template, which
              pre-configures Cookie-based Auth, TypeScript, and Tailwind CSS.
            </p>
          </StepHikeCompact.Details>
          <StepHikeCompact.Code>
            <CodeBlock lang="bash" contents={`npx create-next-app -e with-supabase`} />
          </StepHikeCompact.Code>
        </StepHikeCompact.Step>

        <StepHikeCompact.Step step={2} title="Declare Supabase Environment Variables">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              Rename `.env.example` to `.env.local` and add your project's URL and anon key. You can
              find these in your project's API settings.
            </p>
          </StepHikeCompact.Details>
          <StepHikeCompact.Code>
            <CodeBlock
              lang="text"
              contents={`NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`}
            />
          </StepHikeCompact.Code>
        </StepHikeCompact.Step>

        <StepHikeCompact.Step step={3} title="Start the app and sign up">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              The template includes a full authentication flow. Start the app and navigate to the
              login page to sign up.
            </p>
          </StepHikeCompact.Details>
          <StepHikeCompact.Code>
            <CodeBlock lang="bash" contents={`npm run dev`} />
          </StepHikeCompact.Code>
        </StepHikeCompact.Step>

        <StepHikeCompact.Step step={4} title="Query data from your database">
          <StepHikeCompact.Details>
            <p className="text-foreground-light">
              Once your app is set up, you can use the Supabase client to interact with your
              database. Here's how you can fetch data inside a React Server Component.
            </p>
          </StepHikeCompact.Details>
          <StepHikeCompact.Code>
            <CodeBlock
              lang="tsx"
              contents={`import { createClient } from '@/utils/supabase/server'

export default async function Page() {
  const supabase = createClient()
  const { data: employees } = await supabase.from('employees').select()

  return <pre>{JSON.stringify(employees, null, 2)}</pre>
}`}
            />
          </StepHikeCompact.Code>
        </StepHikeCompact.Step>
      </StepHikeCompact>
    </div>
  )
}

export function CodeFirstBranchingContent() {
  return (
    <div>
      <p className="text-foreground-light text-lg mb-8">
        After launching your app, make follow-up changes—like schema or function updates—in a
        branch. This lets you safely test and review updates before they reach production. In a
        code-first workflow, connecting your Supabase project to GitHub enables automatic preview
        branches for pull requests, so you can validate migrations and deployments before merging.
      </p>
      <ol className="prose text-sm">
        <li>
          <h4>Connect to a GitHub repository</h4>
          <p>
            In your project's settings, navigate to the Integrations page and connect your Supabase
            project to a GitHub repository. This will allow Supabase to sync branches and run checks
            on your pull requests.
          </p>
        </li>
        <li>
          <h4>Enable automatic branching</h4>
          <p>
            In the GitHub integration settings, enable "Automatic branching". Now, when you create a
            new branch and push it to GitHub, a corresponding preview branch will be created on
            Supabase.
          </p>
        </li>
        <li>
          <h4>Deploy to production</h4>
          <p>
            Enable the "Deploy to production" option in the integration settings. When you merge a
            pull request into your main branch, the changes will be automatically deployed to your
            production project.
          </p>
        </li>
        <li>
          <h4>Enable required checks</h4>
          <p>
            In your GitHub repository settings, make the Supabase integration a "required check".
            This prevents merging pull requests that have failing migrations, keeping your
            production database safe.
          </p>
        </li>
      </ol>
    </div>
  )
}

export function NoCodeBranchingContent() {
  return (
    <div>
      <p className="text-foreground-light text-lg mb-8">
        Once your app is live, any follow-up changes—like editing tables or adding new
        features—should ideally be made in a branch. In a no-code workflow, you can create and
        manage branches directly from the Supabase Dashboard, allowing you to safely test and review
        updates before merging them into production. This approach is especially useful for quick
        testing and prototyping without needing a Git repository.
      </p>
      <ol className="prose text-sm">
        <li>
          <h4>Enable Branching 2.0</h4>
          <p>
            Branching 2.0 is currently in public alpha. You can enable it from the Feature Preview
            section in your user menu.
          </p>
        </li>
        <li>
          <h4>Create a new branch</h4>
          <p>
            From the branch selector in the top menu bar of the Dashboard, you can create a new
            preview branch.
          </p>
        </li>
        <li>
          <h4>Make changes to your branch</h4>
          <p>
            Using the branch selector, switch to your new branch. Any changes you make with the
            Table Editor, SQL Editor, or other dashboard tools will only apply to the preview
            branch.
          </p>
        </li>
        <li>
          <h4>Merge changes to production</h4>
          <p>
            When you're ready, create a merge request from the dashboard. This will allow you to
            review your changes and merge them into your production project.
          </p>
        </li>
      </ol>
    </div>
  )
}
