'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const CODE_LINES = [
  'jobs:',
  '  deploy:',
  '    runs-on: ubuntu-latest',
  '',
  '    steps:',
  '      - uses: actions/checkout@v4',
  '      - uses: supabase/setup-cli@v1',
  '        with:',
  '          version: latest',
  '      - run: supabase functions deploy',
]

type TokenType = 'key' | 'value' | 'punct' | 'dim' | 'plain'

interface Token {
  text: string
  type: TokenType
}

// Colors from supabase-light / supabase-dark shiki themes
const TOKEN_CLASS: Record<TokenType, string> = {
  key: '[color:#6b35dc] dark:[color:#bda4ff]',
  value: '[color:#f1a10d] dark:[color:#ffcda1]',
  punct: '[color:#a0a0a0] dark:[color:#ffffff99]',
  dim: '[color:#7e7e7e]',
  plain: '[color:#525252] dark:[color:#ffffff]',
}

function tokenizeLine(line: string): Token[] {
  if (!line.trim()) return [{ text: '\u00a0', type: 'plain' }]

  const indent = line.match(/^(\s*)/)?.[1] ?? ''
  const trimmed = line.trimStart()

  const tokens: Token[] = []
  if (indent) tokens.push({ text: indent, type: 'plain' })

  // List item: "- ..."
  if (trimmed.startsWith('- ')) {
    const rest = trimmed.slice(2)
    const ci = rest.indexOf(': ')
    tokens.push({ text: '- ', type: 'dim' })
    if (ci >= 0) {
      tokens.push({ text: rest.slice(0, ci), type: 'key' })
      tokens.push({ text: ': ', type: 'punct' })
      tokens.push({ text: rest.slice(ci + 2), type: 'value' })
    } else {
      tokens.push({ text: rest, type: 'value' })
    }
    return tokens
  }

  // "key: value"
  const ci = trimmed.indexOf(': ')
  if (ci >= 0) {
    tokens.push({ text: trimmed.slice(0, ci), type: 'key' })
    tokens.push({ text: ': ', type: 'punct' })
    tokens.push({ text: trimmed.slice(ci + 2), type: 'value' })
    return tokens
  }

  // "key:" only
  if (trimmed.endsWith(':')) {
    tokens.push({ text: trimmed.slice(0, -1), type: 'key' })
    tokens.push({ text: ':', type: 'punct' })
    return tokens
  }

  tokens.push({ text: trimmed, type: 'plain' })
  return tokens
}

const containerVariants = {
  visible: { transition: { staggerChildren: 0.08 } },
}

const lineVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.15, ease: 'easeOut' } },
}

export const CI = ({ isHovered = false }: { isHovered?: boolean }) => {
  const [hoverCount, setHoverCount] = useState(0)

  useEffect(() => {
    if (isHovered) setHoverCount((c) => c + 1)
  }, [isHovered])

  return (
    <div className="w-full h-full relative pl-4 xl:-mb-0 pt-4 sm:pt-4 border-b xl:border-none overflow-hidden">
      {/* CodeWindow shell */}
      <div className="relative rounded-2xl rounded-r-none rounded-b-none shadow-lg pt-0 w-full h-full bg-alternative-200 border border-r-0 border-b-0 flex flex-col">
        {/* Title bar */}
        <div className="w-full px-4 py-3 flex items-center gap-1.5 border-b">
          <div className="w-2 h-2 bg-border rounded-full" />
          <div className="w-2 h-2 bg-border rounded-full" />
          <div className="w-2 h-2 bg-border rounded-full" />
        </div>

        {/* Code area */}
        <div className="flex-1 rounded-lg rounded-r-none rounded-b-none overflow-hidden p-4 text-[13px] xl:text-sm font-mono leading-6 bg-surface-75 whitespace-pre">
          <motion.div
            key={hoverCount}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {CODE_LINES.map((line, i) => (
              <motion.div key={i} variants={lineVariants}>
                {tokenizeLine(line).map((token, j) => (
                  <span key={j} className={TOKEN_CLASS[token.type]}>
                    {token.text}
                  </span>
                ))}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
export default CI
