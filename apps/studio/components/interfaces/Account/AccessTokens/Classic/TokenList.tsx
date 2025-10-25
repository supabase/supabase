import { useAccessTokenDeleteMutation } from 'data/access-tokens/access-tokens-delete-mutation'
import { AccessToken, useAccessTokensQuery } from 'data/access-tokens/access-tokens-query'
import dayjs from 'dayjs'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { AccessTokenTable, TableColumn } from '../AccessTokenTable'

export interface AccessTokenListProps {
  searchString?: string
  onDeleteSuccess: (id: string | number) => void
}

export const TokenList = ({ searchString = '', onDeleteSuccess }: AccessTokenListProps) => {
  const { data: tokens, error, isLoading, isError } = useAccessTokensQuery()

  const columns: TableColumn<AccessToken>[] = [
    {
      key: 'name',
      label: 'Name',
      className: 'w-36 max-w-36',
      render: (token) => (
        <p className="truncate" title={token.name}>
          {token.name} x
        </p>
      ),
    },
    {
      key: 'token',
      label: 'Token',
      className: 'max-w-48 lg:max-w-80 truncate',
      render: (token) => (
        <code
          className="font-mono text-foreground-light truncate text-xs"
          title={token.token_alias}
        >
          {token.token_alias}
        </code>
      ),
    },
    {
      key: 'lastUsed',
      label: 'Last used',
      className: 'min-w-32',
      render: (token) => (
        <p className="text-foreground-light">
          {token.last_used_at ? (
            <Tooltip>
              <TooltipTrigger>
                <code className="text-foreground-light text-xs">
                  {dayjs(token.last_used_at).format('DD MMM YYYY')}
                </code>
              </TooltipTrigger>
              <TooltipContent side="top">
                Last used on {dayjs(token.last_used_at).format('DD MMM, YYYY HH:mm:ss')}
              </TooltipContent>
            </Tooltip>
          ) : (
            <code className="text-foreground-light text-xs">Never</code>
          )}
        </p>
      ),
    },
    {
      key: 'expires',
      label: 'Expires',
      className: 'min-w-32',
      render: (token) => (
        <>
          {token.expires_at ? (
            dayjs(token.expires_at).isBefore(dayjs()) ? (
              <Tooltip>
                <TooltipTrigger>
                  <code className="text-foreground-light text-xs">Expired</code>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Expired on {dayjs(token.expires_at).format('DD MMM, YYYY HH:mm:ss')}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <code className="text-foreground-light text-xs">
                    {dayjs(token.expires_at).format('DD MMM YYYY')}
                  </code>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Expires on {dayjs(token.expires_at).format('DD MMM, YYYY HH:mm:ss')}
                </TooltipContent>
              </Tooltip>
            )
          ) : (
            <code className="text-foreground-light text-xs">Never</code>
          )}
        </>
      ),
    },
  ]

  return (
    <AccessTokenTable
      searchString={searchString}
      onDeleteSuccess={onDeleteSuccess}
      tokens={tokens}
      error={error}
      isLoading={isLoading}
      isError={isError}
      deleteMutation={useAccessTokenDeleteMutation}
      getTokenId={(token: AccessToken) => token.id}
      getTokenName={(token: AccessToken) => token.name}
      columns={columns}
    />
  )
}
