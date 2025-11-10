import React from 'react'
import Link from 'next/link'
import {
  PageHeader,
  PageHeaderBreadcrumb,
  PageHeaderMeta,
  PageHeaderIcon,
  PageHeaderSummary,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderAside,
  PageHeaderFooter,
} from 'ui-patterns/PageHeader'
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
      <PageHeader>
        <PageHeaderBreadcrumb>
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
        </PageHeaderBreadcrumb>
        <PageHeaderMeta>
          <PageHeaderIcon>
            <Database className="w-5 h-5" />
          </PageHeaderIcon>
          <PageHeaderSummary>
            <PageHeaderTitle>Demo Function</PageHeaderTitle>
            <PageHeaderDescription>
              Serverless functions that run at the edge with low latency and automatic scaling.
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <Button type="default" size="small">
              Secondary
            </Button>
            <Button type="primary" size="small">
              Deploy Function
            </Button>
          </PageHeaderAside>
        </PageHeaderMeta>
        <PageHeaderFooter>
          <NavMenu>
            {navigationItems.map((item) => (
              <NavMenuItem key={item.label}>
                <Link href={item.href}>{item.label}</Link>
              </NavMenuItem>
            ))}
          </NavMenu>
        </PageHeaderFooter>
      </PageHeader>
    </div>
  )
}
