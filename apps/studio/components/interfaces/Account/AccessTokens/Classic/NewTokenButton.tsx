import { useState } from 'react'
import { Button } from 'ui'

import { ExperimentalTokenDropdown } from './ExperimentalTokenDropdown'
import { NewTokenDialog } from './NewTokenDialog'
import { type NewAccessToken } from '@/data/access-tokens/access-tokens-create-mutation'

export interface NewAccessTokenButtonProps {
  onCreateToken: (token: NewAccessToken) => void
}

export const NewTokenButton = ({ onCreateToken }: NewAccessTokenButtonProps) => {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <div className="flex items-center">
        <Button
          className="rounded-r-none px-3 hover:z-10 focus-visible:z-10"
          onClick={() => setVisible(true)}
        >
          Generate new token
        </Button>
        <ExperimentalTokenDropdown onCreateToken={onCreateToken} />
      </div>

      <NewTokenDialog open={visible} onOpenChange={setVisible} onCreateToken={onCreateToken} />
    </>
  )
}
