export const DOCS_MENU = [
  {
    name: 'Getting started',
    key: 'introduction',
    sections: [
      { name: 'Initializing', key: 'initializing' },
      { name: 'Authentication', key: 'authentication' },
      { name: 'Client API Keys', key: 'client-api-keys' },
      { name: 'Service Keys', key: 'service-keys' },
    ],
  },
  {
    name: 'User Management',
    key: 'user-management',
    sections: [
      { name: 'Sign up', key: 'sign-up' },
      { name: 'Email login', key: 'email-login' },
      { name: 'Magic link login', key: 'magic-link-login' },
      { name: 'Phone login', key: 'phone-log-in' },
    ],
  },
  { name: 'Tables & Views', key: 'entities' },
  { name: 'RPC Functions', key: 'rpc-functions' },
  { name: 'Storage', key: 'storage' },
  { name: 'Edge Functions', key: 'edge-functions' },
]

export const DOCS_CONTENT = {
  auth: () => ({
    title: 'Authentication',
    description: `Supabase works through a mixture of JWT and Key auth.

If no \`Authorization\` header is included, the API will assume that you are
making a request with an anonymous user.

If an \`Authorization\` header is included, the API will "switch" to the role
of the user making the request. See the User Management section for more details.

We recommend setting your keys as Environment Variables.
    `,
  }),
  clientApiKeys: () => ({
    title: `Client API Keys`,
    description: `Client keys allow "anonymous access" to your database, until the user has logged in. After logging in the keys will switch to the user's own login token.

In this documentation, we will refer to the key using the name \`SUPABASE_KEY\`.

We have provided you a Client Key to get started. You will soon be able to add as many keys as you like. You can find the \`anon\` key in the API settings page.
`,
  }),
  serviceApiKeys: () => ({
    title: `Service Keys`,
    description: `Service keys have *FULL* access to your data, bypassing any security policies. Be VERY careful where you expose these keys. They should only be used on a server and never on a client or browser.
  
In this documentation, we will refer to the key using the name \`SERVICE_KEY\`.

We have provided you with a Service Key to get started. Soon you will be able to add as many keys as you like. You can find the \`service_role\` in the API settings page.
    `,
  }),
  userManagement: () => ({
    title: `User Mananagement`,
    description: `Supabase makes it easy to manage your users.
    
Supabase assigns each user a unique ID. You can reference this ID anywhere in your database. For example, you might create a \`profiles\` table references the user using a \`user_id\` field.

Supabase already has built in the routes to sign up, login, and log out for managing users in your apps and websites.`,
  }),
  signUp: () => ({
    title: `Sign Up`,
    description: `Allow your users to sign up and create a new account

After they have signed up, all interactions using the Supabase client will be performed as "that user".`,
  }),
}

export const CODE_SNIPPETS = {
  init: (endpoint: string) => ({
    title: 'Initializing',
    description: 'Create a new client for use in the browser.',
    js: `
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${endpoint}'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)`,
    bash: `# No client library required for Bash.`,
  }),
  authKey: (varName: string, apikey: string, endpoint: string) => ({
    bash: `${apikey}`,
    js: `const ${varName} = '${apikey}'

const SUPABASE_URL = 'https://${endpoint}'
const supabase = createClient(SUPABASE_URL, process.env.${varName || 'SUPABASE_KEY'});
    `,
  }),
  authSignup: (endpoint: string, apiKey: string, randomPassword: string) => ({
    title: 'User signup',
    bash: `
curl -X POST '${endpoint}/auth/v1/signup' \\
-H "apikey: ${apiKey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com",
  "password": "${randomPassword}"
}'`,
    js: `
let { data, error } = await supabase.auth.signUp({
  email: 'someone@email.com',
  password: '${randomPassword}'
})`,
  }),
}
