import { useIsAdvisorRulesEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { Badge, Button } from 'ui'
import { FeaturePreviewSidebarPanel } from '../../ui/FeaturePreviewSidebarPanel'
import { generateAdvisorsMenu } from './AdvisorsMenu.utils'

interface AdvisorsSidebarMenuProps {
  page?: string
}

export function AdvisorsSidebarMenu({ page }: AdvisorsSidebarMenuProps) {
  const { data: project } = useSelectedProjectQuery()
  const advisorRules = useIsAdvisorRulesEnabled()
  const { toggleSidebar } = useSidebarManagerSnapshot()

  const handleOpenAdvisor = () => {
    toggleSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
  }

  return (
    <div className="pb-12 relative">
      <FeaturePreviewSidebarPanel
        className="mx-4 mt-4"
        title="Moving to the toolbar"
        description="Advisors are now available in the top toolbar for quicker access across the dashboard."
        illustration={<Badge variant="success">New</Badge>}
        actions={
          <Button size="tiny" type="default" onClick={handleOpenAdvisor}>
            Try it now
          </Button>
        }
      />

      <ProductMenu page={page} menu={generateAdvisorsMenu(project, { advisorRules })} />
    </div>
  )
}
