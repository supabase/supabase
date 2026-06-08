import { useState } from 'react'
import { Alert } from 'ui/src/components/shadcn/ui/alert'
import { Button } from 'ui/src/components/shadcn/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'ui/src/components/shadcn/ui/dialog'

import { Input } from '../DataInputs/Input'

export type BaseUrlDialogProps = {
  defaultValue?: string
  onChange?: (value: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BaseUrlDialog({ open, onOpenChange, defaultValue, onChange }: BaseUrlDialogProps) {
  const [value, setValue] = useState(defaultValue ?? '')
  const [error, setError] = useState<Error>()

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange?.(open)
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="pb-0">
          <DialogTitle>Change base URL</DialogTitle>
          <DialogDescription>
            Change the base URL shown in the generated snippets.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()

            try {
              const baseUrl = new URL(value)
              const newValue = (baseUrl.origin + baseUrl.pathname).replace(/\/+$/, '')

              setValue(newValue)
              onChange?.(newValue)
              onOpenChange?.(false)
              setError(undefined)
            } catch (err) {
              setError(new Error('Invalid URL'))
            }
          }}
        >
          <div className="px-7 flex flex-col gap-4">
            <Input
              value={value}
              placeholder="https://example.com"
              onChange={(e) => {
                setValue(e.target.value)
              }}
            />
            {error && <Alert className="text-red-900">{error.message}</Alert>}
          </div>
          <DialogFooter>
            <Button variant="outline" type="submit">
              Change
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
