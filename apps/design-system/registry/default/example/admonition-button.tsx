import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export default function AdmonitionDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Admonition
        type="warning"
        layout="horizontal"
        title="Set up custom SMTP"
        description="You’re using the built-in email service. This service has rate limits and is not meant to be
        used for production apps."
        actions={<Button type="default">Set up SMTP</Button>}
      />
      <Admonition
        type="destructive"
        layout="horizontal"
        title="Deleting this organization will also remove its projects"
        description="Make sure you have made a backup of your projects if you want to keep your data."
        actions={<Button type="danger">Delete organization</Button>}
      />
    </div>
  )
}
