import { CodeBlock } from 'ui-patterns/CodeBlock'

const HIGHLIGHT_CHARACTER_LIMIT = 20_000
const PREVIEW_CHARACTER_LIMIT = 100_000

export function LogJsonPreview({ json, isPartial = false }: { json: string; isPartial?: boolean }) {
  const isTruncated = isPartial || json.length > PREVIEW_CHARACTER_LIMIT
  return (
    <>
      {isTruncated && (
        <p className="px-4 py-2 text-sm text-foreground-light">
          Preview shortened. Use the copy button to get the complete JSON.
        </p>
      )}
      {json.length > HIGHLIGHT_CHARACTER_LIMIT ? (
        <pre className="p-4 font-mono text-xs whitespace-pre overflow-auto">
          {json.slice(0, PREVIEW_CHARACTER_LIMIT)}
        </pre>
      ) : (
        <CodeBlock
          language="json"
          hideCopy
          wrapperClassName="!overflow-visible bg-surface-100/50 [&_pre]:!bg-surface-100/50"
          className="rounded-none border-none !overflow-x-visible [&_code]:!leading-tight [&_pre]:!leading-tight"
        >
          {json}
        </CodeBlock>
      )}
    </>
  )
}
