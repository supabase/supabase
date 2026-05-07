import { codeToHtml } from 'shiki'

import type { GoCodeBlockSection } from '../schemas'
import CodeBlockTabs from './CodeBlockTabs'
import { supabaseDark, supabaseLight } from './codeThemes'

const lineNumberStyles = `
  .go-code code { counter-reset: line; }
  .go-code code .line { counter-increment: line; }
  .go-code code .line::before {
    content: counter(line);
    display: inline-block;
    width: 2ch;
    margin-right: 1.5ch;
    text-align: right;
    color: hsl(var(--foreground-light));
    opacity: 0.35;
  }
`

async function highlightCode(code: string, language: string) {
  const [darkHtml, lightHtml] = await Promise.all([
    codeToHtml(code, { lang: language, theme: supabaseDark }),
    codeToHtml(code, { lang: language, theme: supabaseLight }),
  ])
  return { darkHtml, lightHtml }
}

export default async function CodeBlockSection({ section }: { section: GoCodeBlockSection }) {
  const isMultiFile = section.files && section.files.length > 0
  const isSingleFileWithName = !isMultiFile && section.filename && section.code

  // Build the highlighted files array
  const highlightedFiles = isMultiFile
    ? await Promise.all(
        section.files!.map(async (file) => {
          const { darkHtml, lightHtml } = await highlightCode(file.code, file.language ?? 'sql')
          return { filename: file.filename, darkHtml, lightHtml }
        })
      )
    : section.code
      ? [
          {
            filename: section.filename ?? '',
            ...(await highlightCode(section.code, section.language ?? 'sql')),
          },
        ]
      : []

  const showTabs =
    highlightedFiles.length > 1 || (highlightedFiles.length === 1 && isSingleFileWithName)

  return (
    <div className="max-w-[80rem] w-full min-w-0 mx-auto px-8">
      {(section.title || section.description) && (
        <div className="mb-12">
          {section.title && (
            <h2 className="text-2xl sm:text-3xl font-medium text-foreground">{section.title}</h2>
          )}
          {section.description && (
            <p className="text-foreground-lighter mt-3 text-lg">{section.description}</p>
          )}
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: lineNumberStyles }} />
      <div className="go-code border border-muted rounded-xl overflow-hidden w-full">
        {showTabs ? (
          <CodeBlockTabs files={highlightedFiles} />
        ) : highlightedFiles.length === 1 ? (
          <>
            <div
              className="hidden dark:block px-5 py-4 sm:px-6 sm:py-5 overflow-x-auto text-[13px] leading-[1.6] [&_pre]:!bg-transparent [&_pre]:!m-0 [&_code]:font-mono"
              dangerouslySetInnerHTML={{ __html: highlightedFiles[0].darkHtml }}
            />
            <div
              className="block dark:hidden px-5 py-4 sm:px-6 sm:py-5 overflow-x-auto text-[13px] leading-[1.6] [&_pre]:!bg-transparent [&_pre]:!m-0 [&_code]:font-mono"
              dangerouslySetInnerHTML={{ __html: highlightedFiles[0].lightHtml }}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
