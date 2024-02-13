export function openInstallGitHubIntegrationWindow() {
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

  const systemZoom = width / window.screen.availWidth
  const left = (width - w) / 2 / systemZoom + dualScreenLeft
  const top = (height - h) / 2 / systemZoom + dualScreenTop
  const newWindow = window.open(
    `https://github.com/apps/supabase-local-testing-2-0/installations/new`,
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
