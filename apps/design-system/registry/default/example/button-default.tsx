import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonDemo() {
  return (
    <div className="flex gap-3">
      <Button variant="default">Button rest</Button>
      <Button variant="default" loading>
        Button loading
      </Button>
      <Button variant="default" icon={<Mail />}>
        Button icon
      </Button>
      <Button variant="default" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
