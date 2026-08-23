import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { NewTokenDialog } from './NewTokenDialog'
import { type NewAccessToken } from '@/data/access-tokens/access-tokens-create-mutation'

interface ExperimentalTokenDropdownProps {
  onCreateToken: (token: NewAccessToken) => void
}

/**
 * The chevron half of the "Generate new token" split button: a dropdown whose single
 * item opens the experimental API (V0 scope) token dialog. Rendered flush against a
 * `rounded-r-none` primary button.
 */
export const ExperimentalTokenDropdown = ({ onCreateToken }: ExperimentalTokenDropdownProps) => {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="primary"
                aria-label="Choose token scope"
                className="shrink-0 rounded-l-none px-[4px] py-[5px] -ml-px focus-visible:z-10 focus-visible:rounded-l-sm"
                icon={<ChevronDown />}
              />
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">Choose token scope</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuItem key="experimental-token" onClick={() => setVisible(true)}>
            <p className="block text-foreground">Generate token for experimental API</p>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NewTokenDialog
        open={visible}
        onOpenChange={setVisible}
        tokenScope="V0"
        onCreateToken={onCreateToken}
      />
    </>
  )
}
