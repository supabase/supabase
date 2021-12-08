import { initAuth0 } from '@auth0/nextjs-auth0'
import { IS_PLATFORM } from '../constants'

let auth0: any

if (IS_PLATFORM) {
  auth0 = initAuth0({
    baseURL: process.env.NEXT_PUBLIC_API_DOMAIN,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    secret: process.env.SESSION_COOKIE_SECRET,
    authorizationParams: {
      scope: 'openid profile email offline_access',
      audience: process.env.AUTH0_AUDIENCE,
    },
    routes: {
      callback: `/platform/auth0-callback`,
      postLogoutRedirect: '/',
    },
    session: {
      rollingDuration: 60 * 60 * 24,
      absoluteDuration: 60 * 60 * 24 * 7,
      cookie: {
        sameSite: 'lax',
        domain: process.env.COOKIE_DOMAIN || 'localhost',
      },
    },
  })
}

export { auth0 }
