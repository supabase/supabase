import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonLink() {
  return (
    <div className="flex gap-3">
      <Button variant="link">Button rest</Button>
      <Button variant="link" loading>
        Button loading
      </Button>
      <Button variant="link" icon={<Mail />}>
        Button icon
      </Button>
      <Button variant="link" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
