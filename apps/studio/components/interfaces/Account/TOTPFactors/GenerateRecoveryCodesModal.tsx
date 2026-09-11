import { AuthMFARecoveryCodesGenerateResponseData } from '@supabase/auth-js'
import { MutationStatus, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Button,
  Checkbox,
  copyToClipboard,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { recoveryCodeKeys } from '@/data/recovery-codes/keys'
import { useRecoveryCodesGenerateMutation } from '@/data/recovery-codes/recovery-codes-generate-mutation'

export const GenerateRecoveryCodesModal = () => {
  const queryClient = useQueryClient()
  const recoveryCodesGenerateMutation = useRecoveryCodesGenerateMutation()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  return (
    <Admonition
      type="danger"
      layout="horizontal"
      title="You haven't generated recovery codes yet"
      description="Recovery codes are important to ensure you can recover your account if you loose access to your MFA."
      actions={
        <Dialog
          open={open}
          onOpenChange={(open) => {
            // Prevent users from closing the dialog until they copied the codes
            if (!open && !copied) return

            setOpen(open)
            queryClient.invalidateQueries({ queryKey: recoveryCodeKeys.status() })
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => recoveryCodesGenerateMutation.mutate({})}>
              Generate recovery codes
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle
                aria-busy={recoveryCodesGenerateMutation.isPending}
                aria-live="polite"
                role="status"
              >
                <GenerateRecoveryCodesModalTitle status={recoveryCodesGenerateMutation.status} />
              </DialogTitle>
              <DialogDescription asChild>
                <div className="py-4">
                  <GenerateRecoveryCodesModalContent
                    status={recoveryCodesGenerateMutation.status}
                    codes={recoveryCodesGenerateMutation.data?.codes}
                    onCodesCopied={(copied) => setCopied(copied)}
                  />
                </div>
              </DialogDescription>
            </DialogHeader>
            {!recoveryCodesGenerateMutation.isPending ? (
              <DialogFooter className="items-center">
                {copiedToClipboard ? (
                  <span role="status" className="text-sm text-lighter">
                    Codes copied to your clipboard.
                  </span>
                ) : null}
                {copied ? (
                  <DialogClose asChild>
                    <Button>Close</Button>
                  </DialogClose>
                ) : null}

                <Button
                  variant="primary"
                  onClick={() =>
                    copyToClipboard(
                      recoveryCodesGenerateMutation.data?.codes.join('\n') ?? '',
                      () => {
                        setCopiedToClipboard(true)
                      }
                    )
                  }
                >
                  Copy to clipboard
                </Button>
              </DialogFooter>
            ) : null}
          </DialogContent>
        </Dialog>
      }
    />
  )
}

const GenerateRecoveryCodesModalTitle = ({ status }: { status: MutationStatus }) => {
  if (status === 'pending') {
    return 'Generating your recovery codes...'
  }
  if (status === 'error') {
    return 'An error occurred while generating your recovery code'
  }

  return 'Save your recovery codes'
}

const GenerateRecoveryCodesModalContent = ({
  codes,
  status,
  onCodesCopied,
}: {
  codes: AuthMFARecoveryCodesGenerateResponseData['codes'] | undefined
  status: MutationStatus
  onCodesCopied: (copied: boolean) => void
}) => {
  if (status === 'error') {
    return (
      <p className="text-destructive">
        We couldn't generate your recovery code. Please try again later or contact support if the
        problem persists.
      </p>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col gap-4">
        <p>Save your recovery codes somewhere safe.</p>
        <pre className="relative bg-muted rounded-md py-2 px-4">
          <code className="flex gap-2 flex-wrap justify-between">
            {codes?.map((code) => (
              <span key={code}>{code}</span>
            ))}
          </code>
        </pre>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="codeCopied"
            onCheckedChange={(checked) => onCodesCopied(checked === true)}
          />
          <label
            htmlFor="codeCopied"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have copied the codes
          </label>
        </div>
      </div>
    )
  }

  return null
}
