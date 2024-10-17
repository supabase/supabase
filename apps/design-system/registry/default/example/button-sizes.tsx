import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonDemo() {
  return (
    <div className="flex gap-3">
      <Button type="default" size="tiny">
        Tiny Button
      </Button>
      <Button type="default" size="small">
        Small button
      </Button>
      <Button type="default" size="medium">
        Medium button
      </Button>
      <Button type="default" size="large">
        Large button
      </Button>
      <Button type="default" size="xlarge">
        Huge button
      </Button>
    </div>
  )
}
