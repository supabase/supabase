import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonSecondary() {
  return (
    <div className="flex gap-3">
      <Button variant="secondary">Button rest</Button>
      <Button variant="secondary" loading>
        Button loading
      </Button>
      <Button variant="secondary" icon={<Mail />}>
        Button icon
      </Button>
      <Button variant="secondary" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
