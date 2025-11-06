import React from 'react'
import Link from 'next/link'
import { PageHeader } from 'ui-patterns/PageHeader'
import {
  Button,
  NavMenu,
  NavMenuItem,
  BreadcrumbItem_Shadcn_ as BreadcrumbItem,
  BreadcrumbLink_Shadcn_ as BreadcrumbLink,
  BreadcrumbList_Shadcn_ as BreadcrumbList,
  BreadcrumbSeparator_Shadcn_ as BreadcrumbSeparator,
} from 'ui'
import { Database } from 'lucide-react'

export default function PageHeaderDemo() {
  const breadcrumbItems = [
    { label: 'Project', href: '/project/demo' },
    { label: 'Edge Functions', href: '/project/demo/functions' },
  ]

  const navigationItems = [
    { label: 'Overview', href: '/project/demo/functions/demo-function' },
    { label: 'Invocations', href: '/project/demo/functions/demo-function/invocations' },
    { label: 'Logs', href: '/project/demo/functions/demo-function/logs' },
    { label: 'Details', href: '/project/demo/functions/demo-function/details' },
  ]

  return (
    <div className="w-full">
      <PageHeader.Root>
        <PageHeader.Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </PageHeader.Breadcrumb>
        <PageHeader.Icon>
          <Database className="w-5 h-5" />
        </PageHeader.Icon>
        <PageHeader.Summary>
          <PageHeader.Title>Demo Function</PageHeader.Title>
          <PageHeader.Description>
            Serverless functions that run at the edge with low latency and automatic scaling.
          </PageHeader.Description>
        </PageHeader.Summary>

        <PageHeader.Aside>
          <Button type="default" size="small">
            Secondary
          </Button>
          <Button type="primary" size="small">
            Deploy Function
          </Button>
        </PageHeader.Aside>

        <PageHeader.Footer>
          <NavMenu>
            {navigationItems.map((item) => (
              <NavMenuItem key={item.label}>
                <Link href={item.href}>{item.label}</Link>
              </NavMenuItem>
            ))}
          </NavMenu>
        </PageHeader.Footer>
      </PageHeader.Root>
    </div>
  )
}
