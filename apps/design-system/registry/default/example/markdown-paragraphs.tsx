import { Markdown } from 'ui-patterns/Markdown'

export default function MarkdownParagraphsDemo() {
  return (
    <Markdown>{`First paragraph with text.

Second paragraph with **bold** and *italic* text.

Third paragraph for spacing demonstration.`}</Markdown>
  )
}
