import { Markdown } from 'ui-patterns/Markdown'

export default function MarkdownBlockquotesDemo() {
  return (
    <Markdown>{`> This is a blockquote with important information.

> Blockquotes can span multiple lines and are useful for
> emphasizing key points or highlighting quotes.`}</Markdown>
  )
}
