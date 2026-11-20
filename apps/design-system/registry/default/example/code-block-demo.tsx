import { CodeBlockControls } from 'ui-patterns/CodeBlock/CodeBlockControls'
import {
  CodeBlockFrame,
  CodeBlockTokens,
  type CodeToken,
} from 'ui-patterns/CodeBlock/CodeBlockFrame'

// apps make these tokens with highlightCode and getTokenClassName, on the server or at build time
const LINES: Array<Array<CodeToken>> = [
  [
    ['import', 's-k'],
    [' { ', 's-p'],
    [
      'createClient',
      's-v',
      [{ text: 'function createClient(supabaseUrl: string, supabaseKey: string): SupabaseClient' }],
    ],
    [' } ', 's-p'],
    ['from', 's-k'],
    [' ', 's-f'],
    ["'@supabase/supabase-js'", 's-s'],
  ],
  [],
  [
    ['const', 's-k'],
    [' supabase ', 's-v'],
    ['=', 's-k'],
    [' ', 's-f'],
    ['createClient', 's-u'],
    ['(', 's-p'],
    ["'https://your-project-id.supabase.co'", 's-s'],
    [', ', 's-p'],
    ["'sb_publishable_...'", 's-s'],
    [')', 's-p'],
  ],
  [
    ['const', 's-k'],
    [' { ', 's-p'],
    ['data', 's-v'],
    [' } ', 's-p'],
    ['=', 's-k'],
    [' ', 's-f'],
    ['await', 's-k'],
    [' supabase', 's-v'],
    ['.', 's-p'],
    ['from', 's-u'],
    ['(', 's-p'],
    ["'countries'", 's-s'],
    [')', 's-p'],
    ['.', 's-p'],
    ['select', 's-u'],
    ['()', 's-p'],
  ],
]

const SOURCE = LINES.map((line) => line.map(([content]) => content).join('')).join('\n')

export default function CodeBlockDemo() {
  return (
    <CodeBlockFrame
      lang="ts"
      lineCount={LINES.length}
      controls={<CodeBlockControls content={SOURCE} />}
    >
      <CodeBlockTokens lineNumbers lines={LINES} />
    </CodeBlockFrame>
  )
}
