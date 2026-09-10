import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonDestructive() {
  return (
    <div className="flex gap-3">
      <Button variant="danger">Button rest</Button>
      <Button variant="danger" loading>
        Button loading
      </Button>
      <Button variant="danger" icon={<Mail />}>
        Button icon
      </Button>
      <Button variant="danger" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
