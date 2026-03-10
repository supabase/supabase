import { useState } from 'react'

import { Button } from 'ui'
import { type NewScopedAccessToken } from 'data/scoped-access-tokens/scoped-access-token-create-mutation'
import { NewScopedTokenSheet } from './NewScopedTokenSheet'

export interface NewScopedTokenButtonProps {
  onCreateToken: (token: NewScopedAccessToken) => void
}

export const NewScopedTokenButton = ({ onCreateToken }: NewScopedTokenButtonProps) => {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <Button
        type="primary"
        onClick={() => {
          setVisible(true)
        }}
      >
        Generate new token
      </Button>

      <NewScopedTokenSheet
        visible={visible}
        onOpenChange={setVisible}
        tokenScope={undefined}
        onCreateToken={onCreateToken}
      />
    </>
  )
}
