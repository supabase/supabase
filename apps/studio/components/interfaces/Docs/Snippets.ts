const snippets = {
  endpoint: (endpoint: string) => ({
    title: 'API URL',
    bash: {
      language: 'bash',
      code: `${endpoint}`,
    },
    js: {
      language: 'bash',
      code: `${endpoint}`,
    },
  }),
  install: () => ({
    title: 'Install',
    bash: null,
    js: {
      language: 'bash',
      code: `npm install --save @supabase/supabase-js`,
    },
  }),
  init: (endpoint: string) => ({
    title: 'Initializing',
    bash: {
      language: 'bash',
      code: `# No client library required for Bash.`,
    },
    js: {
      language: 'js',
      code: `
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = '${endpoint}'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)`,
    },
    python: {
      language: 'python',
      code: `
import os
from supabase import create_client, Client
url: str = '${endpoint}'
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)
`,
    },
    dart: {
      language: 'dart',
      code: `
const supabaseUrl = '${endpoint}';
const supabaseKey = String.fromEnvironment('SUPABASE_KEY');
Future<void> main() async {
  await Supabase.initialize(url: supabaseUrl, anonKey: supabaseKey);
  runApp(MyApp());
}`,
    },
  }),
  authKey: (title: string, varName: string, apikey: string) => ({
    title: `${title}`,
    bash: {
      language: 'bash',
      code: `${apikey}`,
    },
    js: {
      language: 'js',
      code: `const ${varName} = '${apikey}'`,
    },
  }),
  authKeyExample: (
    defaultApiKey: string,
    endpoint: string,
    { keyName, showBearer = true }: { keyName?: string; showBearer?: boolean }
  ) => ({
    title: 'Example usage',
    bash: {
      language: 'bash',
      code: `
curl '${endpoint}/rest/v1/' \\
-H "apikey: ${defaultApiKey}" ${
        showBearer
          ? `\\
-H "Authorization: Bearer ${defaultApiKey}"`
          : ''
      }
`,
    },
    js: {
      language: 'js',
      code: `
const SUPABASE_URL = "${endpoint}"
const supabase = createClient(SUPABASE_URL, process.env.${keyName || 'SUPABASE_KEY'});
`,
    },
  }),
  rpcSingle: ({
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
    return {
      title: 'Invoke function ',
      bash: {
        language: 'bash',
        code: `
curl -X POST '${endpoint}/rest/v1/rpc/${rpcName}' \\${bashParams}
-H "Content-Type: application/json" \\
-H "apikey: ${apiKey}" ${
          showBearer
            ? `\\
-H "Authorization: Bearer ${apiKey}"`
            : ''
        }
`,
      },
      js: {
        language: 'js',
        code: `
let { data, error } = await supabase
  .rpc('${rpcName}'${jsParams})
if (error) console.error(error)
else console.log(data)
`,
      },
    }
  },
  subscribeAll: (listenerName: string, resourceId: string) => ({
    title: 'Subscribe to all events',
    bash: {
      language: 'bash',
      code: `# Realtime streams are only supported by our client libraries`,
    },
    js: {
      language: 'js',
      code: `
const ${listenerName} = supabase.channel('custom-all-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
    },
  }),
  subscribeInserts: (listenerName: string, resourceId: string) => ({
    title: 'Subscribe to inserts',
    bash: {
      language: 'bash',
      code: `# Realtime streams are only supported by our client libraries`,
    },
    js: {
      language: 'js',
      code: `
const ${listenerName} = supabase.channel('custom-insert-channel')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
    },
  }),
  subscribeUpdates: (listenerName: string, resourceId: string) => ({
    title: 'Subscribe to updates',
    bash: {
      language: 'bash',
      code: `# Realtime streams are only supported by our client libraries`,
    },
    js: {
      language: 'js',
      code: `
const ${listenerName} = supabase.channel('custom-update-channel')
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
    },
  }),
  subscribeDeletes: (listenerName: string, resourceId: string) => ({
    title: 'Subscribe to deletes',
    bash: {
      language: 'bash',
      code: `# Realtime streams are only supported by our client libraries`,
    },
    js: {
      language: 'js',
      code: `
const ${listenerName} = supabase.channel('custom-delete-channel')
  .on(
    'postgres_changes',
    { event: 'DELETE', schema: 'public', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
    },
  }),
  subscribeEq: (listenerName: string, resourceId: string, columnName: string, value: string) => ({
    title: 'Subscribe to specific rows',
    bash: {
      language: 'bash',
      code: `# Realtime streams are only supported by our client libraries`,
    },
    js: {
      language: 'js',
      code: `
const ${listenerName} = supabase.channel('custom-filter-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: '${resourceId}', filter: '${columnName}=eq.${value}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
    },
  }),
  readAll: (resourceId: string, endpoint: string, apiKey: string) => ({
    title: 'Read all rows',
    bash: {
      language: 'bash',
      code: `
curl '${endpoint}/rest/v1/${resourceId}?select=*' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}"
`,
    },
    js: {
      language: 'js',
      code: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select('*')
`,
    },
  }),
  readColumns: ({
    title = 'Read specific columns',
    resourceId,
    endpoint,
    apiKey,
    columnName = 'some_column,other_column',
  }: {
    title?: string
    resourceId: string
    endpoint: string
    apiKey: string
    columnName?: string
  }) => ({
    title,
    bash: {
      language: 'bash',
      code: `
curl '${endpoint}/rest/v1/${resourceId}?select=${columnName}' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}"
`,
    },
    js: {
      language: 'js',
      code: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select('${columnName}')
`,
    },
  }),
  readForeignTables: (resourceId: string, endpoint: string, apiKey: string) => ({
    title: 'Read referenced tables',
    bash: {
      language: 'bash',
      code: `
curl '${endpoint}/rest/v1/${resourceId}?select=some_column,other_table(foreign_key)' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}"
`,
    },
    js: {
      language: 'js',
      code: `
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
  }),
  readRange: (resourceId: string, endpoint: string, apiKey: string) => ({
    title: 'With pagination',
    bash: {
      language: 'bash',
      code: `
curl '${endpoint}/rest/v1/${resourceId}?select=*' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}" \\
-H "Range: 0-9"
`,
    },
    js: {
      language: 'js',
      code: `
let { data: ${resourceId}, error } = await supabase
  .from('${resourceId}')
  .select('*')
  .range(0, 9)
`,
    },
  }),
  readFilters: (resourceId: string, endpoint: string, apiKey: string) => ({
    title: 'With filtering',
    bash: {
      language: 'bash',
      code: `
curl '${endpoint}/rest/v1/${resourceId}?id=eq.1&select=*' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}" \\
-H "Range: 0-9"
`,
    },
    js: {
      language: 'js',
      code: `
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
`,
    },
  }),
  insertSingle: (resourceId: string, endpoint: string, apiKey: string) => ({
    title: 'Insert a row',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}" \\
-H "Content-Type: application/json" \\
-H "Prefer: return=minimal" \\
-d '{ "some_column": "someValue", "other_column": "otherValue" }'
`,
    },
    js: {
      language: 'js',
      code: `
const { data, error } = await supabase
  .from('${resourceId}')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
`,
    },
  }),
  insertMany: (resourceId: string, endpoint: string, apiKey: string) => ({
    title: 'Insert many rows',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}" \\
-H "Content-Type: application/json" \\
-d '[{ "some_column": "someValue" }, { "other_column": "otherValue" }]'
`,
    },
    js: {
      language: 'js',
      code: `
const { data, error } = await supabase
  .from('${resourceId}')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
`,
    },
  }),
  upsert: (resourceId: string, endpoint: string, apiKey: string) => ({
    title: 'Upsert matching rows',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}" \\
-H "Content-Type: application/json" \\
-H "Prefer: resolution=merge-duplicates" \\
-d '{ "some_column": "someValue", "other_column": "otherValue" }'
`,
    },
    js: {
      language: 'js',
      code: `
const { data, error } = await supabase
  .from('${resourceId}')
  .upsert({ some_column: 'someValue' })
  .select()
`,
    },
  }),
  update: (resourceId: string, endpoint: string, apiKey: string) => ({
    title: 'Update matching rows',
    bash: {
      language: 'bash',
      code: `
curl -X PATCH '${endpoint}/rest/v1/${resourceId}?some_column=eq.someValue' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}" \\
-H "Content-Type: application/json" \\
-H "Prefer: return=minimal" \\
-d '{ "other_column": "otherValue" }'
`,
    },
    js: {
      language: 'js',
      code: `
const { data, error } = await supabase
  .from('${resourceId}')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
`,
    },
  }),
  delete: (resourceId: string, endpoint: string, apiKey: string) => ({
    title: 'Delete matching rows',
    bash: {
      language: 'bash',
      code: `
curl -X DELETE '${endpoint}/rest/v1/${resourceId}?some_column=eq.someValue' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}"
`,
    },
    js: {
      language: 'js',
      code: `
const { error } = await supabase
  .from('${resourceId}')
  .delete()
  .eq('some_column', 'someValue')
`,
    },
  }),
  authSignup: (endpoint: string, apiKey: string, randomPassword: string) => ({
    title: 'User signup',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/auth/v1/signup' \\
-H "apikey: ${apiKey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com",
  "password": "${randomPassword}"
}'
`,
    },
    js: {
      language: 'js',
      code: `
let { data, error } = await supabase.auth.signUp({
  email: 'someone@email.com',
  password: '${randomPassword}'
})
`,
    },
  }),
  authLogin: (endpoint: string, apiKey: string, randomPassword: string) => ({
    title: 'User login',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/auth/v1/token?grant_type=password' \\
-H "apikey: ${apiKey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com",
  "password": "${randomPassword}"
}'
`,
    },
    js: {
      language: 'js',
      code: `
let { data, error } = await supabase.auth.signInWithPassword({
  email: 'someone@email.com',
  password: '${randomPassword}'
})
`,
    },
  }),
  authMagicLink: (endpoint: string, apiKey: string) => ({
    title: 'User login',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/auth/v1/magiclink' \\
-H "apikey: ${apiKey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com"
}'
`,
    },
    js: {
      language: 'js',
      code: `
let { data, error } = await supabase.auth.signInWithOtp({
  email: 'someone@email.com'
})
`,
    },
  }),
  authPhoneSignUp: (endpoint: string, apiKey: string) => ({
    title: 'Phone Signup',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/auth/v1/signup' \\
-H "apikey: ${apiKey}" \\
-H "Content-Type: application/json" \\
-d '{
  "phone": "+13334445555",
  "password": "some-password"
}'
`,
    },
    js: {
      language: 'js',
      code: `
let { data, error } = await supabase.auth.signUp({
  phone: '+13334445555',
  password: 'some-password'
})
`,
    },
  }),
  authMobileOTPLogin: (endpoint: string, apiKey: string) => ({
    title: 'Phone Login',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/auth/v1/otp' \\
-H "apikey: ${apiKey}" \\
-H "Content-Type: application/json" \\
-d '{
  "phone": "+13334445555"
}'
`,
    },
    js: {
      language: 'js',
      code: `
let { data, error } = await supabase.auth.signInWithOtp({
  phone: '+13334445555'
})
`,
    },
  }),
  authMobileOTPVerify: (endpoint: string, apiKey: string) => ({
    title: 'Verify Pin',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/auth/v1/verify' \\
-H "apikey: ${apiKey}" \\
-H "Content-Type: application/json" \\
-d '{
  "type": "sms",
  "phone": "+13334445555",
  "token": "123456"
}'
`,
    },
    js: {
      language: 'js',
      code: `
let { data, error } = await supabase.auth.verifyOtp({
  phone: '+13334445555',
  token: '123456',
  type: 'sms'
})
`,
    },
  }),
  authInvite: (endpoint: string, apiKey: string) => ({
    title: 'Invite User',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/auth/v1/invite' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer SERVICE_ROLE_KEY" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com"
}'
`,
    },
    js: {
      language: 'js',
      code: `
let { data, error } = await supabase.auth.admin.inviteUserByEmail('someone@email.com')
`,
    },
  }),
  authThirdPartyLogin: (endpoint: string, apiKey: string) => ({
    title: 'Third Party Login',
    bash: {
      language: 'bash',
      code: `
curl -X GET '${endpoint}/auth/v1/authorize?provider=github' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer USER_TOKEN" \\
-H "Content-Type: application/json"
`,
    },
    js: {
      language: 'js',
      code: `
let { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'github'
})
`,
    },
  }),
  authUser: (endpoint: string, apiKey: string) => ({
    title: 'Get User',
    bash: {
      language: 'bash',
      code: `
curl -X GET '${endpoint}/auth/v1/user' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer USER_TOKEN"
`,
    },
    js: {
      language: 'js',
      code: `
const { data: { user } } = await supabase.auth.getUser()
`,
    },
  }),
  authRecover: (endpoint: string, apiKey: string) => ({
    title: 'Password Recovery',
    bash: {
      language: 'bash',
      code: `
      curl -X POST '${endpoint}/auth/v1/recover' \\
-H "apikey: ${apiKey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com"
}'
`,
    },
    js: {
      language: 'js',
      code: `
let { data, error } = await supabase.auth.resetPasswordForEmail(email)
`,
    },
  }),
  authUpdate: (endpoint: string, apiKey: string) => ({
    title: 'Update User',
    bash: {
      language: 'bash',
      code: `
      curl -X PUT '${endpoint}/auth/v1/user' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer USER_TOKEN" \\
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
    js: {
      language: 'js',
      code: `
const { data, error } = await supabase.auth.updateUser({
  email: "new@email.com",
  password: "new-password",
  data: { hello: 'world' }
})
`,
    },
  }),
  authLogout: (endpoint: string, apiKey: string) => ({
    title: 'User logout',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/auth/v1/logout' \\
-H "apikey: ${apiKey}" \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer USER_TOKEN"
`,
    },
    js: {
      language: 'js',
      code: `
let { error } = await supabase.auth.signOut()
`,
    },
  }),
}

export default snippets
