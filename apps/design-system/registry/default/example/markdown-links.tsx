import { Markdown } from 'ui-patterns/Markdown'

export default function MarkdownLinksDemo() {
  return (
    <Markdown>{`This is a [link to Supabase](https://supabase.com) in the middle of text.

You can also have [multiple links](https://github.com) in one [paragraph](https://docs.supabase.com).`}</Markdown>
  )
}
