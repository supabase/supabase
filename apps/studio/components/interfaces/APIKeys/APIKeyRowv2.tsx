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
  Input_Shadcn_,
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
      <TableCell className="py-2">{apiKey.description || '/'}</TableCell>
      <TableCell className="py-2">
        <div className="flex flex-row gap-2">
          {/* <code>{shown ? apiKey.api_key : hiddenKey}</code> */}

          <Input_Shadcn_
            size="tiny"
            className="flex-1 grow gap-1 font-mono !rounded-full max-w-60 truncate"
            value={apiKey.api_key}
          />

          {isSecret && (
            <Button
              type="outline"
              className="rounded-full px-2"
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
          <CopyButton type="default" text={apiKey.api_key} iconOnly className="rounded-full px-2" />
        </div>
      </TableCell>

      {/* {isSecret && <TableCell>{apiKey.created_on ?? ''}</TableCell>} */}

      <TableCell className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger className="px-1 focus-visible:outline-none" asChild>
            <Button
              type="text"
              size="tiny"
              icon={
                <MoreVertical size="14" className="text-foreground-light hover:text-foreground" />
              }
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-40" align="end">
            <Tooltip_Shadcn_>
              <TooltipTrigger_Shadcn_ asChild>
                <DropdownMenuItem
                  className="flex gap-2 !pointer-events-auto"
                  onClick={async (e) => {
                    if (canDeleteAPIKeys) {
                      e.preventDefault()
                      onDeleteAPIKeySubmit()
                    }
                  }}
                >
                  {isDeletingAPIKey ? (
                    <Loader2 size="12" className="animate-spin" />
                  ) : (
                    <TrashIcon size="12" />
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
