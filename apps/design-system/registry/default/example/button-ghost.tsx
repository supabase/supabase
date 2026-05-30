import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonGhost() {
  return (
    <div className="flex gap-3">
      <Button type="text">Button rest</Button>
      <Button type="text" loading>
        Button loading
      </Button>
      <Button type="text" icon={<Mail />}>
        Button icon
      </Button>
      <Button type="text" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
