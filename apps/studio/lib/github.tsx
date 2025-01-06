import { LOCAL_STORAGE_KEYS } from './constants'
import { makeRandomString } from './helpers'

const GITHUB_INTEGRATION_APP_NAME =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
    ? `supabase`
    : process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? `supabase-staging`
      : `supabase-local-testing`

const GITHUB_INTEGRATION_CLIENT_ID =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
    ? `Iv1.b91a6d8eaa272168`
    : process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? `Iv1.2681ab9a0360d8ad`
      : `Iv1.5022a3b44d150fbf`

const GITHUB_INTEGRATION_AUTHORIZATION_URL = `https://github.com/login/oauth/authorize?client_id=${GITHUB_INTEGRATION_CLIENT_ID}`
export const GITHUB_INTEGRATION_INSTALLATION_URL = `https://github.com/apps/${GITHUB_INTEGRATION_APP_NAME}/installations/new`
export const GITHUB_INTEGRATION_REVOKE_AUTHORIZATION_URL = `https://github.com/settings/connections/applications/${GITHUB_INTEGRATION_CLIENT_ID}`

export function openInstallGitHubIntegrationWindow(type: 'install' | 'authorize') {
  const w = 600
  const h = 800

  const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX
  const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY

  const width = window.innerWidth
    ? window.innerWidth
    : document.documentElement.clientWidth
      ? document.documentElement.clientWidth
      : screen.width
  const height = window.innerHeight
    ? window.innerHeight
    : document.documentElement.clientHeight
      ? document.documentElement.clientHeight
      : screen.height

  let windowUrl
  if (type === 'install') {
    windowUrl = GITHUB_INTEGRATION_INSTALLATION_URL
  } else if (type === 'authorize') {
    const state = makeRandomString(32)
    localStorage.setItem(LOCAL_STORAGE_KEYS.GITHUB_AUTHORIZATION_STATE, state)
    windowUrl = `${GITHUB_INTEGRATION_AUTHORIZATION_URL}&state=${state}`
  }

  const systemZoom = width / window.screen.availWidth
  const left = (width - w) / 2 / systemZoom + dualScreenLeft
  const top = (height - h) / 2 / systemZoom + dualScreenTop
  const newWindow = window.open(
    windowUrl,
    'GitHub',
    `scrollbars=yes,resizable=no,status=no,location=no,toolbar=no,menubar=no,
     width=${w / systemZoom}, 
     height=${h / systemZoom}, 
     top=${top}, 
     left=${left}
     `
  )
  if (newWindow) {
    newWindow.focus()
  }
}
