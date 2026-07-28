import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from 'ui'

import { selectionToScopes } from '../AccessToken.permissions'
import { NewScopedTokenForm } from './Form/NewScopedTokenForm'
import { getExpiryDate, type TokenFormValues } from './Form/NewScopedTokenForm.utils'
import { NewScopedTokenSuccess } from './Form/NewScopedTokenSuccess'
import {
  useScopedAccessTokenCreateMutation,
  type NewScopedAccessToken,
  type ScopedAccessTokenCreateVariables,
} from '@/data/scoped-access-tokens/scoped-access-token-create-mutation'
import { useTrack } from '@/lib/telemetry/track'

export const NewScopedTokenSheet = () => {
  const [isOpen, setIsOpen] = useState(false)
  const track = useTrack()
  const { mutate: createToken, isPending } = useScopedAccessTokenCreateMutation()

  const [step, setStep] = useState<'form' | 'success'>('form')
  const [createdToken, setCreatedToken] = useState<NewScopedAccessToken | undefined>()

  const handleCreate = (values: TokenFormValues) => {
    const permissions = selectionToScopes(values.permissions)
    if (permissions.length === 0) return

    const expires_at =
      values.expiresAt === 'custom' ? values.customExpiryDate : getExpiryDate(values.expiresAt)

    const payload: ScopedAccessTokenCreateVariables = {
      name: values.tokenName.trim(),
      permissions,
      ...(expires_at ? { expires_at } : {}),
      ...(values.resourceAccess === 'project' ? { project_refs: values.projectRefs } : {}),
      ...(values.resourceAccess === 'organization'
        ? { organization_slugs: values.organizationSlugs }
        : {}),
    }

    createToken(payload, {
      onSuccess: (data) => {
        track('access_token_created', {
          tokenType: 'scoped',
          expiryPreset: values.expiresAt,
          resourceAccess: values.resourceAccess,
          permissionCount: permissions.length,
        })
        toast.success('Access token created successfully')
        setCreatedToken(data)
        setStep('success')
      },
    })
  }

  // By default, if users created a token successfully, they can't click outside the sheet to close it
  // as we need to make sure they copied the new token first
  const handleOpenChange = (open: boolean, isSafe = false) => {
    if (open === false && step === 'success' && !isSafe) return
    setStep('form')
    setIsOpen(open)
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="primary">Generate new token</Button>
      </SheetTrigger>
      <SheetContent
        showClose={false}
        size="default"
        className="flex h-full min-w-[720px]! flex-col gap-0"
      >
        <SheetHeader>
          <SheetTitle>{step === 'success' ? 'Token created' : 'Generate token'}</SheetTitle>
          <SheetDescription className="sr-only">
            Generate a new scoped access token in two steps: configure, then review.
          </SheetDescription>
        </SheetHeader>
        {step === 'success' && createdToken ? (
          <NewScopedTokenSuccess
            tokenName={createdToken.name}
            tokenValue={createdToken.token}
            onClose={() => handleOpenChange(false, true)}
          />
        ) : (
          <NewScopedTokenForm isPending={isPending} onCreateToken={handleCreate} />
        )}
      </SheetContent>
    </Sheet>
  )
}
