import type { ComponentPropsWithoutRef, KeyboardEvent } from 'react'
import { forwardRef, useCallback, useState } from 'react'

import { Input_Shadcn_ } from 'ui'

export const InputCheckComposition = forwardRef(
  ({ onKeyDown, ...props }: ComponentPropsWithoutRef<typeof Input_Shadcn_>, ref) => {
    const [isImeComposing, setIsImeComposing] = useState(false)

    const onKeyDownExceptIme = useCallback(
      (event: KeyboardEvent<HTMLInputElement>) => {
        if (isImeComposing) return
        onKeyDown?.(event)
      },
      [isImeComposing, onKeyDown]
    )

    return (
      <Input_Shadcn_
        {...props}
        onCompositionStart={() => setIsImeComposing(true)}
        onCompositionEnd={() => setIsImeComposing(false)}
        onKeyDown={onKeyDownExceptIme}
      />
    )
  }
)
