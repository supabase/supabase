import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Database, GitBranch, GitPullRequest, Server, Users } from 'lucide-react'
import Link from 'next/link'
import { Badge, Card, CardContent, CardHeader, CardTitle } from 'ui'
import { Row } from 'ui-patterns/Row'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { Branch } from '@/data/branches/branches-query'

dayjs.extend(relativeTime)

interface BranchesSectionProps {
  projectRef: string
  branches: Branch[] | undefined
  isLoading: boolean
}

function BranchRow({
  icon,
  name,
  subtitle,
  badge,
  href,
}: {
  icon: React.ReactNode
  name: string
  subtitle?: string
  badge?: React.ReactNode
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3 hover:bg-surface-200 transition-colors border-b border-default last:border-b-0 group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-6 h-6 rounded border border-default bg-surface-300 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm truncate">{name}</span>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-foreground-lighter truncate">{subtitle}</p>}
        </div>
      </div>
      <span className="text-xs text-foreground-lighter group-hover:text-foreground-light shrink-0 pl-2">
        →
      </span>
    </Link>
  )
}

export const BranchesSection = ({ projectRef, branches, isLoading }: BranchesSectionProps) => {
  const mainBranch = branches?.find((b) => b.is_default)
  const previewBranches = branches?.filter((b) => !b.is_default) ?? []

  return (
    <Row maxColumns={3} minWidth={280} showArrows={false}>
      {/* Environments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server size={13} />
            Environments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {[1, 2, 3].map((i) => (
                <ShimmeringLoader key={i} className="w-full h-8" />
              ))}
            </div>
          ) : (
            <>
              <BranchRow
                icon={<Server size={12} className="text-foreground-light" />}
                name="Production"
                subtitle={mainBranch?.git_branch ? mainBranch.git_branch : undefined}
                badge={<Badge variant="default">Default</Badge>}
                href={`/project/${projectRef}`}
              />
              {previewBranches.map((branch) => {
                const hasPR = branch.review_requested_at != null
                const prNumber = (branch as any).pr_number
                const createdAt = branch.created_at ? dayjs(branch.created_at).fromNow() : undefined
                return (
                  <BranchRow
                    key={branch.id}
                    icon={
                      hasPR ? (
                        <GitPullRequest size={12} className="text-foreground-light" />
                      ) : (
                        <GitBranch size={12} className="text-foreground-light" />
                      )
                    }
                    name={branch.name}
                    subtitle={branch.git_branch ?? (createdAt ? `Created ${createdAt}` : undefined)}
                    badge={
                      hasPR ? (
                        <Badge variant="warning">
                          {prNumber ? `PR #${prNumber}` : 'Review pending'}
                        </Badge>
                      ) : undefined
                    }
                    href={`/project/${branch.project_ref}`}
                  />
                )
              })}
              {previewBranches.length === 0 && (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-foreground-lighter">
                  <GitBranch size={12} />
                  No preview branches
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Members placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={13} />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[
            { name: 'jonathansummers', email: 'jon@supabase.io', lastSeen: '2 hours ago' },
            { name: 'alaister', email: 'alaister@supabase.io', lastSeen: '1 day ago' },
            { name: 'bndkt', email: 'bndkt@supabase.io', lastSeen: '3 days ago' },
          ].map((member) => (
            <div key={member.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-surface-300 border border-default shrink-0 flex items-center justify-center text-xs text-foreground-light font-medium">
                  {member.name[0].toUpperCase()}
                </div>
                <span className="text-sm text-foreground-light truncate">{member.name}</span>
              </div>
              <span className="text-xs text-foreground-lighter shrink-0">{member.lastSeen}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Backups placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={13} />
            Backups
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[
            { label: 'Daily backup', time: 'Today, 02:00 UTC', status: 'Completed' },
            { label: 'Daily backup', time: 'Yesterday, 02:00 UTC', status: 'Completed' },
            { label: 'Weekly backup', time: 'Apr 1, 02:00 UTC', status: 'Completed' },
          ].map((backup, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm text-foreground-light">{backup.label}</p>
                <p className="text-xs text-foreground-lighter truncate">{backup.time}</p>
              </div>
              <Badge variant="default" className="shrink-0">
                {backup.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </Row>
  )
}
