import type { StepContentProps } from '../../../../../Connect.types'

function CodexVerifyContent(_props: StepContentProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground-light">
        Run <code className="text-xs bg-surface-300 px-1 py-0.5 rounded">/mcp</code> inside Codex to
        verify authentication.
      </p>
    </div>
  )
}

export default CodexVerifyContent
