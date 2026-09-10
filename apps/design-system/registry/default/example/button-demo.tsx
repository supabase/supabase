import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonDemo() {
  return (
    <div className="flex gap-3">
      <Button variant="primary">Button rest</Button>
      <Button variant="primary" loading>
        Button loading
      </Button>
      <Button variant="primary" icon={<Mail />}>
        Button icon
      </Button>
      <Button variant="primary" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
