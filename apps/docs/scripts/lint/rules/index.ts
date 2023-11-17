import { Content } from 'mdast'

interface LintSuccess {
  success: true
}

export type ErrorSeverity = 'suggestion' | 'warning' | 'error'

interface LintError {
  error: true
  severity: ErrorSeverity
  message: string
}

type LintResult = LintSuccess | LintError

type Check = (content: Content) => LintResult

export function success(): LintSuccess {
  return {
    success: true,
  }
}

export function error(message: string, severity?: ErrorSeverity): LintError {
  return {
    error: true,
    severity: severity ?? 'warning',
    message,
  }
}

export function isSuccess(result: LintResult): result is LintSuccess {
  return 'success' in result && result.success
}

export class LintRule {
  readonly nodeTypes: Content['type'][]
  private check: Check

  constructor({
    check,
    nodeTypes,
  }: {
    check: Check
    nodeTypes: Content['type'][] | Content['type']
  }) {
    this.check = check
    this.nodeTypes = Array.isArray(nodeTypes) ? nodeTypes : [nodeTypes]
  }

  runRule(content: Content) {
    return this.check(content)
  }
}
