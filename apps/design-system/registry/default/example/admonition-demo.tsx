import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export default function AdmonitionDemo() {
  return (
    <Admonition
      type="default"
      layout="horizontal"
      title="OAuth Server is disabled"
      description="Enable OAuth Server to make your project act as an identity provider for
            third-party applications."
      actions={<Button type="default">OAuth Server Settings</Button>}
    />
  )
}
