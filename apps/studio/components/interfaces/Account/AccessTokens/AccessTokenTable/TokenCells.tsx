import dayjs from 'dayjs'
import { TableCell } from 'ui/src/components/shadcn/ui/table'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

interface TokenNameCellProps {
  name: string
  tokenAlias: string
}

export const TokenNameCell = ({ name, tokenAlias }: TokenNameCellProps) => (
  <TableCell className="w-auto max-w-96">
    <p className="truncate" title={name}>
      {name}
    </p>
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
