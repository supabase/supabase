import React from 'react'
import {
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuItem,
  InnerSideMenuSeparator,
} from 'ui-patterns/InnerSideMenu'

export default function InnerSideMenuMultipleSections() {
  return (
    <div className="w-64">
      <InnerSideMenuCollapsible>
        <InnerSideMenuCollapsibleTrigger title="Development" />
        <InnerSideMenuCollapsibleContent>
          <InnerSideMenuItem href="#" isActive>
            API
          </InnerSideMenuItem>
          <InnerSideMenuItem href="#">Database</InnerSideMenuItem>
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
      <InnerSideMenuSeparator />
      <InnerSideMenuCollapsible>
        <InnerSideMenuCollapsibleTrigger title="Analytics" />
        <InnerSideMenuCollapsibleContent>
          <InnerSideMenuItem href="#">Reports</InnerSideMenuItem>
          <InnerSideMenuItem href="#">Usage</InnerSideMenuItem>
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
    </div>
  )
}
