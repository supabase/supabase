import { Application, Router } from 'https://deno.land/x/oak@v11.1.0/mod.ts'
import { CookieStore, Session } from 'https://deno.land/x/oak_sessions@v4.1.9/mod.ts'
import { OAuth2Client } from 'https://deno.land/x/oauth2_client@v1.0.2/mod.ts'
import { SupabaseManagementAPI } from 'https://esm.sh/supabase-management-js@0.1.2'

const config = {
  clientId: Deno.env.get('SUPA_CONNECT_CLIENT_ID')!,
  clientSecret: Deno.env.get('SUPA_CONNECT_CLIENT_SECRET')!,
  authorizationEndpointUri: 'https://api.supabase.com/v1/oauth/authorize',
  tokenUri: 'https://api.supabase.com/v1/oauth/token',
  redirectUri: 'http://localhost:54321/functions/v1/connect-supabase/oauth2/callback',
}
const oauth2Client = new OAuth2Client(config)

type AppState = {
  session: Session
}

const router = new Router<AppState>()
// Note: path should be prefixed with function name.
router.get('/connect-supabase', (ctx) => {
  ctx.response.body =
    'This is an example of implementing https://supabase.com/docs/guides/integrations/oauth-apps/authorize-an-oauth-app . Navigate to /login to start the OAuth flow.'
})
router.get('/connect-supabase/login', async (ctx) => {
  // Construct the URL for the authorization redirect and get a PKCE codeVerifier.
  const { uri, codeVerifier } = await oauth2Client.code.getAuthorizationUri()
  console.log(uri.toString())

  // Store both the state and codeVerifier in the user session.
  ctx.state.session.flash('codeVerifier', codeVerifier)

  // Redirect the user to the authorization endpoint.
  ctx.response.redirect(uri)
})
router.get('/connect-supabase/oauth2/callback', async (ctx) => {
  // Make sure the codeVerifier is present for the user's session.
  const codeVerifier = ctx.state.session.get('codeVerifier') as string
  console.log('codeVerifier', codeVerifier)
  if (!codeVerifier) throw new Error('No codeVerifier!')

  // Exchange the authorization code for an access token.
  const tokens = await fetch(config.tokenUri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: ctx.request.url.searchParams.get('code') || '',
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    }),
  }).then((res) => res.json())
  console.log('tokens', tokens)
  // TODO: Make sure to store the tokens in your DB for future use.

  // Use the access token to make an authenticated API request.
  const supaManagementClient = new SupabaseManagementAPI({
    accessToken: tokens.accessToken ?? tokens.access_token,
  })
  const projects = await supaManagementClient.getProjects()

  ctx.response.body = `Hello, these are your projects: \n ${JSON.stringify(
    projects?.map((p) => ({ id: p.id, name: p.name })),
    null,
    2
  )}!`
})

const app = new Application<AppState>()
// cookie name for the store is configurable, default is: {sessionDataCookieName: 'session_data'}
const store = new CookieStore('very-secret-key')
// @ts-ignore TODO: open issue at https://github.com/jcs224/oak_sessions
app.use(Session.initMiddleware(store))
app.use(router.routes())
app.use(router.allowedMethods())
await app.listen({ port: 8000 })
