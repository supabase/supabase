import { SonnerToaster } from 'ui'
import { useConsentToast } from 'ui-patterns/consent'

export function ConsentIsland() {
  useConsentToast()
  const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
  return <SonnerToaster theme={theme} />
}
