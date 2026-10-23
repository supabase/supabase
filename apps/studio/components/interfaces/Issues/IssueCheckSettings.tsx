import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Card, CardContent, Switch } from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { CATEGORY_LABELS, ISSUE_CHECK_CATEGORIES } from './Issues.constants'
import { AlertError } from '@/components/ui/AlertError'
import { useIssueCheckUpdateMutation } from '@/data/issues/issue-check-update-mutation'
import { issueChecksQueryOptions, type IssueChecksData } from '@/data/issues/issue-checks-query'

export const IssueCheckSettings = () => (
  <>
    <PageHeader size="small">
      <PageHeaderMeta>
        <PageHeaderSummary>
          <PageHeaderTitle>Checks</PageHeaderTitle>
          <PageHeaderDescription>
            Checks look for security, health, and performance problems in your project and open an
            issue when they find one
          </PageHeaderDescription>
        </PageHeaderSummary>
      </PageHeaderMeta>
    </PageHeader>
    <PageContainer size="small" className="flex flex-col gap-8 pb-12">
      <CheckCategories />
    </PageContainer>
  </>
)

const CheckCategories = () => {
  const { ref } = useParams()
  const { data, isPending, isError, error } = useQuery(issueChecksQueryOptions({ projectRef: ref }))

  // Wrapped in a section so loading and error states get the same top spacing as the categories
  if (isPending || isError) {
    return (
      <PageSection>
        <PageSectionContent>
          {isPending && <GenericSkeletonLoader />}
          {isError && <AlertError error={error} subject="Failed to retrieve checks" />}
        </PageSectionContent>
      </PageSection>
    )
  }

  return ISSUE_CHECK_CATEGORIES.map((category) => {
    const checks = data.filter((check) => check.category === category)
    const enabledCount = checks.filter((check) => check.is_enabled).length
    return (
      <PageSection key={category} id={category}>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>{CATEGORY_LABELS[category]}</PageSectionTitle>
            <PageSectionDescription>
              {enabledCount} of {checks.length} enabled
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            {checks.map((check) => (
              <CheckSetting key={check.id} check={check} projectRef={ref ?? ''} />
            ))}
          </Card>
        </PageSectionContent>
      </PageSection>
    )
  })
}

const CheckSetting = ({
  check,
  projectRef,
}: {
  check: IssueChecksData[number]
  projectRef: string
}) => {
  const { mutate, isPending } = useIssueCheckUpdateMutation()
  const id = `issue-check-${check.id}`

  return (
    <CardContent>
      <FormLayout
        layout="flex-row-reverse"
        name={id}
        label={check.title}
        description={<span id={`${id}-summary`}>{check.summary}</span>}
      >
        <div className="flex justify-end">
          <Switch
            id={id}
            aria-label={check.title}
            aria-describedby={`${id}-summary`}
            checked={check.is_enabled}
            disabled={isPending}
            onCheckedChange={(isEnabled) => mutate({ projectRef, checkId: check.id, isEnabled })}
          />
        </div>
      </FormLayout>
    </CardContent>
  )
}
