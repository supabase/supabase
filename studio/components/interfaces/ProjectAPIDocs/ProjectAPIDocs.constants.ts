export const DOCS_MENU = [
  { name: 'Getting started', key: 'introduction' },
  { name: 'User Management', key: 'user-management' },
  { name: 'Tables & Views', key: 'entities' },
  { name: 'RPC Functions', key: 'rpc-functions' },
  { name: 'Storage', key: 'storage' },
  { name: 'Edge Functions', key: 'edge-functions' },
]

export const DOCS_CONTENT = {
  init: {
    key: 'introduction',
    category: 'introduction',
    title: `Initializing`,
    description: `Create a new client for use in the browser.`,
    js: (apikey?: string, endpoint?: string) => `
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${endpoint}'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)`,
    bash: (apikey?: string, endpoint?: string) => `# No client library required for Bash.`,
  },
  auth: {
    key: 'authentication',
    category: 'introduction',
    title: 'Authentication',
    description: `Supabase works through a mixture of JWT and Key auth.

If no \`Authorization\` header is included, the API will assume that you are
making a request with an anonymous user.

If an \`Authorization\` header is included, the API will "switch" to the role
of the user making the request. See the User Management section for more details.

We recommend setting your keys as Environment Variables.`,
    js: undefined,
    bash: undefined,
  },
  clientApiKeys: {
    key: 'client-api-keys',
    category: 'introduction',
    title: `Client API Keys`,
    description: `Client keys allow "anonymous access" to your database, until the user has logged in. After logging in the keys will switch to the user's own login token.

In this documentation, we will refer to the key using the name \`SUPABASE_KEY\`.

We have provided you a Client Key to get started. You will soon be able to add as many keys as you like. You can find the \`anon\` key in the API settings page.`,
    js: (apikey?: string, endpoint?: string) => `
const SUPABASE_KEY = '${apikey}'

const SUPABASE_URL = 'https://${endpoint}'
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_KEY);`,
    bash: (apikey?: string, endpoint?: string) => `${apikey}`,
  },
  serviceApiKeys: {
    key: 'service-keys',
    category: 'introduction',
    title: `Service Keys`,
    description: `Service keys have *FULL* access to your data, bypassing any security policies. Be VERY careful where you expose these keys. They should only be used on a server and never on a client or browser.
  
In this documentation, we will refer to the key using the name \`SERVICE_KEY\`.

We have provided you with a Service Key to get started. Soon you will be able to add as many keys as you like. You can find the \`service_role\` in the API settings page.`,
    js: (apikey?: string, endpoint?: string) => `
const SUPABASE_KEY = '${apikey}'

const SUPABASE_URL = 'https://${endpoint}'
const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_KEY);`,
    bash: (apikey?: string, endpoint?: string) => `${apikey}`,
  },
  userManagement: {
    key: 'user-management',
    category: 'user-management',
    title: `User Mananagement`,
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
let { data, error } = await supabase.auth.signUp({
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
let { data, error } = await supabase.auth.signInWithPassword({
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
let { data, error } = await supabase.auth.signInWithOtp({
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
let { data, error } = await supabase.auth.signUp({
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
let { data, error } = await supabase.auth.signInWithOtp({
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
let { data, error } = await supabase.auth.verifyOtp({
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
let { data, error } = await supabase.auth.signInWithOAuth({
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
let { data, error } = await supabase.auth.resetPasswordForEmail(email)
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
let { error } = await supabase.auth.signOut()
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
let { data, error } = await supabase.auth.api.inviteUserByEmail('someone@email.com')
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
  uploadFile: {
    key: 'upload-file',
    category: 'storage',
    title: 'Upload a file',
    description: `
Upload a file to an existing bucket. RLS policy permissions required:
- \`buckets\` table permissions: none
- \`objects\` table permissions: only \`insert\` when you are uploading new files and \`select\`, \`insert\`, and \`update\` when you are upserting files.
`,
    js: (apikey?: string, endpoint?: string) => `
const avatarFile = event.target.files[0]
const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload('public/avatar1.png', avatarFile, {
    cacheControl: '3600',
    upsert: false
  })
`,
    bash: (apikey?: string, endpoint?: string) => `No command available`,
  },
  deleteFiles: {
    key: 'delete-files',
    category: 'storage',
    title: 'Delete files within a bucket',
    description: `
List all files within a bucket. RLS policy permissions required:
- \`buckets\` table permissions: none
- \`objects\` table permissions: \`delete\` and \`select\`
`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase
  .storage
  .from('avatars')
  .remove(['folder/avatar1.png']) 
`,
    bash: (apikey?: string, endpoint?: string) => `No command available`,
  },
  listFiles: {
    key: 'list-files',
    category: 'storage',
    title: 'List all files in a bucket',
    description: `
List all files within a bucket. RLS policy permissions required:
- \`buckets\` table permissions: none
- \`objects\` table permissions: \`select\`
`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase
  .storage
  .from('avatars')
  .list('folder', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  })    
`,
    bash: (apikey?: string, endpoint?: string) => `No command available`,
  },
  createSignedURL: {
    key: 'create-signed-url',
    category: 'storage',
    title: 'Create a signed URL',
    description: `
Create a signed URL which can be used to share a file for a fixed amount of time. RLS policy permissions required:
- \`buckets\` table permissions: none
- \`objects\` table permissions: \`select\`
`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase
  .storage
  .from('avatars')
  .createSignedUrl('folder/avatar1.png', 60)
`,
    bash: (apikey?: string, endpoint?: string) => `No command available`,
  },
  retrievePublicURL: {
    key: 'retrieve-public-url',
    category: 'storage',
    title: 'Retrieve public URL',
    description: `
A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.

This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.

The bucket needs to be set to public, either via updateBucket() or by going to Storage on supabase.com/dashboard, clicking the overflow menu on a bucket and choosing "Make public"

RLS policy permissions required:
- \`buckets\` table permissions: none
- \`objects\` table permissions: none
`,
    js: (apikey?: string, endpoint?: string) => `
const { data } = supabase
  .storage
  .from('public-bucket')
  .getPublicUrl('folder/avatar1.png')
`,
    bash: (apikey?: string, endpoint?: string) => `No command available`,
  },
  createEdgeFunction: {
    key: 'create-edge-function',
    category: 'edge-functions',
    title: 'Create an Edge Function',
    description: `
Create a Supabase Edge Function locally via the Supabase CLI.
`,
    js: (apikey?: string, endpoint?: string) => `// Create an edge function via the Supabase CLI`,
    bash: (apikey?: string, endpoint?: string) => `
supabase functions new hello-word
`,
  },
  deployEdgeFunction: {
    key: 'deploy-edge-function',
    category: 'edge-functions',
    title: 'Deploy an Edge Function',
    description: `
Deploy a Supabase Edge Function to your Supabase project via the Supabase CLI.
`,
    js: (apikey?: string, endpoint?: string) => `// Deploy an edge function via the Supabase CLI`,
    bash: (apikey?: string, endpoint?: string) => `
supabase functions deploy hello-world --project-ref PROJECT_REF
`,
  },
  invokeEdgeFunction: {
    key: 'invoke-edge-function',
    category: 'edge-functions',
    title: 'Invoke an Edge Function',
    description: `
Invokes a Supabase Edge Function. Requires an Authorization header, and invoke params generally match the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) spec.

When you pass in a body to your function, we automatically attach the \`Content-Type\` header for \`Blob\`, \`ArrayBuffer\`, \`File\`, \`FormData\` and \`String\`. If it doesn't match any of these types we assume the payload is \`json\`, serialise it and attach the \`Content-Type\` header as \`application/json\`. You can override this behaviour by passing in a \`Content-Type\` header of your own.

Responses are automatically parsed as \`json\`, \`blob\` and \`form-data\` depending on the \`Content-Type\` header sent by your function. Responses are parsed as \`text\` by default.
`,
    js: (apikey?: string, endpoint?: string) => `
const { data, error } = await supabase.functions.invoke('hello', {
  body: { foo: 'bar' }
})
`,
    bash: (apikey?: string, endpoint?: string) => `\
curl --request POST '${endpoint}' \
  --header 'Authorization: Bearer ${apikey}' \
  --header 'Content-Type: application/json' \
  --data '{ "name": "Functions" }'
`,
  },
}
