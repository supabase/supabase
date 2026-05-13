import { ExpandableAlert } from 'ui-patterns/expandable-alert'

export default function ExpandableAlertDemo() {
  return (
    <ExpandableAlert trigger="Need help?">
      <p className="text-sm text-foreground-light">
        Try a different browser or disable extensions that block network requests.
      </p>
    </ExpandableAlert>
  )
}
