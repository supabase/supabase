import { AuthError, AuthMFARecoveryCodesGenerateResponseData } from '@supabase/auth-js'
import { MutationStatus, UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { ComponentProps, useState } from 'react'
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
} from 'ui'

import { recoveryCodeKeys } from '@/data/recovery-codes/keys'

interface RecoveryCodesModalProps<T> extends ComponentProps<typeof Dialog> {
  mutation: UseMutationResult<AuthMFARecoveryCodesGenerateResponseData, AuthError, T>
}

export const RecoveryCodesModal = <T = unknown,>({
  onOpenChange,
  mutation,
  ...props
}: RecoveryCodesModalProps<T>) => {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  return (
    <Dialog
      {...props}
      onOpenChange={(open) => {
        // Prevent users from closing the dialog until they copied the codes
        if (!open && !copied && mutation.isSuccess) return

        onOpenChange?.(open)
        queryClient.invalidateQueries({ queryKey: recoveryCodeKeys.status() })
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle aria-busy={mutation.isPending} aria-live="polite" role="status">
            <GenerateRecoveryCodesModalTitle status={mutation.status} />
          </DialogTitle>
          <DialogDescription asChild>
            <div className="py-4">
              <GenerateRecoveryCodesModalContent
                status={mutation.status}
                codes={mutation.data?.codes}
                copied={copied}
                onCodesCopied={(copied) => setCopied(copied)}
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        {!mutation.isPending ? (
          <DialogFooter className="items-center">
            {copiedToClipboard ? (
              <span role="status" className="text-sm text-lighter">
                Codes copied to your clipboard.
              </span>
            ) : null}
            {copied || mutation.isError ? (
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            ) : null}

            <Button
              variant="primary"
              onClick={() =>
                copyToClipboard(mutation.data?.codes.join('\n') ?? '', () => {
                  setCopiedToClipboard(true)
                  setCopied(true)
                })
              }
            >
              Copy to clipboard
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
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
  copied,
  status,
  onCodesCopied,
}: {
  codes: AuthMFARecoveryCodesGenerateResponseData['codes'] | undefined
  copied?: boolean
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
        <p>
          Recovery codes allow you to recover your account in case you lost access to your MFA apps.
          Save your them somewhere safe.
        </p>
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
            checked={copied}
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
