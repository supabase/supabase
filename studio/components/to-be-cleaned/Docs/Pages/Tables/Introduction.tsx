import { useParams } from 'common'
import Link from 'next/link'

import GeneratingTypes from 'components/interfaces/Docs/GeneratingTypes'
import CodeSnippet from '../../CodeSnippet'

interface IntroductionProps {
  selectedLang: string
}

const Introduction = ({ selectedLang }: IntroductionProps) => {
  const { ref } = useParams()

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

      <GeneratingTypes selectedLang={selectedLang} />

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
