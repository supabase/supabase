import { useQuery } from '@tanstack/react-query'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { getItemsAffectingProjectCreation } from './RegionSelector.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { statusPageQueryOptions } from '@/data/platform/status-page-query'
import { normalizeStatusPage } from '@/lib/status-page/status-page.utils'

export const ProjectCreationStatusAdmonition = ({
  selectedRegionCode,
}: {
  selectedRegionCode?: string
}) => {
  const { data } = useQuery({ ...statusPageQueryOptions(), select: normalizeStatusPage })
  if (!data) return null

  const items = getItemsAffectingProjectCreation(data.items, selectedRegionCode)
  if (items.length === 0) return null

  return (
    <FormItemLayout layout="horizontal">
      <Admonition
        type="warning"
        title="Incident in progress for this region"
        description={
          <>
            We're currently investigating an issue that may impact projects in this region. Follow
            updates on <InlineLink href={data.pageUrl}>status page</InlineLink>.
          </>
        }
        className="mt-3"
      />
    </FormItemLayout>
  )
}
