import { Admonition } from 'ui-patterns/admonition'
import { CodeBlock } from 'ui-patterns/CodeBlock'

const CONFIG_SNIPPET = `[storage.vector]
enabled = true
max_buckets = 10
max_indexes = 5`

/**
 * Shown on the local CLI when listing vector buckets fails — most commonly
 * because `[storage.vector]` is not enabled in `config.toml`. Studio can't read
 * `config.toml` directly, so we surface the snippet to enable the feature rather
 * than the generic "contact support" error.
 */
export const VectorBucketsLocalDisabledState = () => {
  return (
    <Admonition type="default" title="Vector buckets are not enabled">
      <p className="text-foreground-light">
        To use vector buckets locally, enable them in your{' '}
        <code className="text-code-inline">supabase/config.toml</code> and restart with{' '}
        <code className="text-code-inline">supabase start</code>.
      </p>
      <CodeBlock language="toml" hideLineNumbers className="mt-2 max-w-full">
        {CONFIG_SNIPPET}
      </CodeBlock>
    </Admonition>
  )
}
