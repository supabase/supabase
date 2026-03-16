import { AlertCollapsible } from 'ui'

export default function AlertCollapsibleDemo() {
  return (
    <AlertCollapsible trigger="Need help?">
      <p className="text-sm text-foreground-light">
        Try a different browser or disable extensions that block network requests.
      </p>
    </AlertCollapsible>
  )
}
