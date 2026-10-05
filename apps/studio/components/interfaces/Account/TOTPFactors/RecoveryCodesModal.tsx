import { AuthError, AuthMFARecoveryCodesGenerateResponseData } from '@supabase/auth-js'
import { UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Download } from 'lucide-react'
import { ComponentProps, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  cn,
  copyToClipboard,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { formatRecoveryCode } from './RecoveryCodesModal.utils'
import { AlertError } from '@/components/ui/AlertError'
import { recoveryCodeKeys } from '@/data/recovery-codes/keys'

interface RecoveryCodesModalProps<T>
  extends
    Omit<ComponentProps<typeof Dialog>, 'onOpenChange'>,
    Required<Pick<ComponentProps<typeof Dialog>, 'onOpenChange'>> {
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

  const { data, status, error, isError, isPending, isSuccess } = mutation
  const codes = data?.codes ?? []

  const title = useMemo(() => {
    switch (status) {
      case 'pending':
        return 'Generating your recovery codes...'
      case 'error':
        return 'An error occurred while generating your recovery code'
      default:
        return 'Save your recovery codes'
    }
  }, [status])

  const downloadCodes = () => {
    const blob = new Blob([codes.map((code) => formatRecoveryCode(code)).join('\n')], {
      type: 'text/plain;charset=utf-8;',
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.setAttribute('download', 'supabase-recovery-codes.txt')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (copiedToClipboard) {
      setTimeout(() => setCopiedToClipboard(false), 4000)
    }
  }, [copiedToClipboard])

  return (
    <Dialog
      {...props}
      onOpenChange={(open) => {
        // Prevent users from closing the dialog until they copied the codes
        if (!open && !copied && mutation.isSuccess) return
        // Prevent users from closing the dialog while the mutation is running
        if (mutation.isPending) return

        onOpenChange(open)
        if (!open) {
          setCopied(false)
          setCopiedToClipboard(false)
          mutation.reset()
          queryClient.invalidateQueries({ queryKey: recoveryCodeKeys.status() })
        }
      }}
    >
      <DialogContent hideClose aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle aria-busy={mutation.isPending} aria-live="polite" role="status">
            {title}
          </DialogTitle>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className={cn(isError && 'p-0 md:px-0')}>
          {isError && (
            <AlertError
              layout="vertical"
              className="rounded-none border-0"
              subject="Unable to generate recovery codes"
              error={error}
            />
          )}

          {isSuccess && (
            <div className="text-sm flex flex-col gap-4">
              <p>
                Recovery codes allow you to recover your account in case you lost access to your MFA
                apps. Save them somewhere safe.
              </p>

              <div className="flex flex-col gap-y-2">
                <ul className="bg-muted rounded-md p-4 border grid grid-cols-2 gap-2">
                  {codes?.map((code, idx) => (
                    <li key={code} className="font-mono text-sm flex gap-x-3">
                      <span className="text-foreground-lighter w-4 inline-block text-right select-none">
                        {idx + 1}
                      </span>
                      <span>{formatRecoveryCode(code)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-x-2">
                  <Button
                    icon={copiedToClipboard ? <Check className="text-brand-default" /> : <Copy />}
                    className="ml-auto w-min"
                    onClick={() =>
                      copyToClipboard(
                        codes.map((code) => formatRecoveryCode(code)).join('\n') ?? '',
                        () => setCopiedToClipboard(true)
                      )
                    }
                  >
                    {copiedToClipboard ? 'Copied' : 'Copy'}
                  </Button>
                  <Button icon={<Download />} onClick={downloadCodes}>
                    Download
                  </Button>
                </div>
              </div>

              <span className="sr-only" aria-live="polite">
                {copiedToClipboard && 'Codes copied to clipboard'}
              </span>

              <Admonition
                type="warning"
                title="You won't see these codes again"
                description="Save them somewhere safe. If you lose them, you'll need to regenerate new codes."
              >
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="codeCopied"
                    checked={copied}
                    onCheckedChange={(checked) => setCopied(checked === true)}
                  />
                  <label
                    htmlFor="codeCopied"
                    className="text-sm text-warning leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I have saved my recovery codes somewhere safe
                  </label>
                </div>
              </Admonition>
            </div>
          )}
        </DialogSection>

        {!isPending && (
          <DialogFooter className="items-center">
            <DialogClose
              asChild
              disabled={!copied && !isError}
              className={copied || isError ? 'opacity-100' : ''}
            >
              <Button variant={isSuccess ? 'primary' : 'default'}>
                {isSuccess ? 'Done' : 'Close'}
              </Button>
            </DialogClose>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
