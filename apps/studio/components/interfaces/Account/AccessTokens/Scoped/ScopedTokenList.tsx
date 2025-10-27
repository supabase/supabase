import { useScopedAccessTokenDeleteMutation } from 'data/scoped-access-tokens/scoped-access-tokens-delete-mutation'
import {
  ScopedAccessToken,
  useScopedAccessTokensQuery,
} from 'data/scoped-access-tokens/scoped-access-token-query'
import dayjs from 'dayjs'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { AccessTokenTable, TableColumn } from '../AccessTokenTable'

export interface ScopedTokenListProps {
  searchString?: string
  onDeleteSuccess: (id: string | number) => void
}

export const ScopedTokenList = ({ searchString = '', onDeleteSuccess }: ScopedTokenListProps) => {
  const { data: tokensData, error, isLoading, isError } = useScopedAccessTokensQuery()

  // Extract tokens from the response structure
  const tokens = tokensData?.tokens

  const columns: TableColumn<ScopedAccessToken>[] = [
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
      className: 'max-w-36 lg:max-w-80',
      render: (token) => (
        <code
          className="font-mono text-foreground-light text-xs truncate"
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
      deleteMutation={useScopedAccessTokenDeleteMutation}
      getTokenId={(token: ScopedAccessToken) => token.id}
      getTokenName={(token: ScopedAccessToken) => token.name}
      columns={columns}
      emptyMessage="No scoped access tokens found"
      emptyDescription="You do not have any scoped tokens created yet"
      showViewButton={true}
    />
  )
}
