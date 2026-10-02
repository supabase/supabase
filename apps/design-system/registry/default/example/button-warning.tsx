import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonDemo() {
  return (
    <div className="flex gap-3">
      <Button variant="warning">Button rest</Button>
      <Button variant="warning" loading>
        Button loading
      </Button>
      <Button variant="warning" icon={<Mail />}>
        Button icon
      </Button>
      <Button variant="warning" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
