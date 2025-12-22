import type { Components } from 'react-markdown'

export const markdownComponents: Components = {
  code: ({ node, inline, ...props }) =>
    inline ? (
      <code
        {...props}
        className="bg-surface-200 text-foreground px-1.5 py-0.5 rounded text-sm font-mono"
      />
    ) : (
      <code {...props} className="font-mono text-sm" />
    ),
  pre: ({ node, ...props }) => (
    <pre
      {...props}
      className="bg-surface-200 text-foreground p-4 rounded-lg overflow-x-auto mb-3 max-w-full"
    />
  ),
  a: ({ node, ...props }) => (
    <a
      {...props}
      className="text-brand hover:underline break-words"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  p: ({ node, ...props }) => <p {...props} className="mb-3 last:mb-0" />,
  ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5 space-y-1 mb-3" />,
  ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-5 space-y-1 mb-3" />,
}
