import type { Components } from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

const codeBlockStyle = {
  margin: '0 0 1rem',
  background: 'hsl(var(--background-surface-200))',
  padding: '1rem',
  fontSize: '0.875rem',
  lineHeight: 1.6,
  borderRadius: 'var(--radius-lg)',
}

export const templateMarkdownComponents: Components = {
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children, ...props }) => {
    const content = String(children).replace(/\n$/, '')
    const languageMatch = /language-(\w+)/.exec(className ?? '')
    const isFencedBlock = Boolean(languageMatch) || content.includes('\n')

    if (isFencedBlock) {
      const language = languageMatch?.[1] ?? 'text'

      return (
        <SyntaxHighlighter
          language={language === 'ts' ? 'typescript' : language}
          style={oneDark}
          wrapLongLines
          customStyle={codeBlockStyle}
          codeTagProps={{ className: 'font-mono !bg-transparent' }}
        >
          {content}
        </SyntaxHighlighter>
      )
    }

    return (
      <code
        {...props}
        className="rounded-sm border border-control bg-surface-200 px-1.5 py-0.5 font-mono text-[0.875em] text-foreground"
      >
        {children}
      </code>
    )
  },
  a: ({ ...props }) => (
    <a
      {...props}
      className="text-brand-link hover:underline break-all"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
}
