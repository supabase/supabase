import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonDemo() {
  return (
    <div className="flex gap-3">
      <Button type="primary">Button rest</Button>
      <Button type="primary" loading>
        Button loading
      </Button>
      <Button type="primary" icon={<Mail />}>
        Button icon
      </Button>
      <Button type="primary" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
