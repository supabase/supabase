import { Markdown } from 'ui-patterns/Markdown'

export default function MarkdownListsDemo() {
  return (
    <Markdown>{`**Unordered list:**
- Item 1
- Item 2
  - Nested item

**Ordered list:**
1. First step
2. Second step`}</Markdown>
  )
}
