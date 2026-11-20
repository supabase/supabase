import { createFileRoute } from '@tanstack/react-router'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { Addons } from '@/components/interfaces/Settings/Addons/Addons'

export const Route = createFileRoute('/project/$ref/settings/addons')({
  component: ProjectAddons,
  staticData: { settingsLayoutTitle: 'Add-ons' },
})

function ProjectAddons() {
  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Add-ons</PageHeaderTitle>
            <PageHeaderDescription>Level up your project with add-ons</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <Addons />
    </>
  )
}
