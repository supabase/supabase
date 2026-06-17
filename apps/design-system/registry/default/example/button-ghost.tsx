import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonGhost() {
  return (
    <div className="flex gap-3">
      <Button variant="text">Button rest</Button>
      <Button variant="text" loading>
        Button loading
      </Button>
      <Button variant="text" icon={<Mail />}>
        Button icon
      </Button>
      <Button variant="text" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
