import { CollapsibleAlert } from 'ui-patterns/collapsible-alert'

export default function CollapsibleAlertDemo() {
  return (
    <CollapsibleAlert trigger="Need help?">
      <p className="text-sm text-foreground-light">
        Try a different browser or disable extensions that block network requests.
      </p>
    </CollapsibleAlert>
  )
}
