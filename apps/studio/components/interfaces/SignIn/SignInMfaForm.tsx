import { zodResolver } from '@hookform/resolvers/zod'
import type { Factor } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { Lock, Fingerprint } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useAuthError } from 'common'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useMfaChallengeAndVerifyMutation } from 'data/profile/mfa-challenge-and-verify-mutation'
import { useMfaAuthenticateWebAuthnMutation } from 'data/profile/mfa-webauthn-authenticate-mutation'
import { useMfaListFactorsQuery } from 'data/profile/mfa-list-factors-query'
import { useSignOut } from 'lib/auth'
import { getReturnToPath } from 'lib/gotrue'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  RadioGroupStacked,
  RadioGroupStackedItem,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { Alert, AlertDescription, AlertTitle } from 'ui/src/components/shadcn/ui/alert'
import { SupportLink } from '../Support/SupportLink'

const schema = z.object({
  code: z.string().optional(),
  selectedFactorType: z.enum(['totp', 'webauthn']).optional(),
})

const formId = 'sign-in-mfa-form'

interface SignInMfaFormProps {
  context?: 'forgot-password' | 'sign-in'
}

export const SignInMfaForm = ({ context = 'sign-in' }: SignInMfaFormProps) => {
  const router = useRouter()
  const signOut = useSignOut()
  const queryClient = useQueryClient()
  const [selectedFactor, setSelectedFactor] = useState<Factor | null>(null)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', selectedFactorType: undefined },
  })

  const handleSuccess = async () => {
    if (context === 'forgot-password') {
      router
        .push({
          pathname: '/reset-password',
          query: router.query,
        })
        .then(async () => {
          await queryClient.resetQueries()
        })
    } else {
      router.push(getReturnToPath())
    }
  }

  const {
    data: factors,
    error: factorsError,
    isError: isErrorFactors,
    isSuccess: isSuccessFactors,
    isLoading: isLoadingFactors,
  } = useMfaListFactorsQuery()
  const {
    mutate: mfaChallengeAndVerify,
    isLoading: isTotpVerifying,
    isSuccess: isTotpSuccess,
  } = useMfaChallengeAndVerifyMutation({
    onSuccess: handleSuccess,
  })
  const {
    mutate: mfaAuthenticateWebAuthn,
    isLoading: isWebAuthnVerifying,
    isSuccess: isWebAuthnSuccess,
  } = useMfaAuthenticateWebAuthnMutation({
    onSuccess: handleSuccess,
  })

  const isFormDisabled =
    isTotpVerifying || isWebAuthnVerifying || isTotpSuccess || isWebAuthnSuccess

  const onClickLogout = async () => {
    await signOut()
    await router.replace('/sign-in')
  }

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ code, selectedFactorType }) => {
    if (!selectedFactor) return

    if (selectedFactorType === 'webauthn') {
      mfaAuthenticateWebAuthn({
        factorId: selectedFactor.id,
        webauthn: { rpId: window.location.hostname, rpOrigins: [window.location.origin] },
      })
    } else if (code && selectedFactorType === 'totp') {
      mfaChallengeAndVerify({ factorId: selectedFactor.id, code, refreshFactors: false })
    }
  }

  useEffect(() => {
    if (isSuccessFactors) {
      // if the user wanders into this page and he has no MFA setup, send the user to the next screen
      if (factors.totp.length === 0 && factors.webauthn.length === 0) {
        queryClient.resetQueries().then(() => router.push(getReturnToPath()))
        return
      }

      // Auto-select the first available factor and set the form type
      if (factors.totp.length > 0) {
        setSelectedFactor(factors.totp[0])
        form.setValue('selectedFactorType', 'totp')
      } else if (factors.webauthn.length > 0) {
        setSelectedFactor(factors.webauthn[0])
        form.setValue('selectedFactorType', 'webauthn')
      }
    }
  }, [factors?.totp, factors?.webauthn, isSuccessFactors, router, queryClient, form])

  const error = useAuthError()

  if (error) {
    return (
      <AlertError
        error={error}
        subject="Error while signing in"
        additionalActions={
          <Button asChild type="warning" className="w-min">
            <Link href="/sign-in">Back to sign in</Link>
          </Button>
        }
      />
    )
  }

  return (
    <>
      {isLoadingFactors && <GenericSkeletonLoader />}

      {isErrorFactors && <AlertError error={factorsError} subject="Failed to retrieve factors" />}

      {isSuccessFactors && (
        <Form_Shadcn_ {...form}>
          <form id={formId} className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Factor Type Selection - only show if both types are available */}
            {factors.totp.length > 0 && factors.webauthn.length > 0 && (
              <FormField_Shadcn_
                name="selectedFactorType"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout name="selectedFactorType" label="Choose authentication method">
                    <FormControl_Shadcn_>
                      <RadioGroupStacked
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value)
                          // Update selected factor when type changes
                          if (value === 'totp' && factors.totp.length > 0) {
                            setSelectedFactor(factors.totp[0])
                          } else if (value === 'webauthn' && factors.webauthn.length > 0) {
                            setSelectedFactor(factors.webauthn[0])
                          }
                        }}
                        className="flex flex-col"
                      >
                        {factors.totp.length > 0 && (
                          <RadioGroupStackedItem
                            value="totp"
                            id="totp"
                            label="Authenticator app (TOTP)"
                          />
                        )}
                        {factors.webauthn.length > 0 && (
                          <RadioGroupStackedItem
                            value="webauthn"
                            id="webauthn"
                            label="WebAuthn (YubiKey)"
                          />
                        )}
                      </RadioGroupStacked>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            )}

            {/* TOTP Code Input - only show for TOTP factors */}
            {form.watch('selectedFactorType') === 'totp' && (
              <FormField_Shadcn_
                key="code"
                name="code"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="code"
                    label={
                      selectedFactor && factors?.totp.length === 2
                        ? `Code generated by ${selectedFactor.friendly_name}`
                        : 'Enter verification code'
                    }
                  >
                    <FormControl_Shadcn_>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-light [&_svg]:stroke-[1.5] [&_svg]:h-[20px] [&_svg]:w-[20px]">
                          <Lock />
                        </div>
                        <Input_Shadcn_
                          id="code"
                          className="pl-10"
                          {...field}
                          autoFocus
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck="false"
                          placeholder="XXXXXX"
                          disabled={isTotpVerifying}
                        />
                      </div>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            )}

            {/* WebAuthn Info - only show for WebAuthn factors */}
            {form.watch('selectedFactorType') === 'webauthn' && (
              <Alert>
                <Fingerprint />
                <AlertTitle>Security Key Authentication</AlertTitle>
                <AlertDescription>
                  Click "Verify" to use your security key:
                  <div className="block italic">{selectedFactor?.friendly_name}</div>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between space-x-2">
              <Button
                block
                type="outline"
                size="large"
                disabled={isFormDisabled}
                onClick={onClickLogout}
                className="opacity-80 hover:opacity-100 transition"
              >
                Cancel
              </Button>
              <Button
                block
                form={formId}
                htmlType="submit"
                size="large"
                disabled={isFormDisabled}
                loading={isFormDisabled}
              >
                {isWebAuthnVerifying ? 'Verifying' : isWebAuthnSuccess ? 'Signing in' : 'Verify'}
              </Button>
            </div>
          </form>
        </Form_Shadcn_>
      )}

      <div className="my-8">
        <div className="text-sm">
          <span className="text-foreground-light">Unable to sign in?</span>{' '}
        </div>
        <ul className="list-disc pl-6">
          {/* TOTP factor switching - only show if multiple TOTP factors */}
          {factors?.totp.length === 2 && form.watch('selectedFactorType') === 'totp' && (
            <li>
              <button
                type="button"
                className="text-sm text-foreground-light hover:text-foreground cursor-pointer"
                onClick={() => {
                  const otherFactor = factors.totp.find((f) => f.id !== selectedFactor?.id)
                  if (otherFactor) {
                    setSelectedFactor(otherFactor)
                  }
                }}
              >{`Authenticate using ${
                factors.totp.find((f) => f.id !== selectedFactor?.id)?.friendly_name
              }?`}</button>
            </li>
          )}
          {/* WebAuthn factor switching - only show if multiple WebAuthn factors */}
          {factors?.webauthn.length === 2 && form.watch('selectedFactorType') === 'webauthn' && (
            <li>
              <button
                type="button"
                className="text-sm text-foreground-light hover:text-foreground cursor-pointer"
                onClick={() => {
                  const otherFactor = factors.webauthn.find((f) => f.id !== selectedFactor?.id)
                  if (otherFactor) {
                    setSelectedFactor(otherFactor)
                  }
                }}
              >{`Authenticate using ${
                factors.webauthn.find((f) => f.id !== selectedFactor?.id)?.friendly_name
              }?`}</button>
            </li>
          )}
          <li>
            <Link
              href="/logout"
              className="text-sm transition text-foreground-light hover:text-foreground"
            >
              Force sign out and clear cookies
            </Link>
          </li>
          <li>
            <SupportLink
              className="text-sm transition text-foreground-light hover:text-foreground"
              queryParams={{
                subject: 'Unable to sign in via MFA',
                category: SupportCategories.LOGIN_ISSUES,
              }}
            >
              Reach out to us via support
            </SupportLink>
          </li>
        </ul>
      </div>
    </>
  )
}
