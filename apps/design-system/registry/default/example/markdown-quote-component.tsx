import { Markdown, Quote } from 'ui-patterns/Markdown'

export default function MarkdownQuoteComponentDemo() {
  const content = `> This is a powerful insight that deserves emphasis with attribution.`

  return (
    <Markdown
      components={{
        blockquote: (props) => (
          <Quote
            attribution="Jane Doe"
            src="https://avatars.githubusercontent.com/u/54469796?s=200&v=4"
            caption="Co-founder at Supabase"
            {...props}
          />
        ),
      }}
    >
      {content}
    </Markdown>
  )
}
