export const DOCS_MENU = [
  { name: 'Connect', key: 'introduction' },
  { name: 'User Management', key: 'user-management' },
  { name: 'Tables & Views', key: 'entities' },
  { name: 'Stored Procedures', key: 'stored-procedures' },
  { name: 'Storage', key: 'storage' },
  { name: 'Edge Functions', key: 'edge-functions' },
  { name: 'Realtime', key: 'realtime' },
]

export const DOCS_CONTENT = {
  init: {
    key: 'introduction',
    category: 'introduction',
    title: `Connect to your project`,
    description: `Projects have a RESTful endpoint that you can use with your project's API key to query and manage your database. Put these keys in your .env file.`,
    js: (apikey?: string, endpoint?: string) => `
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${endpoint}'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)`,
    bash: () => `# No client library required for Bash.`,
  },
  clientApiKeys: {
    key: 'client-api-keys',
    category: 'introduction',
    title: `Client API Keys`,
    description: `Client keys allow "anonymous access" to your database, until the user has logged in. After logging in, the keys will switch to the user's own login token.

In this documentation, we will refer to the key using the name \`SUPABASE_KEY\`. You can find the \`anon\` key in the [API settings](/project/[ref]/settings/api) page.`,
    js: (apikey?: string, endpoint?: string) => `
const SUPABASE_KEY = '${apikey}'
const SUPABASE_URL = '${endpoint}'
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_KEY);`,
    bash: (apikey?: string, endpoint?: string) => `${apikey}`,
  },
  serviceApiKeys: {
    key: 'service-keys',
    category: 'introduction',
    title: `Service Keys`,
    description: `Service keys have *FULL* access to your data, bypassing any security policies. Be VERY careful where you expose these keys. They should only be used on a server and never on a client or browser.

In this documentation, we refer to the key using the name \`SERVICE_KEY\`. You can find the \`service_role\` key above or in the [API settings](/project/[ref]/settings/api) page.`,
    js: (apikey?: string, endpoint?: string) => `
const SUPABASE_KEY = '${apikey}'
const SUPABASE_URL = 'https://${endpoint}'
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_KEY);`,
    bash: (apikey?: string, endpoint?: string) => `${apikey}`,
  },
  // User Management
  userManagement: {
    key: 'user-management',
    category: 'user-management',
    title: `Introduction`,
    description: `Supabase makes it easy to manage your users.

  Supabase assigns each user a unique ID. You can reference this ID anywhere in your database. For example, you might create a \`profiles\` table references the user using a \`user_id\` field.

  Supabase already has built in the routes to sign up, login, and log out for managing users in your apps and websites.`,
    js: undefined,
    bash: undefined,
  },
  signUp: {
    key: 'sign-up',
    category: 'user-management',
    title: `Sign up`,
    description: `Allow your users to sign up and create a new account

  After they have signed up, all interactions using the Supabase client will be performed as "that user".`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.signUp({
  email: 'someone@email.com',
  password: 'some-secure-password'
})`,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/signup' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com",
  "password": "some-secure-password"
}'`,
  },
  emailLogin: {
    key: 'email-login',
    category: 'user-management',
    title: `Log in with Email/Password`,
    description: `
If an account is created, users can login to your app.

After they have logged in, all interactions using the Supabase JS client will be performed as "that user".`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'someone@email.com',
  password: 'some-secure-password'
})
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/token?grant_type=password' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com",
  "password": "some-secure-password"
}'
    `,
  },
  magicLinkLogin: {
    key: 'magic-link-login',
    category: 'user-management',
    title: `Log in with Magic Link via Email`,
    description: `
Send a user a passwordless link which they can use to redeem an access_token.

After they have clicked the link, all interactions using the Supabase JS client will be performed as "that user".`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'someone@email.com'
})
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/magiclink' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com"
}'
    `,
  },
  phoneLogin: {
    key: 'phone-log-in',
    category: 'user-management',
    title: `Sign up with Phone/Password`,
    description: `
A phone number can be used instead of an email as a primary account confirmation mechanism.

The user will receive a mobile OTP via sms with which they can verify that they control the phone number.

You must enter your own twilio credentials on the auth settings page to enable sms confirmations.`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.signUp({
  phone: '+13334445555',
  password: 'some-password'
})
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/signup' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "phone": "+13334445555",
  "password": "some-password"
}'
    `,
  },
  smsLogin: {
    key: 'sms-otp-log-in',
    category: 'user-management',
    title: `Login via SMS OTP`,
    description: `
SMS OTPs work like magic links, except you have to provide an interface for the user to verify the 6 digit number they receive.

You must enter your own twilio credentials on the auth settings page to enable SMS-based Logins.`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+13334445555'
})
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/otp' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "phone": "+13334445555"
}'
    `,
  },
  smsVerify: {
    key: 'sms-verify',
    category: 'user-management',
    title: `Verify an SMS OTP`,
    description: `
Once the user has received the OTP, have them enter it in a form and send it for verification

You must enter your own twilio credentials on the auth settings page to enable SMS-based OTP verification.`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+13334445555',
  token: '123456',
  type: 'sms'
})
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/verify' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "type": "sms",
  "phone": "+13334445555",
  "token": "123456"
}'
    `,
  },
  oauthLogin: {
    key: 'oauth-login',
    category: 'user-management',
    title: `Log in with Third Party OAuth`,
    description: `
Users can log in with Third Party OAuth like Google, Facebook, GitHub, and more. You must first enable each of these in the Auth Providers settings [here](https://supabase.com).

View all the available [Third Party OAuth providers](https://supabase.com).

After they have logged in, all interactions using the Supabase JS client will be performed as "that user".

Generate your Client ID and secret from: [Google](https://console.developers.google.com/apis/credentials), [Github](https://github.com/settings/applications/new), [Gitlab](https://gitlab.com/oauth/applications), [Facebook](https://developers.facebook.com/apps), and [Bitbucket](https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud).`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github'
})
    `,
    bash: (apikey?: string, endpoint?: string) => `No available command`,
  },
  user: {
    key: 'get-user',
    category: 'user-management',
    title: `Get user`,
    description: `Get the JSON object for the logged in user.`,
    js: (apikey?: string, endpoint?: string) => `
const { data: { user } } = await supabase.auth.getUser()
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X GET '${endpoint}/auth/v1/user' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer USER_TOKEN"
    `,
  },
  forgotPassWordEmail: {
    key: 'forgot-password-email',
    category: 'user-management',
    title: `Forgot password / email`,
    description: `Sends the user a log in link via email. Once logged in you should direct the user to a new password form. And use "Update User" below to save the new password.`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.resetPasswordForEmail(email)
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/recover' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
"email": "someone@email.com"
}'
`,
  },
  updateUser: {
    key: 'update-user',
    category: 'user-management',
    title: `Update User`,
    description: `Update the user with a new email or password. Each key (email, password, and data) is optional.`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.updateUser({
  email: "new@email.com",
  password: "new-password",
  data: { hello: 'world' }
})
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X PUT '${endpoint}/auth/v1/user' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer <USERS-ACCESS-TOKEN>" \\
-H "Content-Type: application/json" \\
-d '{
"email": "someone@email.com",
"password": "new-password",
"data": {
  "key": "value"
}
}'
`,
  },
  logout: {
    key: 'log-out',
    category: 'user-management',
    title: `Log out`,
    description: `After calling log out, all interactions using the Supabase JS client will be "anonymous".`,
    js: (apikey?: string, endpoint?: string) => `
const { error } = await supabase.auth.signOut()
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/logout' \\
-H "apikey: ${apikey}" \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer USER_TOKEN"
    `,
  },
  emailInvite: {
    key: 'email-invite',
    category: 'user-management',
    title: `Invite user over email`,
    description: `
Send a user a passwordless link which they can use to sign up and log in.

After they have clicked the link, all interactions using the Supabase JS client will be performed as "that user".

This endpoint requires you use the \`service_role_key\` when initializing the client, and should only be invoked from the server, never from the client.`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.auth.api.inviteUserByEmail('someone@email.com')
    `,
    bash: (apikey?: string, endpoint?: string) => `
curl -X POST '${endpoint}/auth/v1/invite' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com"
}'
    `,
  },
  // Storage
  storage: {
    key: 'storage',
    category: 'storage',
    title: `Introduction`,
    description: `Supabase Storage makes it simple to upload and serve files of any size, providing a robust framework for file access controls.

You can use Supabase Storage to store images, videos, documents, and any other file type. Serve your assets with a global CDN to reduce latency from over 285 cities globally. Supabase Storage includes a built-in image optimizer, so you can resize and compress your media files on the fly.`,
    js: undefined,
    bash: undefined,
  },
  // Edge functions
  edgeFunctions: {
    key: 'edge-function',
    category: 'edge-functions',
    title: 'Introduction',
    description: `
Edge Functions are server-side TypeScript functions, distributed globally at the edge—close to your users. They can be used for listening to webhooks or integrating your Supabase project with third-parties like Stripe. Edge Functions are developed using Deno, which offers a few benefits to you as a developer:
`,
    js: undefined,
    bash: undefined,
  },
  edgeFunctionsPreReq: {
    key: 'edge-function-pre-req',
    category: 'edge-functions',
    title: 'Pre-requisites',
    description: `
Follow the steps to prepare your Supabase project on your local machine.

- Install the Supabase [CLI](https://supabase.com/docs/guides/cli).
- [Login to the CLI](https://supabase.com/docs/reference/cli/usage#supabase-login) using the command: \`supabase login\`..
- [Initialize Supabase](https://supabase.com/docs/guides/getting-started/local-development#getting-started) inside your project using the command: \`supabase init\`..
- [Link to your Remote Project](https://supabase.com/docs/reference/cli/usage#supabase-link) using the command \`supabase link --project-ref [ref]\`..
- Setup your environment: Follow the steps [here](https://supabase.com/docs/guides/functions/quickstart#setting-up-your-environment).
`,
    js: undefined,
    bash: undefined,
  },
  createEdgeFunction: {
    key: 'create-edge-function',
    category: 'edge-functions',
    title: 'Create an Edge Function',
    description: `
Create a Supabase Edge Function locally via the Supabase CLI.
`,
    js: () => `// Create an edge function via the Supabase CLI`,
    bash: () => `
supabase functions new hello-world
`,
  },
  deployEdgeFunction: {
    key: 'deploy-edge-function',
    category: 'edge-functions',
    title: 'Deploy an Edge Function',
    description: `
Deploy a Supabase Edge Function to your Supabase project via the Supabase CLI.
`,
    js: () => `// Deploy an edge function via the Supabase CLI`,
    bash: () => `supabase functions deploy hello-world --project-ref [ref]
`,
  },
  // Entities
  entitiesIntroduction: {
    key: 'entities-introduction',
    category: 'entities',
    title: 'Introduction',
    description: `
All views and tables in the \`public\` schema, and those accessible by the active database role for a request are available for querying via the API.

If you don't want to expose tables in your API, simply add them to a different schema (not the \`public\` schema).
`,
    js: undefined,
    bash: undefined,
  },
  generatingTypes: {
    key: 'generating-types',
    category: 'entities',
    title: 'Generating Types',
    description: `
Supabase APIs are generated from your database, which means that we can use database introspection to generate type-safe API definitions.

You can generate types from your database either through the [Supabase CLI](https://supabase.com/docs/guides/database/api/generating-types), or by downloading the types file via the button on the right and importing it in your application within \`src/index.ts\`.
`,
    js: undefined,
    bash: undefined,
  },
  graphql: {
    key: 'graphql',
    category: 'entities',
    title: 'GraphQL vs PostgREST',
    description: `
If you have a GraphQL background, you might be wondering if you can fetch your data in a single round-trip. The answer is yes! The syntax is very similar. This example shows how you might achieve the same thing with Apollo GraphQL and Supabase.

Still want GraphQL?
If you still want to use GraphQL, you can. Supabase provides you with a full Postgres database, so as long as your middleware can connect to the database then you can still use the tools you love. You can find the database connection details [in the settings](/project/[ref]/database/settings).
`,
    js: (apikey?: string, endpoint?: string) => `
// With Apollo GraphQL
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
    \`)

// With Supabase
const { data, error } = await supabase
  .from('dogs')
  .select(\`
      id, breed,
      owner (id, name)
  \`)
`,
    bash: (apikey?: string, endpoint?: string) => `
// With Apollo GraphQL
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
    \`)

// With Supabase
const { data, error } = await supabase
  .from('dogs')
  .select(\`
      id, breed,
      owner (id, name)
  \`)
    `,
  },
  // Stored Procedures
  storedProceduresIntroduction: {
    key: 'stored-procedures-introduction',
    category: 'stored-procedures',
    title: 'Introduction',
    description: `
All of your database stored procedures are available on your API. This means you can build your logic directly into the database (if you're brave enough)!

The API endpoint supports POST (and in some cases GET) to execute the function.
`,
    js: undefined,
    bash: undefined,
  },
  // Realtime
  realtime: {
    key: 'realtime-introduction',
    category: 'realtime',
    title: 'Introduction',
    description: `
Supabase provides a globally distributed cluster of Realtime servers that enable the following functionality:

- [Broadcast](https://supabase.com/docs/guides/realtime/broadcast): Send ephemeral messages from client to clients with low latency.
- [Presence](https://supabase.com/docs/guides/realtime/presence): Track and synchronize shared state between clients.
- [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes): Listen to Postgres database changes and send them to authorized clients.
`,
    js: undefined,
    bash: undefined,
  },
  subscribeChannel: {
    key: 'subscribe-to-channel',
    category: 'realtime',
    title: 'Subscribe to channel',
    description: `
Creates an event handler that listens to changes.

- By default, Broadcast and Presence are enabled for all projects.
- By default, listening to database changes is disabled for new projects due to database performance and security concerns. You can turn it on by managing Realtime's [replication](https://supabase.com/docs/guides/api#realtime-api-overview).
- You can receive the "previous" data for updates and deletes by setting the table's \`REPLICA IDENTITY\` to \`FULL\` (e.g., \`ALTER TABLE your_table REPLICA IDENTITY FULL;\`).
- Row level security is not applied to delete statements. When RLS is enabled and replica identity is set to full, only the primary key is sent to clients.
`,
    js: () => `
supabase
  .channel('any')
  .on('broadcast', { event: 'cursor-pos' }, payload => {
    console.log('Cursor position received!', payload)
  })
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({
        type: 'broadcast',
        event: 'cursor-pos',
        payload: { x: Math.random(), y: Math.random() },
      })
    }
  })
    `,
    bash: () => `# Realtime streams are only supported by our client libraries`,
  },
  unsubscribeChannel: {
    key: 'unsubscribe-channel',
    category: 'realtime',
    title: 'Unsubscribe from a channel',
    description: `
Unsubscribes and removes Realtime channel from Realtime client.

Removing a channel is a great way to maintain the performance of your project's Realtime service as well as your database if you're listening to Postgres changes. Supabase will automatically handle cleanup 30 seconds after a client is disconnected, but unused channels may cause degradation as more clients are simultaneously subscribed.
`,
    js: () => `supabase.removeChannel(myChannel)`,
    bash: () => `# Realtime streams are only supported by our client libraries`,
  },
  unsubscribeChannels: {
    key: 'unsubscribe-channels',
    category: 'realtime',
    title: 'Unsubscribe from all channels',
    description: `
Unsubscribes and removes all Realtime channels from Realtime client.

Removing a channel is a great way to maintain the performance of your project's Realtime service as well as your database if you're listening to Postgres changes. Supabase will automatically handle cleanup 30 seconds after a client is disconnected, but unused channels may cause degradation as more clients are simultaneously subscribed.
`,
    js: () => `supabase.removeChannels()`,
    bash: () => `# Realtime streams are only supported by our client libraries`,
  },
  retrieveAllChannels: {
    key: 'unsubscribe-channel',
    category: 'realtime',
    title: 'Unsubscribe from a channel',
    description: `
Returns all Realtime channels.
`,
    js: () => `const channels = supabase.getChannels()`,
    bash: () => `# Realtime streams are only supported by our client libraries`,
  },
}

export const DOCS_RESOURCE_CONTENT: {
  [key: string]: {
    key: string
    title: string
    category: string
    description?: string
    docsUrl: string
    code: (props: any) => { key: string; title?: string; bash: string; js: string }[]
  }
} = {
  rpcSingle: {
    key: 'invoke-function',
    title: 'Invoke function',
    category: 'stored-procedures',
    description: undefined,
    docsUrl: 'https://supabase.com/docs/reference/javascript/rpc',
    code: ({
      rpcName,
      rpcParams,
      endpoint,
      apiKey,
      showBearer = true,
    }: {
      rpcName: string
      rpcParams: any[]
      endpoint: string
      apiKey: string
      showBearer: boolean
    }) => {
      let rpcList = rpcParams.map((x) => `"${x.name}": "value"`).join(', ')
      let noParams = !rpcParams.length
      let bashParams = noParams ? '' : `\n-d '{ ${rpcList} }' \\`
      let jsParams = noParams
        ? ''
        : `, {${
            rpcParams.length
              ? rpcParams
                  .map((x) => `\n    ${x.name}`)
                  .join(`, `)
                  .concat('\n  ')
              : ''
          }}`
      return [
        {
          key: 'rpc-single',
          title: undefined,
          bash: `
  curl -X POST '${endpoint}/rest/v1/rpc/${rpcName}' \\${bashParams}
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey}" ${
    showBearer
      ? `\\
  -H "Authorization: Bearer ${apiKey}"`
      : ''
  }
        `,
          js: `
let { data, error } = await supabase
  .rpc('${rpcName}'${jsParams})

if (error) console.error(error)
else console.log(data)
        `,
        },
      ]
    },
  },
  readRows: {
    key: 'read-rows',
    title: `Read rows`,
    category: 'entities',
    docsUrl: 'https://supabase.com/docs/reference/javascript/select',
    description: `To read rows in this table, use the \`select\` method.`,
    code: ({
      resourceId,
      endpoint,
      apikey,
    }: {
      resourceId: string
      endpoint: string
      apikey: string
    }) => {
      return [
        {
          key: 'read-all-rows',
          title: 'Read all rows',
          bash: `
curl '${endpoint}/rest/v1/${resourceId}?select=*' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}"
          `,
          js: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select('*')
          `,
        },
        {
          key: 'read-specific-columns',
          title: 'Read specific columns',
          bash: `
curl '${endpoint}/rest/v1/${resourceId}?select=some_column,other_column' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}"
          `,
          js: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select('some_column,other_column')
  `,
        },
        {
          key: 'read-foreign-tables',
          title: 'Read referenced tables',
          bash: `
curl '${endpoint}/rest/v1/${resourceId}?select=some_column,other_table(foreign_key)' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}"
          `,
          js: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select(\`
    some_column,
    other_table (
      foreign_key
    )
  \`)
          `,
        },
        {
          key: 'with-pagination',
          title: 'With pagination',
          bash: `
curl '${endpoint}/rest/v1/${resourceId}?select=*' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Range: 0-9"
          `,
          js: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select('*')
  .range(0, 9)
          `,
        },
      ]
    },
  },
  filtering: {
    key: 'filter-rows',
    category: 'entities',
    title: 'Filtering',
    description: `Supabase provides a wide range of filters`,
    docsUrl: 'https://supabase.com/docs/reference/javascript/using-filters',
    code: ({
      resourceId,
      endpoint,
      apikey,
    }: {
      resourceId: string
      endpoint: string
      apikey: string
    }) => {
      return [
        {
          key: 'with-filtering',
          title: 'With filtering',
          bash: `
curl --get '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Range: 0-9" \\
-d "select=*" \\
\\
\`# Filters\` \\
-d "column=eq.Equal+to" \\
-d "column=gt.Greater+than" \\
-d "column=lt.Less+than" \\
-d "column=gte.Greater+than+or+equal+to" \\
-d "column=lte.Less+than+or+equal+to" \\
-d "column=like.*CaseSensitive*" \\
-d "column=ilike.*CaseInsensitive*" \\
-d "column=is.null" \\
-d "column=in.(Array,Values)" \\
-d "column=neq.Not+equal+to" \\
\\
\`# Arrays\` \\
-d "array_column=cs.{array,contains}" \\
-d "array_column=cd.{contained,by}" \\
\\
\`# Logical operators\` \\
-d "column=not.like.Negate+filter" \\
-d "or=(some_column.eq.Some+value,other_column.eq.Other+value)"
        `,
          js: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select("*")

  // Filters
  .eq('column', 'Equal to')
  .gt('column', 'Greater than')
  .lt('column', 'Less than')
  .gte('column', 'Greater than or equal to')
  .lte('column', 'Less than or equal to')
  .like('column', '%CaseSensitive%')
  .ilike('column', '%CaseInsensitive%')
  .is('column', null)
  .in('column', ['Array', 'Values'])
  .neq('column', 'Not equal to')

  // Arrays
  .contains('array_column', ['array', 'contains'])
  .containedBy('array_column', ['contained', 'by'])

  // Logical operators
  .not('column', 'like', 'Negate filter')
  .or('some_column.eq.Some value, other_column.eq.Other value')
          `,
        },
      ]
    },
  },
  insertRows: {
    key: 'insert-rows',
    category: 'entities',
    title: 'Insert rows',
    description: `
\`insert\` lets you insert into your tables. You can also insert in bulk and do UPSERT.

\`insert\` will also return the replaced values for UPSERT.
`,
    docsUrl: 'https://supabase.com/docs/reference/javascript/insert',
    code: ({
      resourceId,
      endpoint,
      apikey,
    }: {
      resourceId: string
      endpoint: string
      apikey: string
    }) => {
      return [
        {
          key: 'insert-a-row',
          title: 'Insert a row',
          bash: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Content-Type: application/json" \\
-H "Prefer: return=minimal" \\
-d '{ "some_column": "someValue", "other_column": "otherValue" }'
          `,
          js: `
const { data, error } = await supabase
  .from('${resourceId}')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
          `,
        },
        {
          key: 'insert-many-rows',
          title: 'Insert many rows',
          bash: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Content-Type: application/json" \\
-d '[{ "some_column": "someValue" }, { "other_column": "otherValue" }]'
          `,
          js: `
const { data, error } = await supabase
  .from('${resourceId}')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
          `,
        },
        {
          key: 'upsert-matching-rows',
          title: 'Upsert matching rows',
          bash: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Content-Type: application/json" \\
-H "Prefer: resolution=merge-duplicates" \\
-d '{ "some_column": "someValue", "other_column": "otherValue" }'
          `,
          js: `
const { data, error } = await supabase
  .from('${resourceId}')
  .upsert({ some_column: 'someValue' })
  .select()
          `,
        },
      ]
    },
  },
  updateRows: {
    key: 'update-rows',
    category: 'entities',
    title: 'Update rows',
    description: `
\`update\` lets you update rows. \`update\` will match all rows by default. You can update specific rows using horizontal filters, e.g. \`eq\`, \`lt\`, and \`is\`.

\`update\` will also return the replaced values for UPDATE.
`,
    docsUrl: 'https://supabase.com/docs/reference/javascript/update',
    code: ({
      resourceId,
      endpoint,
      apikey,
    }: {
      resourceId: string
      endpoint: string
      apikey: string
    }) => {
      return [
        {
          key: 'update-matching-rows',
          title: 'Update matching rows',
          bash: `
curl -X PATCH '${endpoint}/rest/v1/${resourceId}?some_column=eq.someValue' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}" \\
-H "Content-Type: application/json" \\
-H "Prefer: return=minimal" \\
-d '{ "other_column": "otherValue" }'
          `,
          js: `
const { data, error } = await supabase
  .from('${resourceId}')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
          `,
        },
      ]
    },
  },
  deleteRows: {
    key: 'delete-rows',
    category: 'entities',
    title: 'Delete rows',
    description: `
\`delete\` lets you delete rows. \`delete\` will match all rows by default, so remember to specify your filters!
`,
    docsUrl: 'https://supabase.com/docs/reference/javascript/delete',
    code: ({
      resourceId,
      endpoint,
      apikey,
    }: {
      resourceId: string
      endpoint: string
      apikey: string
    }) => {
      return [
        {
          key: 'delete-matching-rows',
          title: 'Delete matching rows',
          bash: `
curl -X DELETE '${endpoint}/rest/v1/${resourceId}?some_column=eq.someValue' \\
-H "apikey: ${apikey}" \\
-H "Authorization: Bearer ${apikey}"
          `,
          js: `
const { error } = await supabase
  .from('${resourceId}')
  .delete()
  .eq('some_column', 'someValue')
          `,
        },
      ]
    },
  },
  subscribeChanges: {
    key: 'subscribe-changes',
    category: 'entities',
    title: 'Subscribe to changes',
    description: `
Supabase provides realtime functionality and broadcasts database changes to authorized users depending on Row Level Security (RLS) policies.
`,
    docsUrl: 'https://supabase.com/docs/reference/javascript/subscribe',
    code: ({ resourceId }: { resourceId: string }) => {
      return [
        {
          key: 'subscribe-all-events',
          title: 'Subscribe to all events',
          bash: `# Realtime streams are only supported by our client libraries`,
          js: `
const channels = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
        },
        {
          key: 'subscribe-to-inserts',
          title: 'Subscribe to inserts',
          bash: `# Realtime streams are only supported by our client libraries`,
          js: `
const channels = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
        },
        {
          key: 'subscribe-to-updates',
          title: 'Subscribe to updates',
          bash: `# Realtime streams are only supported by our client libraries`,
          js: `
const channels = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
        },
        {
          key: 'subscribe-to-deletes',
          title: 'Subscribe to deletes',
          bash: `# Realtime streams are only supported by our client libraries`,
          js: `
const channels = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
        },
        {
          key: 'subscribe-to-specific-rows',
          title: 'Subscribe to specific rows',
          bash: `# Realtime streams are only supported by our client libraries`,
          js: `
const channels = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: '${resourceId}', filter: 'some_column=eq.some_value' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
        },
      ]
    },
  },
  uploadFile: {
    key: 'upload-file',
    category: 'storage',
    title: 'Upload a file',
    docsUrl: 'https://supabase.com/docs/reference/javascript/storage-from-upload',
    description: `
Upload a file to an existing bucket. RLS policy permissions required:
- \`buckets\` table permissions: none
- \`objects\` table permissions: only \`insert\` when you are uploading new files and \`select\`, \`insert\`, and \`update\` when you are upserting files.
`,
    code: ({ name, apikey, endpoint }: { name: string; apikey: string; endpoint: string }) => [
      {
        key: 'storage-upload-file',
        title: undefined,
        bash: `
curl -X POST '${endpoint}/storage/v1/object/${name}/folder/avatar1.png' \\
-H 'Content-Type: image/png' \\
-H "Authorization: Bearer ${apikey}" \\
--data-binary @/path/to/your/file'
-H 'Content-Type: multipart/form-data' \\
-H "Authorization: Bearer ${apikey}" \\
--data-raw $'your_file_data'
        `,
        js: `
const avatarFile = event.target.files[0]
const { data, error } = await supabase
  .storage
  .from('${name}')
  .upload('folder/avatar1.png', avatarFile, {
    cacheControl: '3600',
    upsert: false
  })
`,
      },
    ],
  },
  deleteFiles: {
    key: 'delete-files',
    category: 'storage',
    title: 'Delete files',
    docsUrl: 'https://supabase.com/docs/reference/javascript/storage-from-remove',
    description: `
Delete files within the bucket. RLS policy permissions required:
- \`buckets\` table permissions: none
- \`objects\` table permissions: \`delete\` and \`select\`
`,
    code: ({ name, apikey, endpoint }: { name: string; apikey: string; endpoint: string }) => [
      {
        key: 'storage-delete-files',
        title: undefined,
        bash: `
curl -X DELETE '${endpoint}/storage/v1/object/${name}' \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${apikey}" \\
-d '{ "prefixes": ["file_name", "another_file_name"] }'
`,
        js: `
const { data, error } = await supabase
  .storage
  .from('${name}')
  .remove(['folder/avatar1.png'])
        `,
      },
    ],
  },
  listFiles: {
    key: 'list-files',
    category: 'storage',
    title: 'List all files',
    docsUrl: 'https://supabase.com/docs/reference/javascript/storage-from-list',
    description: `
List all files within the bucket. RLS policy permissions required:
- \`buckets\` table permissions: none
- \`objects\` table permissions: \`select\`
`,
    code: ({ name, apikey, endpoint }: { name: string; apikey: string; endpoint: string }) => [
      {
        key: 'storage-list-files',
        title: undefined,
        bash: `
curl -X POST '${endpoint}/storage/v1/object/list/${name}' \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${apikey}" \\
-d '{ "limit": 100, "offset": 0, "prefix": "", "sortBy": { "column": "name", "order": "asc" } }'`,
        js: `
const { data, error } = await supabase
  .storage
  .from('${name}')
  .list('folder', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  })
        `,
      },
    ],
  },
  downloadFile: {
    key: 'download-file',
    category: 'storage',
    title: 'Download a file',
    docsUrl: 'https://supabase.com/docs/reference/javascript/storage-from-download',
    description: `
Downloads a file from a private bucket. For public buckets, make a request to the URL returned from getPublicUrl instead. RLS policy permissions required:
- \`buckets\` table permissions: none
- \`objects\` table permissions: \`select\`
`,
    code: ({ name, apikey, endpoint }: { name: string; apikey: string; endpoint: string }) => [
      {
        key: 'storage-download-file',
        title: undefined,
        bash: `
curl -X GET '${endpoint}/storage/v1/object/${name}/folder/avatar1.png' \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${apikey}" \\
--output avatar1.png
`,
        js: `
const { data, error } = await supabase
  .storage
  .from('${name}')
  .download('folder/avatar1.png')
      `,
      },
    ],
  },
  createSignedURL: {
    key: 'create-signed-url',
    category: 'storage',
    title: 'Create a signed URL',
    docsUrl: 'https://supabase.com/docs/reference/javascript/storage-from-createsignedurl',
    description: `
Create a signed URL which can be used to share a file for a fixed amount of time. RLS policy permissions required:
- \`buckets\` table permissions: none
- \`objects\` table permissions: \`select\`
`,
    code: ({ name, apikey, endpoint }: { name: string; apikey: string; endpoint: string }) => [
      {
        key: 'storage-create-signed-url',
        title: undefined,
        bash: `
curl -X POST '${endpoint}/storage/v1/object/sign/${name}/folder/avatar1.png' \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer ${apikey}" \\
-d '{ "expiresIn": 60 }'
        `,
        js: `
const { data, error } = await supabase
  .storage
  .from('${name}')
  .createSignedUrl('folder/avatar1.png', 60)
        `,
      },
    ],
  },
  retrievePublicURL: {
    key: 'retrieve-public-url',
    category: 'storage',
    title: 'Retrieve public URL',
    docsUrl: 'https://supabase.com/docs/reference/javascript/storage-from-getpublicurl',
    description: `
A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.

This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.

The bucket needs to be set to public, either via \`updateBucket()\` or by going to Storage on supabase.com/dashboard, clicking the overflow menu on a bucket and choosing "Make public"

RLS policy permissions required:
- \`buckets\` table permissions: none
- \`objects\` table permissions: none
`,
    code: ({ name, apikey, endpoint }: { name: string; apikey: string; endpoint: string }) => [
      {
        key: 'storage-retrieve-public-url',
        title: undefined,
        bash: `
# No bash command available.
# You can construct the public URL by concatenating the bucket URL with the path to the asset
# e.g ${endpoint}/storage/v1/object/public/${name}/folder/avatar1.png`,
        js: `
const { data } = supabase
  .storage
  .from('${name}')
  .getPublicUrl('folder/avatar1.png')
        `,
      },
    ],
  },
  invokeEdgeFunction: {
    key: 'invoke-edge-function',
    category: 'edge-functions',
    title: 'Invoke an edge function',
    docsUrl: 'https://supabase.com/docs/reference/javascript/functions-invoke',
    description: `
Invokes a Supabase Edge Function. Requires an Authorization header, and invoke params generally match the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) spec.

When you pass in a body to your function, we automatically attach the \`Content-Type\` header for \`Blob\`, \`ArrayBuffer\`, \`File\`, \`FormData\` and \`String\`. If it doesn't match any of these types we assume the payload is \`json\`, serialize it and attach the \`Content-Type\` header as \`application/json\`. You can override this behavior by passing in a \`Content-Type\` header of your own.

Responses are automatically parsed as \`json\`, \`blob\` and \`form-data\` depending on the \`Content-Type\` header sent by your function. Responses are parsed as \`text\` by default.
`,
    code: ({ name, endpoint, apikey }: { name: string; endpoint: string; apikey: string }) => [
      {
        key: 'invoke-edge-function',
        title: undefined,
        bash: `
curl --request POST '${endpoint}/functions/v1/${name}' \\
--header 'Authorization: Bearer ${apikey}' \\
--header 'Content-Type: application/json' \\
--data '{ "name": "Functions" }'
        `,
        js: `
const { data, error } = await supabase
  .functions
  .invoke('${name}', {
    body: { foo: 'bar' }
  })`,
      },
    ],
  },
}
