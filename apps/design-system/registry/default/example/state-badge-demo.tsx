import { StateBadge } from 'ui-patterns/StateBadge'

export default function StateBadgeDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <StateBadge state="enabled" />
      <StateBadge state="disabled" />
      <StateBadge state="enabled">Active</StateBadge>
      <StateBadge state="disabled">Inactive</StateBadge>
    </div>
  )
}
