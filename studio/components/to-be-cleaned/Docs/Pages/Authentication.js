import Link from 'next/link'
import Snippets from '../Snippets'
import CodeSnippet from '../CodeSnippet'

export default function Authentication({ autoApiService, selectedLang }) {
  return (
    <>
      <h2 className="doc-heading">Authentication</h2>
      <div className="doc-section">
        <article className="text ">
          <p>Supabase works through a mixture of JWT and Key auth.</p>
          <p>
            If no <code>Authorization</code> header is included, the API will assume that you are
            making a request with an anonymous user.
          </p>
          <p>
            If an <code>Authorization</code> header is included, the API will "switch" to the role
            of the user making the request. See the User Management section for more details.
          </p>
          <p>We recommend setting your keys as Environment Variables.</p>
        </article>
      </div>

      <h2 className="doc-heading">Client API Keys</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>
            Client keys allow "anonymous access" to your database, until the user has logged in.
            After logging in the keys will switch to the user's own login token.
          </p>
          <p>
            In this documentation, we will refer to the key using the name <code>SUPABASE_KEY</code>
            .
          </p>
          <p>
            We have provided you a Client Key to get started. You will soon be able to add as many
            keys as you like. You can find the <code>anon</code> key in the{' '}
            <Link href={`/project/${autoApiService.project.ref}/settings/api`}>
              <a>API Settings</a>
            </Link>{' '}
            page.
          </p>
          <h4 className="mt-8">Realtime Security</h4>
          <p>
            Realtime server broadcasts database changes to authorized users depending on your Row
            Level Security (RLS) policies. We recommend that you enable row level security and set
            row security policies on tables that you add to the publication. However, you may choose
            to disable RLS on a table and have changes broadcast to all connected clients.
          </p>
          <p>
            You can get started by running{' '}
            <code>
              begin; drop publication if exists supabase_realtime; create publication
              supabase_realtime; commit;
            </code>
            . This creates a publication which is not subscribed to any table and completely
            disables Realtime on the Supabase client. Then, you can add any table from your `public`
            schema and changes will be broadcast accordingly.
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authKey(
              'CLIENT API KEY',
              'SUPABASE_KEY',
              autoApiService.defaultApiKey
            )}
          />
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authKeyExample(
              autoApiService.defaultApiKey,
              autoApiService.endpoint,
              { showBearer: false }
            )}
          />
        </article>
      </div>

      <h2 className="doc-heading">Service Keys</h2>
      <div className="doc-section ">
        <article className="text ">
          <p>
            Service keys have FULL access to your data, bypassing any security policies. Be VERY
            careful where you expose these keys. They should only be used on a server and never on a
            client or browser.
          </p>
          <p>
            In this documentation, we will refer to the key using the name <code>SERVICE_KEY</code>.
          </p>
          <p>
            We have provided you with a Service Key to get started. Soon you will be able to add as
            many keys as you like. You can find the <code>service_role</code> in the{' '}
            <Link href={`/project/${autoApiService.project.ref}/settings/api`}>
              <a>API Settings</a>
            </Link>{' '}
            page.
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authKey('SERVICE KEY', 'SERVICE_KEY', autoApiService.serviceApiKey)}
          />
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authKeyExample(
              autoApiService.serviceApiKey,
              autoApiService.endpoint,
              { keyName: 'SERVICE_KEY' }
            )}
          />
        </article>
      </div>
    </>
  )
}
