'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

export function ComposerBreadcrumbs() {
  return (
    <Breadcrumb className="min-w-0 [&_li]:text-sm">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/" className="flex items-center">
              <Image
                src="/images/supabase-logo-icon.svg"
                width={18}
                height={18}
                alt="Supabase"
                className="h-[18px] w-[18px]"
              />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="truncate">
            <span className="inline-flex items-center gap-1">
              Composer
              <InfoTooltip side="bottom" className="max-w-[280px]">
                Start a project from vetted, predefined templates, or remix templates with agents to
                match your stack.
              </InfoTooltip>
            </span>
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
