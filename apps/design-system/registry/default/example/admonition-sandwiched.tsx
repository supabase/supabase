import { Button, Card, CardContent, CardHeader, CardTitle } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export default function AdmonitionDemo() {
  return (
    <Card>
      <CardHeader className="border-b-0">
        <CardTitle>Card with Admonition</CardTitle>
      </CardHeader>
      <Admonition
        type="warning"
        layout="horizontal"
        title="Sandwiched Admonition"
        description="This Admonition is sandwiched between other content in a Card component. Note how the top border and all radii are reset."
        className="mb-0 rounded-none border-x-0"
      />
      <CardContent>
        <p className="text-foreground-light text-sm">
          This is the subsequent content of this Card.
        </p>
      </CardContent>
      <CardContent>
        <p className="text-foreground-light text-sm">
          It might be disabled due some condition that the Admonition above explains.
        </p>
      </CardContent>
    </Card>
  )
}
