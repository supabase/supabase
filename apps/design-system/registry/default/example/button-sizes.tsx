import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonDemo() {
  return (
    <div className="flex gap-3">
      <Button variant="default" size="tiny">
        Tiny Button
      </Button>
      <Button variant="default" size="small">
        Small button
      </Button>
      <Button variant="default" size="medium">
        Medium button
      </Button>
      <Button variant="default" size="large">
        Large button
      </Button>
      <Button variant="default" size="xlarge">
        Huge button
      </Button>
    </div>
  )
}
