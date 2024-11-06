import Link from 'next/link'

import { useParams } from 'common'
import { getAPIKeys, useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import CodeSnippet from './CodeSnippet'
import Snippets from './Snippets'

interface AuthenticationProps {
  selectedLang: 'bash' | 'js'
  showApiKey: string
}

const Authentication = ({ selectedLang, showApiKey }: AuthenticationProps) => {
  const { ref: projectRef } = useParams()
  const { data: settings } = useProjectSettingsV2Query({ projectRef })

  const { anonKey, serviceKey } = getAPIKeys(settings)
  const protocol = settings?.app_config?.protocol ?? 'https'
  const hostEndpoint = settings?.app_config?.endpoint
  const endpoint = `${protocol}://${hostEndpoint ?? ''}`

  // [Joshen] ShowApiKey should really be a boolean, its confusing
  const defaultApiKey =
    showApiKey !== 'SUPABASE_KEY'
      ? anonKey?.api_key ?? 'SUPABASE_CLIENT_API_KEY'
      : 'SUPABASE_CLIENT_API_KEY'
  const serviceApiKey =
    showApiKey !== 'SUPABASE_KEY'
      ? serviceKey?.api_key ?? 'SUPABASE_SERVICE_KEY'
      : 'SUPABASE_SERVICE_KEY'

  return (
    <>
      <h2 className="doc-heading">Authentication</h2>
      <div className="doc-section">
        <article className="code-column text-foreground">
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
        <article className="code-column text-foreground">
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
            <Link href={`/project/${projectRef}/settings/api`}>API Settings</Link> page.
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authKey('CLIENT API KEY', 'SUPABASE_KEY', defaultApiKey)}
          />
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authKeyExample(defaultApiKey, endpoint, {
              showBearer: false,
            })}
          />
        </article>
      </div>

      <h2 className="doc-heading">Service Keys</h2>
      <div className="doc-section ">
        <article className="code-column text-foreground">
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
            <Link href={`/project/${projectRef}/settings/api`}>API Settings</Link> page.
          </p>
        </article>
        <article className="code">
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authKey('SERVICE KEY', 'SERVICE_KEY', serviceApiKey)}
          />
          <CodeSnippet
            selectedLang={selectedLang}
            snippet={Snippets.authKeyExample(serviceApiKey, endpoint, { keyName: 'SERVICE_KEY' })}
          />
        </article>
      </div>
    </>
  )
}

export default Authentication
