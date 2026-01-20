import type { Components } from 'react-markdown'

export const markdownComponents: Components = {
  code: ({ node, inline, ...props }) =>
    inline ? (
      <code
        {...props}
        className="bg-surface-200 text-foreground px-1.5 py-0.5 rounded text-sm font-mono"
      />
    ) : (
      <code {...props} className="font-mono text-sm whitespace-pre block min-w-0" />
    ),
  pre: ({ node, ...props }) => (
    <pre
      {...props}
      className="bg-surface-200 text-foreground p-4 rounded-lg mb-3 w-full min-w-0 overflow-x-auto"
    />
  ),
  a: ({ node, ...props }) => (
    <a
      {...props}
      className="text-brand-link hover:underline break-all"
      target="_blank"
      rel="noopener noreferrer"
    />
  ),
  p: ({ node, ...props }) => <p {...props} className="mb-3 last:mb-0" />,
  ul: ({ node, ordered, ...props }) => <ul {...props} className="list-disc pl-5 space-y-1 mb-3" />,
  ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-5 space-y-1 mb-3" />,
}
