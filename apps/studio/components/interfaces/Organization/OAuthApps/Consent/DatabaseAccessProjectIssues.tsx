import { Admonition } from 'ui-patterns/Admonition'

const issueDescriptions = {
  postgres_upgrade_required: 'Needs Postgres 17 or later.',
  project_unavailable: 'The database is currently unavailable.',
} as const

export function DatabaseAccessProjectIssues({
  projects,
  canDeselectProjects,
}: {
  projects: { name: string; issue: keyof typeof issueDescriptions }[]
  canDeselectProjects: boolean
}) {
  return (
    <Admonition
      type="warning"
      title="These projects require changes first"
      description={
        canDeselectProjects ? 'Fix or deselect them to continue.' : 'Fix them to continue.'
      }
    >
      <div className="divide-y text-xs">
        {Object.entries(issueDescriptions).map(([issue, description]) => {
          const names = projects
            .filter((project) => project.issue === issue)
            .map((project) => project.name)
          if (names.length === 0) return null

          return (
            <div key={issue} className="py-1.5">
              <p className="font-medium text-foreground">{names.join(', ')}</p>
              <p>{description}</p>
            </div>
          )
        })}
      </div>
    </Admonition>
  )
}
