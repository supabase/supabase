import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { TimestampInfo } from 'ui-patterns'
import type { InviteCode } from 'data/invite-codes/invite-codes-query'

interface InviteCodeListProps {
  inviteCodes: InviteCode[]
  isLoading: boolean
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      type="text"
      icon={copied ? <Check className="text-brand" /> : <Copy />}
      className="h-6 w-6 p-0"
      onClick={handleCopy}
      title="Copy invite code"
    />
  )
}

export function InviteCodeList({ inviteCodes, isLoading }: InviteCodeListProps) {
  if (isLoading) {
    return <GenericSkeletonLoader />
  }

  if (inviteCodes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-center">
        <div>
          <p className="text-sm text-foreground">No invite codes yet.</p>
          <p className="text-sm text-foreground-light mt-1">
            Create one to start inviting users.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead className="text-right">Max Slots</TableHead>
            <TableHead className="text-right">Remaining Slots</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inviteCodes.map((inviteCode) => (
            <TableRow key={inviteCode.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm">{inviteCode.code}</code>
                  <CopyButton code={inviteCode.code} />
                </div>
              </TableCell>
              <TableCell className="text-right">{inviteCode.max_slots}</TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    inviteCode.remaining_slots === 0
                      ? 'text-destructive'
                      : inviteCode.remaining_slots <= inviteCode.max_slots * 0.2
                        ? 'text-warning'
                        : 'text-foreground'
                  }
                >
                  {inviteCode.remaining_slots}
                </span>
              </TableCell>
              <TableCell>
                <TimestampInfo value={inviteCode.created_at} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
