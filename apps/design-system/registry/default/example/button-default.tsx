import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonDemo() {
  return (
    <div className="flex gap-3">
      <Button type="default">Button rest</Button>
      <Button type="default" loading>
        Button loading
      </Button>
      <Button type="default" icon={<Mail />}>
        Button icon
      </Button>
      <Button type="default" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
