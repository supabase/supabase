'use client'

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

import { toPrismLanguage } from '../../lib/code-language'
import { NamedCodeBlock } from './NamedCodeBlock'

function isFileName(lang: string): boolean {
  if (lang === 'terminal' || lang === 'text') return false
  return lang.includes('/') || lang.includes('.')
}

const codeBlockStyle = {
  margin: 0,
  background: 'hsl(var(--background-surface-100))',
  padding: '1rem',
  fontSize: '0.8125rem',
  lineHeight: 1.4,
  borderRadius: 'var(--radius-md)',
  border: '1px solid hsl(var(--border-default))',
}

export function GuideCodeBlock({ lang, code }: { lang: string; code: string }) {
  const language = toPrismLanguage(lang)

  const codeBlock = (
    <SyntaxHighlighter
      language={language}
      style={oneDark}
      wrapLongLines
      customStyle={codeBlockStyle}
      codeTagProps={{ className: 'font-mono !bg-transparent' }}
    >
      {code}
    </SyntaxHighlighter>
  )

  if (isFileName(lang)) {
    return <NamedCodeBlock name={lang}>{codeBlock}</NamedCodeBlock>
  }

  return <div className="not-prose">{codeBlock}</div>
}
