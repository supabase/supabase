import { useProjectLintsQuery } from 'data/lint/lint-query'

export const AdvisorBadge = ({ projectRef }: { projectRef?: string }) => {
  const { data: lints } = useProjectLintsQuery({ projectRef })

  const hasCriticalIssues = Array.isArray(lints) && lints.some((lint) => lint.level === 'ERROR')

  if (!hasCriticalIssues) return null

  return <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
}
