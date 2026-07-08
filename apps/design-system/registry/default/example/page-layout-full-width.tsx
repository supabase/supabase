'use client'

import Link from 'next/link'
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from 'ui'
import { PageBreadcrumbs, PageBreadcrumbsActions } from 'ui-patterns/PageBreadcrumbs'
import { PageContainer } from 'ui-patterns/PageContainer'

import { PageLayoutLogsContent } from './page-layout-logs-content'

export default function PageLayoutFullWidth() {
  return (
    <div className="w-full">
      <PageBreadcrumbs
        actions={
          <PageBreadcrumbsActions>
            <Button variant="default" size="tiny">
              Docs
            </Button>
          </PageBreadcrumbsActions>
        }
      >
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/project/demo">Project</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Logs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </PageBreadcrumbs>

      <PageContainer size="full" className="px-0 xl:px-0">
        <PageLayoutLogsContent />
      </PageContainer>
    </div>
  )
}
