type SchemaHeaderMode = 'read' | 'write'

export const getSchemaHeaders = (schema: string, mode: SchemaHeaderMode = 'read') =>
  schema === 'public'
    ? { bash: '', js: '' }
    : {
        bash: ` \\\n-H "${mode === 'write' ? 'Content-Profile' : 'Accept-Profile'}: ${schema}"`,
        js: `.schema('${schema}')`,
      }

export const getSchemaPrefix = (schema: string) => {
  const schemaHeaders = getSchemaHeaders(schema)
  return schemaHeaders.js.length > 0 ? `${schemaHeaders.js}\n  ` : ''
}

function withSchemaContext<T>(
  schema: string,
  build: (context: {
    schemaHeaders: ReturnType<typeof getSchemaHeaders>
    schemaPrefix: string
  }) => T,
  mode: SchemaHeaderMode = 'read'
) {
  return build({
    schemaHeaders: getSchemaHeaders(schema, mode),
    schemaPrefix: getSchemaPrefix(schema),
  })
}

export function getSchemaQualifiedEntity(id: string) {
  if (!id.includes('.')) {
    return { schema: 'public', name: id }
  }

  const [schema, ...nameParts] = id.split('.')
  return { schema, name: nameParts.join('.') }
}

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
    schema = 'public',
  }: {
    rpcName: string
    rpcParams: any[]
    endpoint: string
    apiKey: string
    showBearer?: boolean
    schema?: string
  }) => {
    const schemaHeaders = getSchemaHeaders(schema, 'write')
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
-H "apikey: ${apiKey}"${schemaHeaders.bash}${
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
  ${getSchemaPrefix(schema)}.rpc('${rpcName}'${jsParams})
if (error) console.error(error)
else console.log(data)
`,
      },
    }
  },
  subscribeAll: (listenerName: string, resourceId: string, schema = 'public') => ({
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
    { event: '*', schema: '${schema}', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
    },
  }),
  subscribeInserts: (listenerName: string, resourceId: string, schema = 'public') => ({
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
    { event: 'INSERT', schema: '${schema}', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
    },
  }),
  subscribeUpdates: (listenerName: string, resourceId: string, schema = 'public') => ({
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
    { event: 'UPDATE', schema: '${schema}', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
    },
  }),
  subscribeDeletes: (listenerName: string, resourceId: string, schema = 'public') => ({
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
    { event: 'DELETE', schema: '${schema}', table: '${resourceId}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
    },
  }),
  subscribeEq: (
    listenerName: string,
    resourceId: string,
    columnName: string,
    value: string,
    schema = 'public'
  ) => ({
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
    { event: '*', schema: '${schema}', table: '${resourceId}', filter: '${columnName}=eq.${value}' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()`,
    },
  }),
  readAll: (resourceId: string, endpoint: string, apiKey: string, schema = 'public') => ({
    ...withSchemaContext(schema, ({ schemaHeaders, schemaPrefix }) => ({
      title: 'Read all rows',
      bash: {
        language: 'bash',
        code: `
curl '${endpoint}/rest/v1/${resourceId}?select=*' \\
-H "apikey: ${apiKey}"${schemaHeaders.bash} \\
-H "Authorization: Bearer ${apiKey}"
`,
      },
      js: {
        language: 'js',
        code: `
let { data: ${resourceId}, error } = await supabase
  ${schemaPrefix}.from('${resourceId}')
  .select('*')
`,
      },
    })),
  }),
  readColumns: ({
    title = 'Read specific columns',
    resourceId,
    endpoint,
    apiKey,
    columnName = 'some_column,other_column',
    schema = 'public',
  }: {
    title?: string
    resourceId: string
    endpoint: string
    apiKey: string
    columnName?: string
    schema?: string
  }) => ({
    ...withSchemaContext(schema, ({ schemaHeaders, schemaPrefix }) => ({
      title,
      bash: {
        language: 'bash',
        code: `
curl '${endpoint}/rest/v1/${resourceId}?select=${columnName}' \\
-H "apikey: ${apiKey}"${schemaHeaders.bash} \\
-H "Authorization: Bearer ${apiKey}"
`,
      },
      js: {
        language: 'js',
        code: `
let { data: ${resourceId}, error } = await supabase
  ${schemaPrefix}.from('${resourceId}')
  .select('${columnName}')
`,
      },
    })),
  }),
  readForeignTables: (resourceId: string, endpoint: string, apiKey: string, schema = 'public') => ({
    ...withSchemaContext(schema, ({ schemaHeaders, schemaPrefix }) => ({
      title: 'Read referenced tables',
      bash: {
        language: 'bash',
        code: `
curl '${endpoint}/rest/v1/${resourceId}?select=some_column,other_table(foreign_key)' \\
-H "apikey: ${apiKey}"${schemaHeaders.bash} \\
-H "Authorization: Bearer ${apiKey}"
`,
      },
      js: {
        language: 'js',
        code: `
let { data: ${resourceId}, error } = await supabase
  ${schemaPrefix}.from('${resourceId}')
  .select(\`
    some_column,
    other_table (
      foreign_key
    )
  \`)
`,
      },
    })),
  }),
  readRange: (resourceId: string, endpoint: string, apiKey: string, schema = 'public') => ({
    ...withSchemaContext(schema, ({ schemaHeaders, schemaPrefix }) => ({
      title: 'With pagination',
      bash: {
        language: 'bash',
        code: `
curl '${endpoint}/rest/v1/${resourceId}?select=*' \\
-H "apikey: ${apiKey}"${schemaHeaders.bash} \\
-H "Authorization: Bearer ${apiKey}" \\
-H "Range: 0-9"
`,
      },
      js: {
        language: 'js',
        code: `
let { data: ${resourceId}, error } = await supabase
  ${schemaPrefix}.from('${resourceId}')
  .select('*')
  .range(0, 9)
`,
      },
    })),
  }),
  readFilters: (resourceId: string, endpoint: string, apiKey: string, schema = 'public') => ({
    ...withSchemaContext(schema, ({ schemaHeaders, schemaPrefix }) => ({
      title: 'With filtering',
      bash: {
        language: 'bash',
        code: `
curl --get '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apiKey}"${schemaHeaders.bash} \\
-H "Authorization: Bearer ${apiKey}" \\
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
      },
      js: {
        language: 'js',
        code: `
let { data: ${resourceId}, error } = await supabase
  ${schemaPrefix}.from('${resourceId}')
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
    })),
  }),
  insertSingle: (resourceId: string, endpoint: string, apiKey: string, schema = 'public') => ({
    ...withSchemaContext(
      schema,
      ({ schemaHeaders, schemaPrefix }) => ({
        title: 'Insert a row',
        bash: {
          language: 'bash',
          code: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apiKey}"${schemaHeaders.bash} \\
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
  ${schemaPrefix}.from('${resourceId}')
  .insert([
    { some_column: 'someValue', other_column: 'otherValue' },
  ])
  .select()
`,
        },
      }),
      'write'
    ),
  }),
  insertMany: (resourceId: string, endpoint: string, apiKey: string, schema = 'public') => ({
    ...withSchemaContext(
      schema,
      ({ schemaHeaders, schemaPrefix }) => ({
        title: 'Insert many rows',
        bash: {
          language: 'bash',
          code: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apiKey}"${schemaHeaders.bash} \\
-H "Authorization: Bearer ${apiKey}" \\
-H "Content-Type: application/json" \\
-d '[{ "some_column": "someValue" }, { "other_column": "otherValue" }]'
`,
        },
        js: {
          language: 'js',
          code: `
const { data, error } = await supabase
  ${schemaPrefix}.from('${resourceId}')
  .insert([
    { some_column: 'someValue' },
    { some_column: 'otherValue' },
  ])
  .select()
`,
        },
      }),
      'write'
    ),
  }),
  upsert: (resourceId: string, endpoint: string, apiKey: string, schema = 'public') => ({
    ...withSchemaContext(
      schema,
      ({ schemaHeaders, schemaPrefix }) => ({
        title: 'Upsert matching rows',
        bash: {
          language: 'bash',
          code: `
curl -X POST '${endpoint}/rest/v1/${resourceId}' \\
-H "apikey: ${apiKey}"${schemaHeaders.bash} \\
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
  ${schemaPrefix}.from('${resourceId}')
  .upsert({ some_column: 'someValue' })
  .select()
`,
        },
      }),
      'write'
    ),
  }),
  update: (resourceId: string, endpoint: string, apiKey: string, schema = 'public') => ({
    ...withSchemaContext(
      schema,
      ({ schemaHeaders, schemaPrefix }) => ({
        title: 'Update matching rows',
        bash: {
          language: 'bash',
          code: `
curl -X PATCH '${endpoint}/rest/v1/${resourceId}?some_column=eq.someValue' \\
-H "apikey: ${apiKey}"${schemaHeaders.bash} \\
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
  ${schemaPrefix}.from('${resourceId}')
  .update({ other_column: 'otherValue' })
  .eq('some_column', 'someValue')
  .select()
`,
        },
      }),
      'write'
    ),
  }),
  delete: (resourceId: string, endpoint: string, apiKey: string, schema = 'public') => ({
    ...withSchemaContext(
      schema,
      ({ schemaHeaders, schemaPrefix }) => ({
        title: 'Delete matching rows',
        bash: {
          language: 'bash',
          code: `
curl -X DELETE '${endpoint}/rest/v1/${resourceId}?some_column=eq.someValue' \\
-H "apikey: ${apiKey}"${schemaHeaders.bash} \\
-H "Authorization: Bearer ${apiKey}"
`,
        },
        js: {
          language: 'js',
          code: `
const { error } = await supabase
  ${schemaPrefix}.from('${resourceId}')
  .delete()
  .eq('some_column', 'someValue')
`,
        },
      }),
      'write'
    ),
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
