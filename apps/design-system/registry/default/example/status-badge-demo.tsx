import { StatusBadge } from 'ui-patterns/StatusBadge'

export default function StatusBadgeDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="success" />
      <StatusBadge status="failure" />
      <StatusBadge status="pending" />
      <StatusBadge status="inactive" />
      <StatusBadge status="skipped" />
      <StatusBadge status="unknown" />
      <StatusBadge status="pending">Retrying</StatusBadge>
    </div>
  )
}
