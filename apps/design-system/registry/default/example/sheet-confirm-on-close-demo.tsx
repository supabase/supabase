import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input_Shadcn_ as Input,
  Label_Shadcn_ as Label,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'

interface EndpointValues {
  endpointUrl: string
  secretHeader: string
}

interface ConfirmOnCloseModalProps {
  visible: boolean
  onClose: () => void
  onCancel: () => void
}

const defaultValues: EndpointValues = {
  endpointUrl: '',
  secretHeader: '',
}

const useConfirmOnClose = ({
  checkIsDirty,
  onClose,
}: {
  checkIsDirty: () => boolean
  onClose: () => void
}) => {
  const [visible, setVisible] = useState(false)

  const confirmOnClose = useCallback(() => {
    if (checkIsDirty()) {
      setVisible(true)
      return
    }

    onClose()
  }, [checkIsDirty, onClose])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        confirmOnClose()
      }
    },
    [confirmOnClose]
  )

  const onConfirm = useCallback(() => {
    setVisible(false)
    onClose()
  }, [onClose])

  const onCancel = useCallback(() => {
    setVisible(false)
  }, [])

  const modalProps: ConfirmOnCloseModalProps = useMemo(
    () => ({
      visible,
      onClose: onConfirm,
      onCancel,
    }),
    [visible, onConfirm, onCancel]
  )

  return {
    confirmOnClose,
    handleOpenChange,
    modalProps,
  }
}

const DiscardChangesAlertDialog = ({ visible, onClose, onCancel }: ConfirmOnCloseModalProps) => {
  const isConfirmingRef = useRef(false)

  useEffect(() => {
    if (visible) {
      isConfirmingRef.current = false
    }
  }, [visible])

  const handleConfirm = useCallback(() => {
    isConfirmingRef.current = true
    onClose()
  }, [onClose])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return

      if (isConfirmingRef.current) {
        isConfirmingRef.current = false
        return
      }

      onCancel()
    },
    [onCancel]
  )

  return (
    <AlertDialog open={visible} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>
            Any unsaved changes to this endpoint will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={handleConfirm}>
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function SheetConfirmOnCloseDemo() {
  const [open, setOpen] = useState(false)
  const [savedValues, setSavedValues] = useState<EndpointValues>(defaultValues)
  const [draftValues, setDraftValues] = useState<EndpointValues>(defaultValues)

  const isDirty = useMemo(
    () =>
      draftValues.endpointUrl !== savedValues.endpointUrl ||
      draftValues.secretHeader !== savedValues.secretHeader,
    [draftValues, savedValues]
  )

  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: () => isDirty,
    onClose: () => {
      setDraftValues(savedValues)
      setOpen(false)
    },
  })

  const openSheet = () => {
    setDraftValues(savedValues)
    setOpen(true)
  }

  const saveChanges = () => {
    setSavedValues(draftValues)
    setOpen(false)
  }

  return (
    <>
      <Button type="default" onClick={openSheet}>
        Open endpoint sheet
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="flex flex-col gap-0">
          <SheetHeader>
            <SheetTitle>Edit endpoint</SheetTitle>
          </SheetHeader>
          <Separator />
          <SheetSection className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint-url">Endpoint URL</Label>
              <Input
                id="endpoint-url"
                value={draftValues.endpointUrl}
                placeholder="https://api.example.com/webhooks/supabase"
                onChange={(event) =>
                  setDraftValues((current) => ({
                    ...current,
                    endpointUrl: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-header">Secret header</Label>
              <Input
                id="secret-header"
                value={draftValues.secretHeader}
                placeholder="Bearer top-secret-value"
                onChange={(event) =>
                  setDraftValues((current) => ({
                    ...current,
                    secretHeader: event.target.value,
                  }))
                }
              />
            </div>
          </SheetSection>
          <Separator />
          <SheetFooter>
            <Button type="default" onClick={confirmOnClose}>
              Cancel
            </Button>
            <Button onClick={saveChanges} disabled={!isDirty}>
              Save changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <DiscardChangesAlertDialog {...modalProps} />
    </>
  )
}
