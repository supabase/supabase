import { useParams } from 'common'
import { ActivityIcon } from 'lucide-react'
import Link from 'next/link'
import { Button, Card, CardContent } from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

export const WarehouseObservabilitySection = () => {
  const { ref: projectRef } = useParams()

  return (
    <PageSection className="pt-5!">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Metrics</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent>
            <FormLayout
              layout="flex-row-reverse"
              label="Monitor Supabase Warehouse"
              description="Track query volume, latency, failures, and worker capacity."
            >
              <Button asChild variant="default" icon={<ActivityIcon size={14} />}>
                <Link href={`/project/${projectRef}/observability/warehouse`}>View metrics</Link>
              </Button>
            </FormLayout>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
