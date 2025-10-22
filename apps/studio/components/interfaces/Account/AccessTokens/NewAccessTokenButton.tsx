import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { NewAccessTokenDialog } from './NewAccessTokenDialog'

export interface NewAccessTokenButtonProps {
  onCreateToken: (token: any) => void
}

export const NewAccessTokenButton = ({ onCreateToken }: NewAccessTokenButtonProps) => {
  const [visible, setVisible] = useState(false)
  const [tokenScope, setTokenScope] = useState<'V0' | undefined>(undefined)

  return (
    <>
      <div className="flex items-center">
        <Button
          className="rounded-r-none px-3"
          onClick={() => {
            setTokenScope(undefined)
            setVisible(true)
          }}
        >
          Generate new token
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="primary"
              title="Choose token scope"
              className="rounded-l-none px-[4px] py-[5px]"
              icon={<ChevronDown />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom">
            <DropdownMenuItem
              key="experimental-token"
              onClick={() => {
                setTokenScope('V0')
                setVisible(true)
              }}
            >
              <div className="space-y-1">
                <p className="block text-foreground">Generate token for experimental API</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <NewAccessTokenDialog
        open={visible}
        onOpenChange={setVisible}
        tokenScope={tokenScope}
        onCreateToken={onCreateToken}
      />
    </>
  )
}
