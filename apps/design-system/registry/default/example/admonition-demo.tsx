import { Admonition } from 'ui-patterns/admonition'

export default function AdmonitionDemo() {
  return (
    <Admonition
      type="default"
      title="Is it accessible?"
      description="Yes. It adheres to the WAI-ARIA design pattern."
    />
  )
}
