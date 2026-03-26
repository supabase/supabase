import { ContextBadge } from 'ui-patterns/ContextBadge'

export default function ContextBadgeDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <ContextBadge>Team</ContextBadge>
      <ContextBadge variant="warning">Production</ContextBadge>
      <ContextBadge variant="success">Preview</ContextBadge>
      <ContextBadge variant="destructive">Over limit</ContextBadge>
    </div>
  )
}
