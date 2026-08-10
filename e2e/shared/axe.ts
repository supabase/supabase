interface AxeNodeLike {
  target: unknown[]
  html: string
}

interface AxeViolationLike {
  id: string
  impact?: string | null
  help: string
  nodes: AxeNodeLike[]
}

export const MAX_REPORTED_NODES = 5

export const MAX_REPORTED_HTML = 200

export function violationIds(violations: AxeViolationLike[]): string[] {
  return violations.map((violation) => violation.id)
}

export function formatViolations(
  violations: AxeViolationLike[],
  maxNodes: number = MAX_REPORTED_NODES
): string {
  return violations
    .map((violation) => {
      const shown = violation.nodes.slice(0, maxNodes)
      const hidden = violation.nodes.length - shown.length
      const nodes = shown
        .map(
          (node) => `    ${node.target.join(' ')}\n      ${node.html.slice(0, MAX_REPORTED_HTML)}`
        )
        .join('\n')
      const more = hidden > 0 ? `\n    … +${hidden} more node(s)` : ''

      return (
        `${violation.id} (${violation.impact ?? 'unknown'}, ${violation.nodes.length} node(s)): ` +
        `${violation.help}\n${nodes}${more}`
      )
    })
    .join('\n')
}
