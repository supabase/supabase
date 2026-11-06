import { Badge } from 'ui'

export default function BadgeState() {
  return (
    <div className="flex flex-row gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  )
}
