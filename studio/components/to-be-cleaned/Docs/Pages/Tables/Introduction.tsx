import { FC, useState } from 'react'
import Link from 'next/link'
import { Button, IconDownload, IconExternalLink } from 'ui'
import { useParams, useStore } from 'hooks'
import { API_ADMIN_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import CodeSnippet from '../../CodeSnippet'

interface Props {
  selectedLang: string
}

const Introduction: FC<Props> = ({ selectedLang }) => {
  const { ref } = useParams()
  const { ui } = useStore()
  const [isGeneratingTypes, setIsGeneratingTypes] = useState(false)

  const generateTypes = async () => {
    setIsGeneratingTypes(true)
    const res = await get(`${API_ADMIN_URL}/projects/${ref}/types/typescript`)

    if (!res.error) {
      let element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(res.types))
      element.setAttribute('download', 'supabase.ts')
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      ui.setNotification({
        category: 'success',
        message: `Successfully generated types! File is being downloaded`,
      })
    } else {
      ui.setNotification({
        category: 'error',
        message: `Failed to generate types: ${res.error.message}`,
        error: res.error,
      })
    }

    setIsGeneratingTypes(false)
  }

  return (
    <>
      <h2 className="doc-heading">Introduction</h2>
      <div className="doc-section">
        <article className="text ">
          <p>
            All views and tables in the <code>public</code> schema and accessible by the active
            database role for a request are available for querying.
          </p>
        </article>
      </div>

      <h2 className="doc-heading">Non-exposed tables</h2>
      <div className="doc-section">
        <article className="text ">
          <p>
            If you don't want to expose tables in your API, simply add them to a different schema
            (not the <code>public</code> schema).
          </p>
        </article>
        <article className="code"></article>
      </div>

      <h2 className="doc-heading flex items-center justify-between">
        <span>Generating types</span>
        <Link href="https://supabase.com/docs/guides/api/generating-types">
          <a target="_blank">
            <Button type="default" icon={<IconExternalLink />}>
              Documentation
            </Button>
          </a>
        </Link>
      </h2>
      <div className="doc-section">
        <article className="text ">
          <p>
            Supabase APIs are generated from your database, which means that we can use database
            introspection to generate type-safe API definitions.
          </p>
          <p>
            You can generate types from your database either through the{' '}
            <Link href="https://supabase.com/docs/guides/api/generating-types">Supabase CLI</Link>,
            or by downloading the types file via the button on the right and importing it in your
            application within <code>src/index.ts</code>.
          </p>
        </article>
        <article className={`code ${selectedLang === 'js' ? 'flex items-center' : ''}`}>
          {selectedLang === 'js' && (
            <Button
              type="default"
              disabled={isGeneratingTypes}
              loading={isGeneratingTypes}
              icon={<IconDownload strokeWidth={1.5} />}
              onClick={generateTypes}
            >
              Generate and download types
            </Button>
          )}
          <CodeSnippet selectedLang={selectedLang} snippet={localSnippets.cliLogin()} />
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={localSnippets.generateTypes(ref ?? '')}
          />
        </article>
      </div>

      <h2 className="doc-heading">
        GraphQL <span className="lowercase">vs</span> Supabase
      </h2>
      <div className="doc-section">
        <article className="text ">
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
            <Link href={`/project/${ref}/settings/database`}>in the settings.</Link>
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
  cliLogin: () => ({
    title: 'Login via the CLI with your Personal Access Token',
    bash: {
      code: `
npx supabase login
`,
    },
  }),
  generateTypes: (ref: string) => ({
    title: 'Generate types',
    bash: {
      code: `
npx supabase gen types typescript --project-id "${ref}" --schema public > types/supabase.ts
`,
    },
  }),
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
