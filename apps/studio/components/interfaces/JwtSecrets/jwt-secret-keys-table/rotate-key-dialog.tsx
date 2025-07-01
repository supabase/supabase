import { ComponentProps, useState } from 'react'
import { Info, Key, Timer, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import {
  cn,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Label_Shadcn_,
  Checkbox_Shadcn_,
  Skeleton,
  Button,
} from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useEdgeFunctionsQuery } from 'data/edge-functions/edge-functions-query'
import { JWTSigningKey } from 'data/jwt-signing-keys/jwt-signing-keys-query'
import { useJWTSigningKeyUpdateMutation } from 'data/jwt-signing-keys/jwt-signing-key-update-mutation'
import { algorithmDescriptions, algorithmLabels } from '../algorithm-details'
import { statusColors, statusLabels } from '../jwt.constants'

export function RotateKeyDialog({
  projectRef,
  standbyKey,
  inUseKey,
  onClose,
}: {
  projectRef: string
  standbyKey: JWTSigningKey
  inUseKey: JWTSigningKey
  onClose: () => void
}) {
  const [isStandbyUnderstood, setStandbyUnderstood] = useState(false)
  const [isPreviouslyUsedUnderstood, setPreviouslyUsedUnderstood] = useState(false)
  const [isEdgeFunctionsVerifyJWTUnderstood, setEdgeFunctionsVerifyJWTUnderstood] = useState(false)

  const { data: edgeFunctions, isLoading: isLoadingEdgeFunctions } = useEdgeFunctionsQuery({
    projectRef,
  })

  const { mutate, isLoading: isLoadingMutation } = useJWTSigningKeyUpdateMutation({
    onSuccess: () => {
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to rotate signing key: ${error.message}`)
    },
  })

  const verifyJWTEdgeFunctions = edgeFunctions?.filter(({ verify_jwt }) => verify_jwt) ?? []

  return (
    <>
      <DialogHeader>
        <DialogTitle>Rotate JWT signing key</DialogTitle>
        <DialogDescription>
          Change the key used by Supabase Auth to create new JSON Web Tokens. Non-expired tokens
          remain valid and accepted!
        </DialogDescription>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection className="bg">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2">
          <Badge
            className={cn(
              statusColors['standby'],
              'px-4 py-1 gap-2 flex flex-row items-center uppercase'
            )}
          >
            <Timer className="size-4" />
            Standby key
          </Badge>
          <div>
            <ArrowRight className="size-4 text-foreground-light" />
          </div>
          <div>
            <Badge
              className={cn(
                statusColors['in_use'],
                'px-4 py-1 gap-2 flex flex-row items-center uppercase'
              )}
            >
              <Key className="size-4" />
              Current key
            </Badge>
          </div>
          <div className="text-xs text-foreground-light font-mono text-center">
            {algorithmLabels[standbyKey.algorithm]}
          </div>
          <div />
          <div />

          <div className="col-span-3" />

          <Badge
            className={cn(
              statusColors['in_use'],
              'px-4 py-1 gap-2 flex flex-row items-center uppercase'
            )}
          >
            <Key className="size-4" />
            Current key
          </Badge>
          <div>
            <ArrowRight className="h-4 w-4 text-foreground-light" />
          </div>
          <Badge
            className={cn(
              statusColors['previously_used'],
              'px-4 py-1 gap-2 flex flex-row items-center uppercase'
            )}
          >
            <Timer className="size-4" />
            Previous key
          </Badge>
          <div />
          <div />
          <div className="text-xs text-foreground-light font-mono text-center">
            {algorithmLabels[inUseKey.algorithm]}
          </div>
        </div>
      </DialogSection>
      <DialogSectionSeparator />
      <DialogSection className="flex flex-col gap-4">
        {isLoadingEdgeFunctions ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </>
        ) : (
          <>
            <div className="text-sm">To proceeed please confirm:</div>

            <Label_Shadcn_
              htmlFor="understands-standby"
              className="flex items-top gap-4 text-sm leading-none"
            >
              <Checkbox_Shadcn_
                id="understands-standby"
                checked={isStandbyUnderstood}
                onCheckedChange={(value) => setStandbyUnderstood(!!value)}
              />
              All of my application's components have picked up the standby key
              <ButtonTooltip
                type="default"
                icon={<Info />}
                tooltip={{
                  content: {
                    className: 'max-w-[320px] p-4',
                    text: (
                      <p>
                        If your application verifies JWTs on its own in backend servers, functions,
                        lambdas or other such components, ensure that they've picked up and are
                        verifying tokens against the standby key.
                        <br />
                        <br />
                        Recommendation: Periodically fetch the public keys from the project's{' '}
                        <code>jwks.json</code> endpoint.
                      </p>
                    ),
                  },
                }}
              />
            </Label_Shadcn_>

            <Label_Shadcn_
              htmlFor="understands-previously-used"
              className="flex items-top gap-4 text-sm leading-none"
            >
              <Checkbox_Shadcn_
                id="understands-previously-used"
                checked={isPreviouslyUsedUnderstood}
                onCheckedChange={(value) => setPreviouslyUsedUnderstood(!!value)}
              />
              To invalidate non-expired JWTs I need to explicitly revoke the currently used key
              <ButtonTooltip
                type="default"
                icon={<Info />}
                tooltip={{
                  content: {
                    className: 'max-w-[320px] p-4',
                    text: (
                      <p>
                        Rotating the signing key only changes what key is used by Supabase Auth to
                        issue{' '}
                        <strong>
                          <em>new tokens</em>
                        </strong>
                        .<br />
                        <br />
                        To prevent users from being prematurely signed out, you have to manually
                        revoke the current in use key after rotation.
                        <br />
                        <br />
                        Recommendation: If your JWT expiry time is 1 hour, wait at least 1 hour and
                        15 minutes before revoking the key.
                      </p>
                    ),
                  },
                }}
              />
            </Label_Shadcn_>

            {verifyJWTEdgeFunctions.length > 0 && (
              <Label_Shadcn_
                htmlFor="edge-functions-verify-jwt"
                className="flex items-top gap-4 text-sm leading-none"
              >
                <Checkbox_Shadcn_
                  id="edge-functions-verify-jwt"
                  checked={isEdgeFunctionsVerifyJWTUnderstood}
                  onCheckedChange={(value) => setEdgeFunctionsVerifyJWTUnderstood(!!value)}
                />
                The following Edge Functions may stop funtioning as they verify the legacy JWT
                secret: {verifyJWTEdgeFunctions.map(({ name }) => name).join(', ')}
                <ButtonTooltip
                  type="default"
                  icon={<Info />}
                  tooltip={{
                    content: {
                      className: 'max-w-[320px] p-4',
                      text: (
                        <p>
                          Edge Functions can verify only the legacy JWT secret. Since rotation will
                          change they key that signs JWTs if your Edge Function is set up to reject
                          JWTs not signed by the legacy JWT secret they might stop functioning.
                          <br />
                          <br />
                          Recommendation: Change all of your Edge Functions to use the{' '}
                          <code>--no-verify-jwt</code> option and implement JWT verification logic
                          within the function's body.
                        </p>
                      ),
                    },
                  }}
                />
              </Label_Shadcn_>
            )}
          </>
        )}
      </DialogSection>
      <DialogFooter>
        <Button
          onClick={() => mutate({ projectRef, keyId: standbyKey.id, status: 'in_use' })}
          disabled={
            isLoadingEdgeFunctions ||
            !isPreviouslyUsedUnderstood ||
            !isStandbyUnderstood ||
            (!!verifyJWTEdgeFunctions.length && !isEdgeFunctionsVerifyJWTUnderstood)
          }
          loading={isLoadingMutation}
        >
          Rotate signing key
        </Button>
      </DialogFooter>
    </>
  )
}
