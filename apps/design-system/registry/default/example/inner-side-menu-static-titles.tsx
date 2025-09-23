import React from 'react'
import { Card } from 'ui'
import {
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuItem,
  InnerSideMenuSeparator,
  InnerSideBarTitle,
} from 'ui-patterns/InnerSideMenu'

export default function InnerSideMenuBasic() {
  return (
    <Card className="min-w-60 bg-dash-sidebar py-4 flex flex-col gap-6 h-full">
      <div className="px-2">
        <InnerSideBarTitle className="mb-2">Projects</InnerSideBarTitle>
        <InnerSideMenuItem href="/">Dashboard</InnerSideMenuItem>
        <InnerSideMenuItem href="/">Team</InnerSideMenuItem>
        <InnerSideMenuItem href="/">Settings</InnerSideMenuItem>
      </div>
      <InnerSideMenuSeparator />
      <div className="px-2">
        <InnerSideBarTitle className="mb-2">Projects</InnerSideBarTitle>
        <InnerSideMenuItem href="/" title="Dashboard">
          Dashboard
        </InnerSideMenuItem>
        <InnerSideMenuItem href="/">Team</InnerSideMenuItem>
        <InnerSideMenuItem href="/">Settings</InnerSideMenuItem>
      </div>
      <div className="px-2">
        <InnerSideBarTitle className="mb-2">Projects</InnerSideBarTitle>
        <InnerSideMenuItem href="/" title="Dashboard">
          Dashboard
        </InnerSideMenuItem>
        <InnerSideMenuItem href="/">Team</InnerSideMenuItem>
        <InnerSideMenuItem href="/">Settings</InnerSideMenuItem>
      </div>
    </Card>
  )
}
