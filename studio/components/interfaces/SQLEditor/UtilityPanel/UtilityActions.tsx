import * as Tooltip from '@radix-ui/react-tooltip'
import { IS_PLATFORM } from 'lib/constants'
import { detectOS } from 'lib/helpers'
import {
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconAlignLeft,
  IconCheck,
  IconChevronDown,
  IconCommand,
  IconCornerDownLeft,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'

import FavoriteButton from './FavoriteButton'
import SavingIndicator from './SavingIndicator'
import SizeToggleButton from './SizeToggleButton'
import { MOCK_DATABASES } from 'components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { useState } from 'react'

export type UtilityActionsProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  prettifyQuery: () => void
  executeQuery: () => void
}

const UtilityActions = ({
  id,
  isExecuting = false,
  isDisabled = false,
  prettifyQuery,
  executeQuery,
}: UtilityActionsProps) => {
  const os = detectOS()
  const databases = MOCK_DATABASES

  const [open, setOpen] = useState(false)
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>('1')
  const selectedDatabase = databases.find((db) => db.id.toString() === selectedDatabaseId)

  return (
    <>
      <SavingIndicator id={id} />

      {IS_PLATFORM && <FavoriteButton id={id} />}

      {/* [Joshen] Am opting to remove this - i don't think its useful? */}
      {/* [Joshen] Keeping in mind to not sprawl controls everywhere */}
      {/* [Joshen] There's eventually gonna be user impersonation here as well so let's see */}
      {/* <SizeToggleButton id={id} /> */}

      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger asChild>
          <Button
            type="text"
            onClick={() => prettifyQuery()}
            icon={<IconAlignLeft size="tiny" strokeWidth={2} className="text-gray-1100" />}
          />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-alternative py-1 px-2 leading-none shadow',
                'border border-background',
              ].join(' ')}
            >
              <span className="text-xs text-foreground">Prettify SQL</span>
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <div className="flex items-center justify-between gap-x-2 mx-2">
        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger_Shadcn_ asChild>
            <div className="flex items-center space-x-2 cursor-pointer">
              <Button
                type="default"
                className="pr-2"
                iconRight={
                  <IconChevronDown className="text-foreground-light" strokeWidth={2} size={12} />
                }
              >
                Source:{' '}
                <span className="capitalize">
                  {(selectedDatabase?.type ?? '').split('_').join(' ').toLowerCase()}
                  {selectedDatabase?.type === 'PRIMARY' && ' database'}
                </span>{' '}
                {selectedDatabase?.type === 'READ_REPLICA' && (
                  <span>(ID: {selectedDatabase?.id})</span>
                )}
              </Button>
            </div>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="p-0 w-48" side="bottom" align="end">
            <Command_Shadcn_>
              <CommandList_Shadcn_>
                <CommandGroup_Shadcn_>
                  <ScrollArea className={(databases || []).length > 7 ? 'h-[210px]' : ''}>
                    {databases?.map((database) => {
                      return (
                        <CommandItem_Shadcn_
                          key={database.id}
                          value={database.id.toString()}
                          className="cursor-pointer w-full"
                          onSelect={() => {
                            setSelectedDatabaseId(database.id.toString())
                            setOpen(false)
                          }}
                          onClick={() => {
                            setSelectedDatabaseId(database.id.toString())
                            setOpen(false)
                          }}
                        >
                          <div className="w-full flex items-center justify-between">
                            <p>
                              {database.type === 'PRIMARY'
                                ? 'Primary database'
                                : `Read replica (ID: ${database.id})`}
                            </p>
                            {database.id.toString() === selectedDatabaseId && <IconCheck />}
                          </div>
                        </CommandItem_Shadcn_>
                      )
                    })}
                  </ScrollArea>
                </CommandGroup_Shadcn_>
              </CommandList_Shadcn_>
            </Command_Shadcn_>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>

        <Button
          onClick={() => executeQuery()}
          disabled={isDisabled || isExecuting}
          loading={isExecuting}
          type="default"
          size="tiny"
          iconRight={
            <div className="flex items-center space-x-1">
              {os === 'macos' ? (
                <IconCommand size={10} strokeWidth={1.5} />
              ) : (
                <p className="text-xs text-foreground-light">CTRL</p>
              )}
              <IconCornerDownLeft size={10} strokeWidth={1.5} />
            </div>
          }
        >
          RUN
        </Button>
      </div>
    </>
  )
}

export default UtilityActions
