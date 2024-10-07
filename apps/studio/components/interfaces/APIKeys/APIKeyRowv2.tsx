import { TooltipContent } from '@radix-ui/react-tooltip'
import CopyButton from 'components/ui/CopyButton'
import { Eye, EyeOff, Loader2, MoreVertical, TrashIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
  TableRow,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
} from 'ui'

import { useParams } from 'common'
import { useAPIKeyDeleteMutation } from 'data/api-keys/api-key-delete-mutation'
import { APIKeysData } from 'data/api-keys/api-keys-query'

const APIKeyRow = ({ apiKey }: { apiKey: APIKeysData[0] }) => {
  const { ref: projectRef } = useParams()
  const isSecret = apiKey.type === 'secret'
  const [shown, setShown] = useState(!isSecret)

  const hiddenKey = useMemo(
    () =>
      apiKey.prefix +
      Array.from({ length: apiKey.api_key.length - apiKey.prefix.length }, () => '•').join(''),
    [apiKey.api_key, apiKey.prefix]
  )

  const canDeleteAPIKeys = true // todo

  const { mutate: deleteAPIKey, isLoading: isDeletingAPIKey } = useAPIKeyDeleteMutation()

  const onDeleteAPIKeySubmit = () => {
    deleteAPIKey(
      {
        projectRef,
        id: apiKey.id,
      },
      {
        onSuccess: () => {
          // onClose(false)
        },
      }
    )
  }

  return (
    <TableRow key={apiKey.id}>
      <TableCell className="pl-0">{apiKey.description || '/'}</TableCell>
      <TableCell className="">
        <div className="flex flex-row gap-2">
          <code>{shown ? apiKey.api_key : hiddenKey}</code>

          {isSecret && (
            <Button
              type="outline"
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
      </TableCell>

      {/* {isSecret && (
        <TableCell>
          <code>{apiKey.secret_jwt_template?.role ?? ''}</code>
        </TableCell>
      )} */}

      <TableCell className="pr-0">
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 p-2 focus-visible:outline-none">
            <MoreVertical size="14" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-40" align="end">
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  className="flex gap-1.5 !pointer-events-auto"
                  onClick={async (e) => {
                    if (canDeleteAPIKeys) {
                      e.preventDefault()
                      onDeleteAPIKeySubmit()
                    }
                  }}
                >
                  {isDeletingAPIKey ? (
                    <Loader2 size="14" className="animate-spin" />
                  ) : (
                    <TrashIcon size="14" />
                  )}
                  {isDeletingAPIKey ? 'Deleting key..' : 'Delete API key'}
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
      </TableCell>
    </TableRow>
  )
}

export default APIKeyRow
