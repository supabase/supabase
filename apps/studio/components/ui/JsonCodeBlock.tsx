import { CodeBlock } from 'ui-patterns/CodeBlock'

export function JsonCodeBlock({ children }: { children: string }) {
  return (
    <CodeBlock
      language="json"
      hideCopy
      wrapperClassName="!overflow-visible bg-surface-100/50 [&_pre]:!bg-surface-100/50"
      className="rounded-none border-none !overflow-x-visible [&_code]:!leading-tight [&_pre]:!leading-tight"
    >
      {children}
    </CodeBlock>
  )
}
