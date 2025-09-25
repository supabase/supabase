import { zodResolver } from '@hookform/resolvers/zod'
import type { Factor } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { Lock, Smartphone, Key } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { type SubmitHandler, useForm } from 'react-hook-form'
import z from 'zod'

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useMfaChallengeAndVerifyMutation } from 'data/profile/mfa-challenge-and-verify-mutation'
import { useMfaListFactorsQuery } from 'data/profile/mfa-list-factors-query'
import { useSignOut } from 'lib/auth'
import { getReturnToPath } from 'lib/gotrue'
import { auth } from 'lib/gotrue'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  RadioGroup_Shadcn_,
  RadioGroupItem_Shadcn_,
  Label_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

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
  const [isWebAuthnAuthenticating, setIsWebAuthnAuthenticating] = useState(false)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', selectedFactorType: undefined },
  })

  const handleSuccess = async () => {
    await queryClient.resetQueries()

    if (context === 'forgot-password') {
      router.push({
        pathname: '/reset-password',
        query: router.query,
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
    isLoading: isVerifying,
    isSuccess,
  } = useMfaChallengeAndVerifyMutation({
    onSuccess: handleSuccess,
  })

  const onClickLogout = async () => {
    await signOut()
    await router.replace('/sign-in')
  }

  const onSubmit: SubmitHandler<z.infer<typeof schema>> = async ({ code, selectedFactorType }) => {
    if (!selectedFactor) return

    if (selectedFactorType === 'webauthn') {
      await handleWebAuthnAuthentication()
    } else if (code && selectedFactorType === 'totp') {
      mfaChallengeAndVerify({ factorId: selectedFactor.id, code, refreshFactors: false })
    }
  }

  const handleWebAuthnAuthentication = async () => {
    if (!selectedFactor) return

    setIsWebAuthnAuthenticating(true)
    try {
      const { error } = await auth.mfa.webauthn.authenticate({
        factorId: selectedFactor.id,
        rpId: window.location.hostname,
        rpOrigins: [window.location.origin],
      })

      if (error) {
        throw error
      }

      handleSuccess()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'WebAuthn authentication failed'
      console.error('WebAuthn authentication error:', errorMessage)
      // The error will be handled by the mutation's onError callback
    } finally {
      setIsWebAuthnAuthenticating(false)
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
                      <RadioGroup_Shadcn_
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
                        className="grid grid-cols-1 gap-3"
                      >
                        {factors.totp.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem_Shadcn_ value="totp" id="totp" />
                            <Label_Shadcn_
                              htmlFor="totp"
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <Smartphone className="h-4 w-4" />
                              <span>Authenticator app (TOTP)</span>
                            </Label_Shadcn_>
                          </div>
                        )}
                        {factors.webauthn.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem_Shadcn_ value="webauthn" id="webauthn" />
                            <Label_Shadcn_
                              htmlFor="webauthn"
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <Key className="h-4 w-4" />
                              <span>Security key (WebAuthn)</span>
                            </Label_Shadcn_>
                          </div>
                        )}
                      </RadioGroup_Shadcn_>
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
                          disabled={isVerifying}
                        />
                      </div>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            )}

            {/* WebAuthn Info - only show for WebAuthn factors */}
            {form.watch('selectedFactorType') === 'webauthn' && (
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Key className="h-5 w-5 text-foreground-light" />
                <div>
                  <p className="text-sm font-medium">Security Key Authentication</p>
                  <p className="text-xs text-foreground-light">
                    Click "Verify" to use your security key
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between space-x-2">
              <Button
                block
                type="outline"
                size="large"
                disabled={isVerifying || isSuccess || isWebAuthnAuthenticating}
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
                disabled={isVerifying || isSuccess || isWebAuthnAuthenticating}
                loading={isVerifying || isSuccess || isWebAuthnAuthenticating}
              >
                {isVerifying || isWebAuthnAuthenticating
                  ? 'Verifying'
                  : isSuccess
                    ? 'Signing in'
                    : 'Verify'}
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
            <Link href="/logout">Force sign out and clear cookies</Link>
          </li>
          <li>
            <Link
              target="_blank"
              rel="noreferrer"
              href="/support/new?subject=Unable+to+sign+in+via+MFA&category=Login_issues"
              className="text-sm transition text-foreground-light hover:text-foreground"
            >
              Reach out to us via support
            </Link>
          </li>
        </ul>
      </div>
    </>
  )
}
