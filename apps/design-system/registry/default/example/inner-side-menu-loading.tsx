import { Card } from 'ui'
import {
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuItemLoading,
  InnerSideMenuSeparator,
} from 'ui-patterns/InnerSideMenu'

export default function InnerSideMenuLoading() {
  return (
    <Card className="w-64 py-4 flex flex-col gap-4 bg-dash-sidebar">
      <InnerSideMenuCollapsible defaultOpen>
        <InnerSideMenuCollapsibleTrigger title="Functions" />
        <InnerSideMenuCollapsibleContent className="pt-2">
          <InnerSideMenuItemLoading />
          <InnerSideMenuItemLoading />
          <InnerSideMenuItemLoading />
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
      <InnerSideMenuSeparator />
      <InnerSideMenuCollapsible defaultOpen>
        <InnerSideMenuCollapsibleTrigger title="Functions" />
        <InnerSideMenuCollapsibleContent className="pt-2">
          <InnerSideMenuItemLoading />
          <InnerSideMenuItemLoading />
          <InnerSideMenuItemLoading />
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
    </Card>
  )
}
