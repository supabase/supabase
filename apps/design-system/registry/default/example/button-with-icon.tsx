import { Mail } from 'lucide-react'
import { Button } from 'ui'

export default function ButtonWithIcon() {
  return (
    <Button variant="primary" icon={<Mail />}>
      Sign in with email
    </Button>
  )
}
