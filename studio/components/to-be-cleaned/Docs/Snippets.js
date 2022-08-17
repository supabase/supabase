const snippets = {
  endpoint: (endpoint) => ({
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
  init: (endpoint) => ({
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
  }),
  authKey: (title, varName, apikey) => ({
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
  authKeyExample: (defaultApiKey, endpoint, { keyName, showBearer = true }) => ({
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
  rpcSingle: ({ rpcName, rpcParams, endpoint, apiKey, showBearer = true }) => {
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
  subscribeAll: (listenerName, resourceId) => ({
    title: 'Subscribe to all events',
    bash: {
      language: 'bash',
      code: `# Realtime streams are only supported by our client libraries`,
    },
    js: {
      language: 'js',
      code: `
const ${listenerName} = supabase
  .from('${resourceId}')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()`,
    },
  }),
  subscribeInserts: (listenerName, resourceId) => ({
    title: 'Subscribe to inserts',
    bash: {
      language: 'bash',
      code: `# Realtime streams are only supported by our client libraries`,
    },
    js: {
      language: 'js',
      code: `
const ${listenerName} = supabase
  .from('${resourceId}')
  .on('INSERT', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()`,
    },
  }),
  subscribeUpdates: (listenerName, resourceId) => ({
    title: 'Subscribe to updates',
    bash: {
      language: 'bash',
      code: `# Realtime streams are only supported by our client libraries`,
    },
    js: {
      language: 'js',
      code: `
const ${listenerName} = supabase
  .from('${resourceId}')
  .on('UPDATE', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()`,
    },
  }),
  subscribeDeletes: (listenerName, resourceId) => ({
    title: 'Subscribe to deletes',
    bash: {
      language: 'bash',
      code: `# Realtime streams are only supported by our client libraries`,
    },
    js: {
      language: 'js',
      code: `
const ${listenerName} = supabase
  .from('${resourceId}')
  .on('DELETE', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()`,
    },
  }),
  subscribeEq: (listenerName, resourceId, columnName, value) => ({
    title: 'Subscribe to specific rows',
    bash: {
      language: 'bash',
      code: `# Realtime streams are only supported by our client libraries`,
    },
    js: {
      language: 'js',
      code: `
const ${listenerName} = supabase
  .from('${resourceId}:${columnName}=eq.${value}')
  .on('*', payload => {
    console.log('Change received!', payload)
  })
  .subscribe()`,
    },
  }),
  readAll: (resourceId, endpoint, apiKey) => ({
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
  readForeignTables: (resourceId, endpoint, apiKey) => ({
    title: 'Read foreign tables',
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
  readRange: (resourceId, endpoint, apiKey) => ({
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
  readFilters: (resourceId, endpoint, apiKey) => ({
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
  .cs('array_column', ['array', 'contains'])
  .cd('array_column', ['contained', 'by'])

`,
    },
  }),
  insertSingle: (resourceId, endpoint, apiKey) => ({
    title: 'Insert a row',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}" \\
-H "Content-Type: application/json" \\
-H "Prefer: return=representation" \\
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
`,
    },
  }),
  insertMany: (resourceId, endpoint, apiKey) => ({
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
`,
    },
  }),
  upsert: (resourceId, endpoint, apiKey) => ({
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
  .insert([{ some_column: 'someValue' }], { upsert: true })
`,
    },
  }),
  update: (resourceId, endpoint, apiKey) => ({
    title: 'Update matching rows',
    bash: {
      language: 'bash',
      code: `
curl -X PATCH '${endpoint}/rest/v1/${resourceId}?some_column=eq.someValue' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}" \\
-H "Content-Type: application/json" \\
-H "Prefer: return=representation" \\
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
`,
    },
  }),
  delete: (resourceId, endpoint, apiKey) => ({
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
const { data, error } = await supabase
  .from('${resourceId}')
  .delete()
  .eq('some_column', 'someValue')
`,
    },
  }),
  authSignup: (endpoint, apiKey, randomPassword) => ({
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
let { user, error } = await supabase.auth.signUp({
  email: 'someone@email.com',
  password: '${randomPassword}'
})
`,
    },
  }),
  authLogin: (endpoint, apiKey, randomPassword) => ({
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
let { user, error } = await supabase.auth.signInWithPassword({
  email: 'someone@email.com',
  password: '${randomPassword}'
})
`,
    },
  }),
  authMagicLink: (endpoint, apiKey) => ({
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
let { user, error } = await supabase.auth.signInWithOtp({
  email: 'someone@email.com'
})
`,
    },
  }),
  authPhoneSignUp: (endpoint, apiKey) => ({
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
let { user, error } = await supabase.auth.signUp({
  phone: '+13334445555',
  password: 'some-password'
})
`,
    },
  }),
  authMobileOTPLogin: (endpoint, apiKey) => ({
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
let { user, error } = await supabase.auth.signInWithOtp({
  phone: '+13334445555'
})
`,
    },
  }),
  authMobileOTPVerify: (endpoint, apiKey) => ({
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
let { session, error } = await supabase.auth.verifyOTP({
  phone: '+13334445555',
  token: '123456'
})
`,
    },
  }),
  authInvite: (endpoint, apiKey) => ({
    title: 'Invite User',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/auth/v1/invite' \\
-H "apikey: ${apiKey}" \\
-H "Authorization: Bearer ${apiKey}" \\
-H "Content-Type: application/json" \\
-d '{
  "email": "someone@email.com"
}'
`,
    },
    js: {
      language: 'js',
      code: `
let { data, error } = await supabase.auth.api.inviteUserByEmail('someone@email.com')
`,
    },
  }),
  authThirdPartyLogin: (endpoint, apiKey) => ({
    title: '',
    bash: {
      language: 'bash',
      code: ``,
    },
    js: {
      language: 'js',
      code: `
let { user, error } = await supabase.auth.signInWithOAuth({
  provider: 'github'
})
`,
    },
  }),
  authUser: (endpoint, apiKey) => ({
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
const user = supabase.auth.user()
`,
    },
  }),
  authRecover: (endpoint, apiKey) => ({
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
let { data, error } = await supabase.auth.api.resetPasswordForEmail(email)
`,
    },
  }),
  authUpdate: (endpoint, apiKey) => ({
    title: 'Update User',
    bash: {
      language: 'bash',
      code: `
      curl -X PUT '${endpoint}/auth/v1/user' \\
-H "apikey: ${apiKey}" \\
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
    js: {
      language: 'js',
      code: `
const { user, error } = await supabase.auth.update({
  email: "new@email.com",
  password: "new-password",
  data: { hello: 'world' }
})
`,
    },
  }),
  authLogout: (endpoint, apiKey, randomPassword) => ({
    title: 'User logout',
    bash: {
      language: 'bash',
      code: `
curl -X POST '${endpoint}/auth/v1/logout' \\
-H "apikey: ${apiKey}" \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer USER_TOKEN"'
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
