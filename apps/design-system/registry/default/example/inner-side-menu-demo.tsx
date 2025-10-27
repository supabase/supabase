import React from 'react'
import { Card } from 'ui'
import {
  InnerSideMenuCollapsible,
  InnerSideMenuCollapsibleTrigger,
  InnerSideMenuCollapsibleContent,
  InnerSideMenuItem,
  InnerSideMenuSeparator,
} from 'ui-patterns/InnerSideMenu'

export default function InnerSideMenuDemo() {
  return (
    <Card className="min-w-60 bg-dash-sidebar py-4 flex flex-col gap-6 h-full">
      <InnerSideMenuCollapsible defaultOpen>
        <InnerSideMenuCollapsibleTrigger title="Projects">Hello</InnerSideMenuCollapsibleTrigger>
        <InnerSideMenuCollapsibleContent className="mt-2">
          <InnerSideMenuItem href="/">Dashboard</InnerSideMenuItem>
          <InnerSideMenuItem href="/">Team</InnerSideMenuItem>
          <InnerSideMenuItem href="/">Settings</InnerSideMenuItem>
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
      <InnerSideMenuSeparator />
      <InnerSideMenuCollapsible defaultOpen>
        <InnerSideMenuCollapsibleTrigger title="Projects">Hello</InnerSideMenuCollapsibleTrigger>
        <InnerSideMenuCollapsibleContent className="mt-2">
          <InnerSideMenuItem href="/" title="Dashboard">
            Dashboard
          </InnerSideMenuItem>
          <InnerSideMenuItem href="/">Team</InnerSideMenuItem>
          <InnerSideMenuItem href="/">Settings</InnerSideMenuItem>
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
      <InnerSideMenuCollapsible defaultOpen>
        <InnerSideMenuCollapsibleTrigger title="Projects">Hello</InnerSideMenuCollapsibleTrigger>
        <InnerSideMenuCollapsibleContent className="mt-2">
          <InnerSideMenuItem href="/" title="Dashboard">
            Dashboard
          </InnerSideMenuItem>
          <InnerSideMenuItem href="/">Team</InnerSideMenuItem>
          <InnerSideMenuItem href="/">Settings</InnerSideMenuItem>
        </InnerSideMenuCollapsibleContent>
      </InnerSideMenuCollapsible>
    </Card>
  )
}
