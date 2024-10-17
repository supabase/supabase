import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonDemo() {
  return (
    <div className="flex gap-3">
      <Button type="warning">Button rest</Button>
      <Button type="warning" loading>
        Button loading
      </Button>
      <Button type="warning" icon={<Mail />}>
        Button icon
      </Button>
      <Button type="warning" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
