import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonDestructive() {
  return (
    <div className="flex gap-3">
      <Button type="danger">Button rest</Button>
      <Button type="danger" loading>
        Button loading
      </Button>
      <Button type="danger" icon={<Mail />}>
        Button icon
      </Button>
      <Button type="danger" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
