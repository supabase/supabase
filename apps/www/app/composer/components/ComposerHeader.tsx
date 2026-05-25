'use client'

import { Check, Copy, Download } from 'lucide-react'
import Image from 'next/image'
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

import type { MergeResult } from '../lib/composer'

interface ComposerHeaderProps {
  mergeResult: MergeResult | null
  copied: boolean
  onCopyCommand: () => void
  onDownload: () => void
}

export function ComposerHeader({
  mergeResult,
  copied,
  onCopyCommand,
  onDownload,
}: ComposerHeaderProps) {
  return (
    <PageBreadcrumbs
      actions={
        mergeResult ? (
          <PageBreadcrumbsActions>
            <div className="flex h-[34px] items-center gap-2 rounded-md border bg-surface-75 px-3 font-mono text-xs text-foreground-light">
              <span className="shrink-0 text-foreground-muted">$</span>
              <code className="max-w-[min(40vw,28rem)] truncate">
                supabase init --composition {mergeResult.compositionId}
              </code>
              <Button
                type="text"
                size="tiny"
                className="h-[26px] w-[26px] shrink-0 px-0"
                icon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                onClick={onCopyCommand}
                aria-label="Copy composition command"
              />
            </div>

            <Button type="default" size="small" icon={<Download />} onClick={onDownload}>
              Download ZIP
            </Button>
          </PageBreadcrumbsActions>
        ) : undefined
      }
    >
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
          <BreadcrumbPage className="truncate">Compose a project</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </PageBreadcrumbs>
  )
}
