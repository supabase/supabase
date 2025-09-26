import { SupportCategories } from '@supabase/shared-types/out/constants'
import { InlineLink } from 'components/ui/InlineLink'
import { Admonition } from 'ui-patterns'

const className = 'col-span-2 mb-0'

export const IssueSuggestion = ({
  category,
  projectRef,
}: {
  category: string
  projectRef?: string
}) => {
  const baseUrl = `/project/${projectRef === 'no-project' ? '_' : projectRef}`

  if (category === SupportCategories.PROBLEM) {
    return (
      <Admonition
        type="default"
        className={className}
        title="Have you checked your project's logs?"
      >
        Logs can help you identify errors that you might be running into when using your project's
        API or client libraries. View logs for each product{' '}
        <InlineLink href={`${baseUrl}/logs/edge-logs`}>here</InlineLink>.
      </Admonition>
    )
  }

  if (category === SupportCategories.DATABASE_UNRESPONSIVE) {
    return (
      <Admonition
        type="default"
        className={className}
        title="Have you checked your project's infrastructure activity?"
      >
        High memory or low disk IO bandwidth may be slowing down your database. Verify by checking
        the infrastructure activity of your project{' '}
        <InlineLink href={`${baseUrl}/settings/infrastructure#infrastructure-activity`}>
          here
        </InlineLink>
        .
      </Admonition>
    )
  }

  if (category === SupportCategories.PERFORMANCE_ISSUES) {
    return (
      <Admonition
        type="default"
        className={className}
        title="Have you checked the Query Performance Advisor?"
      >
        Identify slow running queries and get actionable insights on how to optimize them with the
        Query Performance Advisor{' '}
        <InlineLink href={`${baseUrl}/settings/infrastructure#infrastructure-activity`}>
          here
        </InlineLink>
        .
      </Admonition>
    )
  }

  return null
}
