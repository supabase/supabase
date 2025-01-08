import { LOCAL_STORAGE_KEYS } from './constants'
import { makeRandomString } from './helpers'

const GITLAB_INTEGRATION_APP_NAME =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
    ? `<todo>`
    : process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? `<todo>`
      : `supabase-local-testing`

const GITLAB_INTEGRATION_CLIENT_ID =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
    ? `<todo>`
    : process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? `<todo>`
      : `135a5e5431501d073c92cb8b767f8f4a80bc3bc961e60c268a3f417fb2cdbe50`

console.log(process.env.NEXT_PUBLIC_ENVIRONMENT)

const GITLAB_INTEGRATION_REDIRECT_URI =
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
    ? `<todo>`
    : process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? `<todo>`
      : `http://localhost:8082/integrations/gitlab/authorize`

const GITLAB_INTEGRATION_AUTHORIZATION_URL = `https://gitlab.com/oauth/authorize?client_id=${GITLAB_INTEGRATION_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(GITLAB_INTEGRATION_REDIRECT_URI)}`
// export const GITHUB_INTEGRATION_INSTALLATION_URL = `https://github.com/apps/${GITHUB_INTEGRATION_APP_NAME}/installations/new`
// export const GITHUB_INTEGRATION_REVOKE_AUTHORIZATION_URL = `https://github.com/settings/connections/applications/${GITHUB_INTEGRATION_CLIENT_ID}`

export function openInstallGitLabIntegrationWindow(type: 'install' | 'authorize') {
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
  // if (type === 'install') {
  //   windowUrl = GITHUB_INTEGRATION_INSTALLATION_URL
  // } else if (type === 'authorize') {
  const state = makeRandomString(32)
  localStorage.setItem(LOCAL_STORAGE_KEYS.GITLAB_AUTHORIZATION_STATE, state)
  windowUrl = `${GITLAB_INTEGRATION_AUTHORIZATION_URL}&state=${state}`
  // }

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
