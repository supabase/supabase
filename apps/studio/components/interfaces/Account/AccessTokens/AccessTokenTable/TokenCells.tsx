import dayjs from 'dayjs'
import { Badge } from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { TableCell } from 'ui/src/components/shadcn/ui/table'

interface TokenNameCellProps {
  name: string
  tokenAlias: string
  isClassic?: boolean
}

export const TokenNameCell = ({ name, tokenAlias, isClassic }: TokenNameCellProps) => (
  <TableCell className="w-auto max-w-96">
    <div className="flex items-center gap-x-2">
      <p className="truncate" title={name}>
        {name}
      </p>
      {isClassic && <Badge variant="default">Classic</Badge>}
    </div>
    <p
      className="font-mono text-foreground-lighter truncate text-xs mt-1 max-w-32 sm:max-w-48 lg:max-w-full"
      title={tokenAlias}
    >
      {tokenAlias}
    </p>
  </TableCell>
)

interface LastUsedCellProps {
  lastUsedAt: string | null | undefined
}

export const LastUsedCell = ({ lastUsedAt }: LastUsedCellProps) => (
  <TableCell className="text-foreground-light min-w-28">
    {lastUsedAt ? (
      <TimestampInfo
        utcTimestamp={lastUsedAt}
        label={dayjs(lastUsedAt).fromNow()}
        className="text-sm"
      />
    ) : (
      <p className="text-foreground-light text-sm">Never used</p>
    )}
  </TableCell>
)

interface ExpiresCellProps {
  expiresAt: string | null | undefined
}

export const ExpiresCell = ({ expiresAt }: ExpiresCellProps) => (
  <TableCell className="min-w-28 text-foreground-light">
    {expiresAt ? (
      dayjs(expiresAt).isBefore(dayjs()) ? (
        <TimestampInfo utcTimestamp={expiresAt} label="Expired" className="text-sm" />
      ) : (
        <TimestampInfo
          utcTimestamp={expiresAt}
          label={dayjs(expiresAt).format('DD MMM YYYY')}
          className="text-sm"
        />
      )
    ) : (
      <p className="text-foreground-light text-sm">Never</p>
    )}
  </TableCell>
)
