import { useState } from 'react'

import { Button } from 'ui'
import { NewScopedTokenSheet } from './NewScopedTokenSheet'

export interface NewScopedTokenButtonProps {
  onCreateToken: (token: any) => void
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
