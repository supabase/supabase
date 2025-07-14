import dayjs from 'dayjs'
import { Github } from 'lucide-react'
import { Button } from 'ui'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useBranchQuery } from 'data/branches/branch-query'
import type { Branch } from 'data/branches/branches-query'
import WorkflowLogs from './WorkflowLogs'

interface BranchManagementSectionProps {
  header: string | ReactNode
  footer?: ReactNode
}

export const BranchManagementSection = ({
  header,
  footer,
  children,
}: PropsWithChildren<BranchManagementSectionProps>) => {
  return (
    <div className="border rounded-lg">
      <div className="bg-surface-100 shadow-sm flex justify-between items-center px-4 py-3 rounded-t-lg text-xs font-mono uppercase">
        {typeof header === 'string' ? <span>{header}</span> : header}
      </div>
      <div className="bg-surface border-t shadow-sm rounded-b-lg text-sm divide-y">{children}</div>
      {footer !== undefined && <div className="bg-surface-100 px-6 py-1 border-t">{footer}</div>}
    </div>
  )
}

export const BranchRowLoader = () => {
  return (
    <div className="flex items-center justify-between px-6 py-2.5">
      <div className="flex items-center gap-x-4">
        <ShimmeringLoader className="w-52" />
        <ShimmeringLoader className="w-52" />
      </div>
      <div className="flex items-center gap-x-4">
        <ShimmeringLoader className="w-52" />
        <ShimmeringLoader className="w-52" />
      </div>
    </div>
  )
}

export const BranchLoader = () => {
  return (
    <>
      <BranchRowLoader />
      <BranchRowLoader />
      <BranchRowLoader />
      <BranchRowLoader />
      <BranchRowLoader />
    </>
  )
}

interface BranchRowProps {
  repo: string
  label?: string | ReactNode
  branch: Branch
  rowLink?: string
  external?: boolean
  rowActions?: ReactNode
}

export const BranchRow = ({
  branch,
  label,
  repo,
  rowLink,
  external = false,
  rowActions,
}: BranchRowProps) => {
  const { ref: projectRef } = useParams()
  const router = useRouter()

  const daysFromNow = dayjs().diff(dayjs(branch.updated_at), 'day')
  const formattedTimeFromNow = dayjs(branch.updated_at).fromNow()
  const formattedUpdatedAt = dayjs(branch.updated_at).format('DD MMM YYYY, HH:mm:ss (ZZ)')

  const { ref, inView } = useInView()
  const { data } = useBranchQuery(
    { projectRef, id: branch.id },
    {
      enabled: inView,
      refetchInterval(data) {
        if (data?.status !== 'ACTIVE_HEALTHY') {
          return 1000 * 3 // 3 seconds
        }

        return false
      },
    }
  )

  const navigateUrl = rowLink ?? `/project/${branch.project_ref}`
  const handleRowClick = () => {
    if (external) {
      window.open(navigateUrl, '_blank', 'noopener noreferrer')
    } else {
      router.push(navigateUrl)
    }
  }

  return (
    <div
      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-100"
      ref={ref}
    >
      <div className="flex items-center gap-x-3 cursor-pointer" onClick={handleRowClick}>
        {branch.git_branch && (
          <Button asChild type="default">
            <Link
              target="_blank"
              rel="noreferrer"
              passHref
              href={`https://github.com/${repo}/tree/${branch.git_branch}`}
            >
              <Github size={14} className="text-foreground-light" />
            </Link>
          </Button>
        )}
        {label || branch.name}
      </div>
      <div className="flex items-center gap-x-4">
        <p className="text-xs text-foreground-lighter">
          {daysFromNow > 1 ? `Updated on ${formattedUpdatedAt}` : `Updated ${formattedTimeFromNow}`}
        </p>
        <WorkflowLogs projectRef={branch.project_ref} status={branch.status} />
        {rowActions}
      </div>
    </div>
  )
}
