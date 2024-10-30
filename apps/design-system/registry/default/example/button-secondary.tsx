import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonSecondary() {
  return (
    <div className="flex gap-3">
      <Button type="secondary">Button rest</Button>
      <Button type="secondary" loading>
        Button loading
      </Button>
      <Button type="secondary" icon={<Mail />}>
        Button icon
      </Button>
      <Button type="secondary" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
