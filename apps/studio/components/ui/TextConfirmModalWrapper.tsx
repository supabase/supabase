import { useFlag } from 'common'
import { ComponentPropsWithoutRef } from 'react'
import { TextConfirmModal as TextConfirmModalBase } from 'ui-patterns/Dialogs/TextConfirmModal'

export const TextConfirmModal = (props: ComponentPropsWithoutRef<typeof TextConfirmModalBase>) => {
  const enableCopyConfirmation = useFlag('textConfirmationModalClickToCopy')
  return <TextConfirmModalBase {...props} enableCopy={enableCopyConfirmation} />
}
