import { Markdown } from 'ui-patterns/Markdown'

export default function MarkdownTablesDemo() {
  return (
    <Markdown>{`| Feature | Support | Status |
|---------|---------|--------|
| Headings | h1–h6 | ✓ |
| Lists | Unordered & Ordered | ✓ |
| Code | Inline & Blocks | ✓ |
| Tables | GitHub Flavored | ✓ |`}</Markdown>
  )
}
