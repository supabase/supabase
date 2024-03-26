import { useParams } from 'common'
import dayjs from 'dayjs'
import { GitPullRequest } from 'lucide-react'
import Link from 'next/link'
import { PropsWithChildren, ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useBranchQuery } from 'data/branches/branch-query'
import type { Branch } from 'data/branches/branches-query'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconArrowRight,
  IconExternalLink,
  IconMoreVertical,
  IconShield,
  IconTrash,
} from 'ui'
import BranchStatusBadge from './BranchStatusBadge'

interface BranchManagementSectionProps {
  header: string
  footer?: ReactNode
}

export const BranchManagementSection = ({
  header,
  footer,
  children,
}: PropsWithChildren<BranchManagementSectionProps>) => {
  return (
    <div className="border rounded-lg">
      <div className="bg-surface-100 shadow-sm flex justify-between items-center px-6 py-2 rounded-t-lg text-sm">
        {header}
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
  branch: Branch
  isMain?: boolean
  generateCreatePullRequestURL?: (branchName?: string) => string
  onSelectDeleteBranch: () => void
}

export const BranchRow = ({
  branch,
  isMain = false,
  repo,
  generateCreatePullRequestURL,
  onSelectDeleteBranch,
}: BranchRowProps) => {
  const { ref: projectRef } = useParams()
  const isActive = projectRef === branch?.project_ref

  const daysFromNow = dayjs().diff(dayjs(branch.updated_at), 'day')
  const formattedTimeFromNow = dayjs(branch.updated_at).fromNow()
  const formattedUpdatedAt = dayjs(branch.updated_at).format('DD MMM YYYY, HH:mm:ss (ZZ)')

  const createPullRequestURL =
    generateCreatePullRequestURL?.(branch.git_branch) ?? 'https://github.com'

  const { ref, inView } = useInView()
  const { data } = useBranchQuery(
    { projectRef, id: branch.id },
    {
      enabled: branch.status === 'CREATING_PROJECT' && inView,
      refetchInterval(data) {
        if (data?.status !== 'ACTIVE_HEALTHY') {
          return 1000 * 3 // 3 seconds
        }

        return false
      },
    }
  )

  return (
    <div className="w-full flex items-center justify-between px-6 py-2.5" ref={ref}>
      <div className="flex items-center gap-x-4">
        <Button
          asChild
          type="default"
          className="max-w-[300px]"
          icon={isMain && <IconShield strokeWidth={2} className="text-amber-900" />}
        >
          <Link href={`/project/${branch.project_ref}/branches`} title={branch.name}>
            {branch.name}
          </Link>
        </Button>
        {isActive && <Badge>Current</Badge>}
        <BranchStatusBadge
          status={
            branch.status === 'CREATING_PROJECT' ? data?.status ?? branch.status : branch.status
          }
        />
        <p className="text-xs text-foreground-lighter">
          {daysFromNow > 1 ? `Updated on ${formattedUpdatedAt}` : `Updated ${formattedTimeFromNow}`}
        </p>
      </div>
      <div className="flex items-center gap-x-8">
        {branch.pr_number !== undefined && (
          <div className="flex items-center">
            <Link
              href={`https://github.com/${repo}/pull/${branch.pr_number}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs transition text-foreground-lighter mr-4 hover:text-foreground"
            >
              #{branch.pr_number}
            </Link>
            <div className="flex items-center gap-x-2 bg-brand-500 px-3 py-1 rounded-full">
              <GitPullRequest size={14} />
              <p className="text-xs">Open</p>
            </div>
            <IconArrowRight className="mx-1 text-foreground-light" strokeWidth={1.5} size={16} />
            <Button asChild type="default">
              <Link
                passHref
                target="_blank"
                rel="noreferer"
                href={`http://github.com/${repo}/tree/${branch.git_branch}`}
              >
                {branch.git_branch}
              </Link>
            </Button>
          </div>
        )}

        {isMain ? (
          <div className="flex items-center gap-x-2">
            <Button asChild type="default" iconRight={<IconExternalLink />}>
              <Link target="_blank" rel="noreferrer" passHref href={`https://github.com/${repo}`}>
                View Repository
              </Link>
            </Button>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button type="text" icon={<IconMoreVertical />} className="px-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-0 w-56" side="bottom" align="end">
                <Link passHref href={`/project/${projectRef}/settings/integrations`}>
                  <DropdownMenuItem asChild className="gap-x-2">
                    <a>Change production branch</a>
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-x-2">
            <Button asChild type="default" iconRight={<IconExternalLink />}>
              <Link
                passHref
                target="_blank"
                rel="noreferrer"
                href={
                  branch.pr_number !== undefined
                    ? `https://github.com/${repo}/pull/${branch.pr_number}`
                    : createPullRequestURL
                }
              >
                {branch.pr_number !== undefined ? 'View Pull Request' : 'Create Pull Request'}
              </Link>
            </Button>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button type="text" icon={<IconMoreVertical />} className="px-1" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-0 w-56" side="bottom" align="end">
                <DropdownMenuItem
                  className="gap-x-2"
                  onSelect={() => onSelectDeleteBranch?.()}
                  onClick={() => onSelectDeleteBranch?.()}
                >
                  <IconTrash size="tiny" />
                  <p>Delete branch</p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  )
}
