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
          {token.name}
        </p>
      ),
    },
    {
      key: 'token',
      label: 'Token',
      className: 'max-w-96',
      render: (token) => (
        <p className="font-mono text-foreground-light truncate">{token.token_alias}</p>
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
              <TooltipTrigger>{dayjs(token.last_used_at).format('DD MMM YYYY')}</TooltipTrigger>
              <TooltipContent side="bottom">
                Last used on {dayjs(token.last_used_at).format('DD MMM, YYYY HH:mm:ss')}
              </TooltipContent>
            </Tooltip>
          ) : (
            'Never used'
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
                  <p className="text-foreground-light">Expired</p>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Expired on {dayjs(token.expires_at).format('DD MMM, YYYY HH:mm:ss')}
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger>
                  <p className="text-foreground-light">
                    {dayjs(token.expires_at).format('DD MMM YYYY')}
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Expires on {dayjs(token.expires_at).format('DD MMM, YYYY HH:mm:ss')}
                </TooltipContent>
              </Tooltip>
            )
          ) : (
            <p className="text-foreground-light">Never</p>
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
