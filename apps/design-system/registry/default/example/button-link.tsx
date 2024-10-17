import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonLink() {
  return (
    <div className="flex gap-3">
      <Button type="link">Button rest</Button>
      <Button type="link" loading>
        Button loading
      </Button>
      <Button type="link" icon={<Mail />}>
        Button icon
      </Button>
      <Button type="link" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
