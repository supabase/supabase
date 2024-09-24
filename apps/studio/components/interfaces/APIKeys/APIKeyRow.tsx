import { useMemo, useState } from 'react'
import { Eye, EyeOff, MoreVertical, TrashIcon } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'
import { TooltipContent } from '@radix-ui/react-tooltip'
import CopyButton from 'components/ui/CopyButton'
import Table from 'components/to-be-cleaned/Table'

import { APIKeysData } from 'data/api-keys/api-keys-query'

const APIKeyRow = ({ apiKey }: { apiKey: APIKeysData[0] }) => {
  const isSecret = apiKey.type === 'secret'
  const [shown, setShown] = useState(!isSecret)

  const hiddenKey = useMemo(
    () =>
      apiKey.prefix +
      Array.from({ length: apiKey.api_key.length - apiKey.prefix.length }, () => '•').join(''),
    [apiKey.api_key, apiKey.prefix]
  )

  const canDeleteAPIKeys = true // todo

  return (
    <Table.tr key={apiKey.id}>
      <Table.td>
        <div className="flex flex-row gap-2">
          <code>{shown ? apiKey.api_key : hiddenKey}</code>

          {isSecret && (
            <Button
              type="icon"
              variant="icon"
              icon={shown ? <EyeOff strokeWidth={2} /> : <Eye strokeWidth={2} />}
              onClick={() => {
                setShown((shown) => {
                  if (!shown) {
                    setTimeout(() => {
                      setShown(false)
                    }, 2000)
                  }

                  return !shown
                })
              }}
            />
          )}

          <CopyButton text={apiKey.api_key} iconOnly />
        </div>
      </Table.td>

      {isSecret && (
        <Table.td>
          <code>{apiKey.secret_jwt_template?.role ?? ''}</code>
        </Table.td>
      )}

      <Table.td>{apiKey.description || '/'}</Table.td>

      <Table.td>
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 p-2 focus-visible:outline-none">
            <MoreVertical size="14" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-40" align="end">
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  className="flex gap-1.5 !pointer-events-auto"
                  onClick={(e) => {
                    if (canDeleteAPIKeys) {
                      e.preventDefault()
                    }
                  }}
                >
                  <TrashIcon size="14" />
                  Delete API key
                </DropdownMenuItem>
              </TooltipTrigger_Shadcn_>
              {!canDeleteAPIKeys && (
                <TooltipContent side="left">
                  You need additional permissions to delete API keys
                </TooltipContent>
              )}
            </Tooltip_Shadcn_>
          </DropdownMenuContent>
        </DropdownMenu>
      </Table.td>
    </Table.tr>
  )
}

export default APIKeyRow
