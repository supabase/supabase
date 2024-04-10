import { useParams } from 'common'
import Link from 'next/link'

import CodeSnippet from 'components/interfaces/Docs/CodeSnippet'
import GeneratingTypes from 'components/interfaces/Docs/GeneratingTypes'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Button } from 'ui'
import { Info } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface IntroductionProps {
  selectedLang: 'bash' | 'js'
}

const Introduction = ({ selectedLang }: IntroductionProps) => {
  const { ref: projectRef } = useParams()
  const { data: config } = useProjectPostgrestConfigQuery({ projectRef })

  const isPublicSchemaEnabled = config?.db_schema
    .split(',')
    .map((name) => name.trim())
    .includes('public')
  console.log({ isPublicSchemaEnabled })
  return (
    <>
      <h2 className="doc-heading">Introduction</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            All views and tables in the <code>public</code> schema and accessible by the active
            database role for a request are available for querying.
          </p>
          <div className="flex">
            {!isPublicSchemaEnabled && (
              <Alert_Shadcn_ variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle_Shadcn_ className="!-mt-3">
                  <ReactMarkdown>The `public` schema is not exposed</ReactMarkdown>
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_ className="flex flex-col gap-3 !-mt-6">
                  <ReactMarkdown>
                    You will not be able to query tables and views in the `public` schema via
                    postgREST or supabase-js.
                  </ReactMarkdown>
                  <div>
                    <Button asChild type="default" className="inline-block">
                      <Link
                        href={`/project/${projectRef}/settings/api#postgrest-config`}
                        className="!no-underline !hover:bg-surface-100 !text-foreground"
                      >
                        View schema settings
                      </Link>
                    </Button>
                  </div>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}
          </div>
        </article>
      </div>

      <h2 className="doc-heading">Non-exposed tables</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            If you don't want to expose tables in your API, simply add them to a different schema
            (not the <code>public</code> schema).
          </p>
        </article>
        <article className="code"></article>
      </div>

      <GeneratingTypes selectedLang={selectedLang} />

      <h2 className="doc-heading">
        GraphQL <span className="lowercase">vs</span> Supabase
      </h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
          <p>
            If you have a GraphQL background, you might be wondering if you can fetch your data in a
            single round-trip. The answer is yes!
          </p>
          <p>
            The syntax is very similar. This example shows how you might achieve the same thing with
            Apollo GraphQL and Supabase.
            <br />
            <br />
          </p>
          <h4>Still want GraphQL?</h4>
          <p>
            If you still want to use GraphQL, you can. Supabase provides you with a full Postgres
            database, so as long as your middleware can connect to the database then you can still
            use the tools you love. You can find the database connection details{' '}
            <Link href={`/project/${projectRef}/settings/database`}>in the settings.</Link>
          </p>
        </article>
        <article className="code">
          <CodeSnippet selectedLang={selectedLang} snippet={localSnippets.withApollo()} />
          <CodeSnippet selectedLang={selectedLang} snippet={localSnippets.withSupabase()} />
        </article>
      </div>
    </>
  )
}

const localSnippets = {
  withApollo: () => ({
    title: 'With Apollo GraphQL',
    bash: {
      language: 'js',
      code: `
const { loading, error, data } = useQuery(gql\`
  query GetDogs {
    dogs {
      id
      breed
      owner {
        id
        name
      }
    }
  }
\`)`,
    },
    js: {
      language: 'js',
      code: `
const { loading, error, data } = useQuery(gql\`
  query GetDogs {
    dogs {
      id
      breed
      owner {
        id
        name
      }
    }
  }
\`)`,
    },
  }),
  withSupabase: () => ({
    title: 'With Supabase',
    bash: {
      language: 'js',
      code: `
const { data, error } = await supabase
  .from('dogs')
  .select(\`
      id, breed,
      owner (id, name)
  \`)
`,
    },
    js: {
      language: 'js',
      code: `
const { data, error } = await supabase
  .from('dogs')
  .select(\`
      id, breed,
      owner (id, name)
  \`)
`,
    },
  }),
}

export default Introduction
