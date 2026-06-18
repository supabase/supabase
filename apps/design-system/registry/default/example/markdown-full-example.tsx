import { Markdown } from 'ui-patterns/Markdown'

export default function MarkdownFullExample() {
  const content = `# Main Heading

This is a paragraph with some **bold text**, *italic text*, and \`inline code\`.

## Subheading

You can use [links](https://supabase.com) in your content.

### Code Example

\`\`\`javascript
const greeting = 'Hello, Markdown!'
console.log(greeting)
\`\`\`

### Lists

**Unordered list:**
- First item
- Second item
  - Nested item
  - Another nested item
- Third item

**Ordered list:**
1. First step
2. Second step
3. Third step

### Blockquote

> This is a blockquote. It can span multiple lines and is useful for emphasizing important information or highlighting quotes.

### Horizontal Rule

---

### Table

| Feature | Support | Status |
|---------|---------|--------|
| Headings | h1–h6 | ✓ |
| Lists | Unordered & Ordered | ✓ |
| Code | Inline & Blocks | ✓ |
| Tables | GitHub Flavored | ✓ |`

  return <Markdown codeBlock>{content}</Markdown>
}
