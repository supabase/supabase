import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonOutline() {
  return (
    <div className="flex gap-3">
      <Button variant="outline">Button rest</Button>
      <Button variant="outline" loading>
        Button loading
      </Button>
      <Button variant="outline" icon={<Mail />}>
        Button icon
      </Button>
      <Button variant="outline" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
