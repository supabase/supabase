import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonOutline() {
  return (
    <div className="flex gap-3">
      <Button type="outline">Button rest</Button>
      <Button type="outline" loading>
        Button loading
      </Button>
      <Button type="outline" icon={<Mail />}>
        Button icon
      </Button>
      <Button type="outline" iconRight={<Mail />}>
        Button iconRight
      </Button>
    </div>
  )
}
