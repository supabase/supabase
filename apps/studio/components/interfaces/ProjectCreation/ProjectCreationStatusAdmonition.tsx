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
  const item = items[0]
  if (!item) return null

  const isMaintenance = item.kind === 'maintenance'
  const isRegionSpecific = item.projectCreationScope?.type === 'regions'

  return (
    <FormItemLayout layout="horizontal">
      <Admonition
        type="warning"
        title={isMaintenance ? 'Maintenance in progress' : 'Incident in progress'}
        description={
          <>
            {isMaintenance ? 'Maintenance' : 'An incident'} may affect project creation
            {isRegionSpecific ? ' in this region' : ''}. Follow updates on{' '}
            <InlineLink href={data.pageUrl}>status page</InlineLink>.
          </>
        }
        className="mt-3"
      />
    </FormItemLayout>
  )
}
