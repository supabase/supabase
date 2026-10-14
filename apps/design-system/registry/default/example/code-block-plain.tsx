import {
  CodeBlockFrame,
  CodeBlockTokens,
  type CodeToken,
} from 'ui-patterns/CodeBlock/CodeBlockFrame'

const LINES: Array<Array<CodeToken>> = [
  [
    ['npx', 's-u'],
    [' supabase ', 's-f'],
    ['init', 's-f'],
  ],
]

export default function CodeBlockPlain() {
  return (
    <CodeBlockFrame lang="sh" lineCount={LINES.length}>
      <CodeBlockTokens lineNumbers={false} lines={LINES} />
    </CodeBlockFrame>
  )
}
