import { Markdown } from 'ui-patterns/Markdown'

export default function MarkdownImagesDemo() {
  return (
    <Markdown>{`![Supabase Logo](https://avatars.githubusercontent.com/u/54469796?s=200&v=4)

Image with alt text for accessibility.`}</Markdown>
  )
}
