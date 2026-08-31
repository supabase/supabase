import { Markdown } from 'ui-patterns/Markdown'

export default function MarkdownInlineCodeDemo() {
  return (
    <Markdown>{`Use the \`useState\` hook for state management.

The \`useEffect\` hook runs side effects after render.

Functions like \`map()\`, \`filter()\`, and \`reduce()\` are common.`}</Markdown>
  )
}
