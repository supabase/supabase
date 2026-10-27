import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

export default function AdmonitionResponsiveActionsDemo() {
  return (
    <Admonition
      type="default"
      layout="responsive"
      title="Disk management has moved"
      description="Manage your project's compute and disk settings together."
      actions={
        <>
          <Button>Go to Compute and Disk</Button>
          <Button>Learn more</Button>
        </>
      }
    />
  )
}
