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
import { ExperimentalTokenDropdown } from '../Classic/ExperimentalTokenDropdown'
import { NewScopedTokenForm } from './Form/NewScopedTokenForm'
import { getExpiryDate, type TokenFormValues } from './Form/NewScopedTokenForm.utils'
import { NewScopedTokenSuccess } from './Form/NewScopedTokenSuccess'
import {
  useAccessTokenCreateMutation,
  type NewAccessToken,
} from '@/data/access-tokens/access-tokens-create-mutation'
import {
  useScopedAccessTokenCreateMutation,
  type NewScopedAccessToken,
  type ScopedAccessTokenCreateVariables,
} from '@/data/scoped-access-tokens/scoped-access-token-create-mutation'
import { useTrack } from '@/lib/telemetry/track'

interface NewScopedTokenSheetProps {
  /** Called with the created token when one is generated through the experimental API dialog. */
  onCreateExperimentalToken: (token: NewAccessToken) => void
}

export const NewScopedTokenSheet = ({ onCreateExperimentalToken }: NewScopedTokenSheetProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const track = useTrack()
  const { mutate: createToken, isPending: isCreatingScopedToken } =
    useScopedAccessTokenCreateMutation()
  const { mutate: createClassicToken, isPending: isCreatingClassicToken } =
    useAccessTokenCreateMutation()

  const [step, setStep] = useState<'form' | 'success'>('form')
  const [createdToken, setCreatedToken] = useState<
    NewScopedAccessToken | NewAccessToken | undefined
  >()

  const showCreatedToken = (data: NewScopedAccessToken | NewAccessToken) => {
    toast.success('Access token created successfully')
    setCreatedToken(data)
    setStep('success')
  }

  const handleCreate = (values: TokenFormValues) => {
    const expires_at =
      values.expiresAt === 'custom' ? values.customExpiryDate : getExpiryDate(values.expiresAt)

    // 'account' access creates a classic (account-wide) token via the legacy endpoint.
    if (values.resourceAccess === 'account') {
      createClassicToken(
        { name: values.tokenName.trim(), expires_at },
        {
          onSuccess: (data) => {
            track('access_token_created', {
              tokenType: 'classic',
              expiryPreset: values.expiresAt,
            })
            showCreatedToken(data)
          },
        }
      )
      return
    }

    const permissions = selectionToScopes(values.permissions)
    if (permissions.length === 0) return

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
        showCreatedToken(data)
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
      <div className="flex items-center">
        <SheetTrigger asChild>
          <Button variant="primary" className="rounded-r-none px-3 hover:z-10 focus-visible:z-10">
            Generate new token
          </Button>
        </SheetTrigger>
        <ExperimentalTokenDropdown onCreateToken={onCreateExperimentalToken} />
      </div>
      <SheetContent
        showClose={false}
        size="default"
        className="flex h-full flex-col gap-0 sm:w-[656px] lg:w-[800px]"
      >
        <SheetHeader>
          <SheetTitle>{step === 'success' ? 'Token created' : 'Generate token'}</SheetTitle>
          <SheetDescription className="sr-only">
            Configure and create a new access token.
          </SheetDescription>
        </SheetHeader>
        {step === 'success' && createdToken ? (
          <NewScopedTokenSuccess
            tokenName={createdToken.name}
            tokenValue={createdToken.token}
            onClose={() => handleOpenChange(false, true)}
          />
        ) : (
          <NewScopedTokenForm
            isPending={isCreatingScopedToken || isCreatingClassicToken}
            onCreateToken={handleCreate}
            onCancel={() => handleOpenChange(false, true)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
