const AI_SIDEBAR_WARNING_DISMISSED_COOKIE = 'docs-ai-sidebar-warning-dismissed'
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

function isAiSidebarWarningDismissed() {
  if (typeof document === 'undefined') return false

  return document.cookie
    .split(';')
    .some((cookie) => cookie.trim().startsWith(`${AI_SIDEBAR_WARNING_DISMISSED_COOKIE}=`))
}

function dismissAiSidebarWarning() {
  if (typeof document === 'undefined') return

  document.cookie = `${AI_SIDEBAR_WARNING_DISMISSED_COOKIE}=1; path=/; max-age=${ONE_YEAR_IN_SECONDS}; SameSite=Lax`
}

export { dismissAiSidebarWarning, isAiSidebarWarningDismissed }
