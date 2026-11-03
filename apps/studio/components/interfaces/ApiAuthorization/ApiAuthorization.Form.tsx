import dayjs from 'dayjs'
import Link from 'next/link'
import { type ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import type { EffectiveScopes } from './ApiAuthorization.EffectiveScopes'
import type { ApprovalState, IApprovalFormSchema } from './ApiAuthorization.Schema'
import {
  AuthorizeConnectLogo,
  AuthorizeImpersonationWarning,
  AuthorizeRequesterDetails,
  formatScopeLabels,
} from '@/components/interfaces/Organization/OAuthApps/AuthorizeRequesterDetails'
import { getOAuthImpersonationWarning } from '@/components/interfaces/Organization/OAuthApps/OAuthApps.utils'
import {
  InterstitialActionError,
  InterstitialLayout,
} from '@/components/layouts/InterstitialLayout'
import type { ApiAuthorizationResponse } from '@/data/api-authorization/api-authorization-query'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { Organization } from '@/types'

type OrganizationsState_Loading = {
  _tag: 'loading'
}

type OrganizationsState_Error = {
  _tag: 'error'
  error: StudioError | null
}

type OrganizationsState_Empty = {
  _tag: 'empty'
}

type OrganizationsState_NotMember = {
  _tag: 'not_member'
}

type OrganizationsState_Success = {
  _tag: 'success'
  organizations: Array<Organization>
}

export type OrganizationsState =
  | OrganizationsState_Loading
  | OrganizationsState_Error
  | OrganizationsState_Empty
  | OrganizationsState_NotMember
  | OrganizationsState_Success

/** `requested` means no preflight ran (organization-bound app or older API). */
export type ScopesState =
  | { _tag: 'requested' }
  | { _tag: 'loading' }
  | { _tag: 'error'; error: StudioError | null }
  | EffectiveScopes

function isExternalRedirectUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1'
  } catch {
    return false
  }
}

export interface ApiAuthorizationMainViewProps {
  auth_id: string
  approvalState: ApprovalState
  form: UseFormReturn<IApprovalFormSchema>
  requester: ApiAuthorizationResponse
  organizations: OrganizationsState
  scopes: ScopesState
  requestedOrganizationSlug: string | undefined
  actionError?: string
  onOrganizationChange: () => void
  onApprove: () => void
  onDecline: () => void
}

export function ApiAuthorizationMainView({
  auth_id,
  approvalState,
  form,
  requester,
  organizations,
  scopes,
  requestedOrganizationSlug,
  actionError,
  onOrganizationChange,
  onApprove,
  onDecline,
}: ApiAuthorizationMainViewProps): ReactNode {
  const isExpired = dayjs().isAfter(dayjs(requester.expires_at))
  const showReadyContent = !isExpired && organizations._tag === 'success'
  const canApprove =
    scopes._tag === 'requested' || scopes._tag === 'full' || scopes._tag === 'partial'
  const redirectUrl = requester.redirect_uri ?? requester.website
  const externalRedirectUrl = isExternalRedirectUrl(redirectUrl) ? redirectUrl : undefined

  return (
    <InterstitialLayout
      logo={
        <AuthorizeConnectLogo
          icon={requester.icon}
          name={requester.name}
          redirectUri={requester.redirect_uri}
        />
      }
      title={`Authorize ${requester.name}`}
      description="This application wants to access your Supabase account"
    >
      <div className="px-6 pb-6">
        <span className="sr-only">Authorize API access for {requester.name}</span>
        <div className="flex flex-col gap-5">
          {isExpired ? (
            <ExpiredNotice />
          ) : (
            <>
              <AuthorizeImpersonationWarning
                name={requester.name}
                redirectUri={requester.redirect_uri}
              />
              {organizations._tag === 'loading' && <OrganizationsLoader />}
              {organizations._tag === 'error' && (
                <OrganizationsErrorNotice error={organizations.error} />
              )}
              {organizations._tag === 'empty' && <OrganizationsEmptyState authId={auth_id} />}
              {organizations._tag === 'not_member' && <NotMemberOfOrganizationNotice />}
              {organizations._tag === 'success' && (
                <OrganizationSelector
                  form={form}
                  disabled={!!requestedOrganizationSlug}
                  requester={requester}
                  organizations={organizations.organizations}
                  requestedOrganizationSlug={requestedOrganizationSlug}
                  onOrganizationChange={onOrganizationChange}
                />
              )}
              {showReadyContent && (
                <>
                  <ScopesSection requester={requester} scopes={scopes} />
                  <FormFooter
                    approvalState={approvalState}
                    approveDisabled={!canApprove}
                    requester={requester}
                    redirectUrl={externalRedirectUrl}
                    actionError={actionError}
                    onApprove={onApprove}
                    onDecline={onDecline}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </InterstitialLayout>
  )
}

interface ScopesSectionProps {
  requester: ApiAuthorizationResponse
  scopes: ScopesState
}

function ScopesSection({ requester, scopes }: ScopesSectionProps): ReactNode {
  switch (scopes._tag) {
    case 'loading':
      return (
        <section className="space-y-2" aria-label="Permissions">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
            Permissions
          </p>
          <ShimmeringLoader className="h-[46px] w-full rounded-md py-0" />
        </section>
      )
    case 'error':
      return (
        <Admonition
          type="warning"
          title="Unable to check your permissions"
          description={
            <>
              Please try again. If the problem persists, contact support.
              {scopes.error && (
                <span className="mt-1 block text-foreground-lighter">
                  Error: {scopes.error.message}
                </span>
              )}
            </>
          }
        />
      )
    case 'blocked':
      return (
        <Admonition
          type="warning"
          title={`Your role can't authorize ${requester.name}`}
          description={
            scopes.missing.length > 0
              ? `Your ${scopes.roleName} role in this organization doesn't include: ${formatScopeLabels(scopes.missing).join(', ')}.`
              : `Your ${scopes.roleName} role in this organization doesn't allow authorizing this app.`
          }
        />
      )
    case 'partial':
      return (
        <>
          <AuthorizeRequesterDetails
            name={requester.name}
            domain={requester.domain}
            scopes={scopes.granted}
          />
          {scopes.denied.length > 0 && (
            <Admonition
              type="warning"
              title="Some permissions won't be granted"
              description={`Your ${scopes.roleName} role in this organization doesn't include: ${formatScopeLabels(scopes.denied).join(', ')}. ${requester.name} will only get the permissions listed above.`}
            />
          )}
        </>
      )
    case 'full':
    case 'requested':
      return (
        <AuthorizeRequesterDetails
          name={requester.name}
          domain={requester.domain}
          scopes={scopes._tag === 'full' ? scopes.scopes : requester.scopes}
        />
      )
  }
}

function ExpiredNotice(): ReactNode {
  return (
    <Admonition
      type="warning"
      title="Authorization request expired"
      description="Retry the authorization request from the requesting app."
    />
  )
}

function OrganizationsLoader(): ReactNode {
  return (
    <section className="space-y-2" aria-label="Organizations">
      <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
        Organization
      </p>
      <ShimmeringLoader className="h-[34px] w-full rounded-md py-0" />
    </section>
  )
}

interface OrganizationsErrorNoticeProps {
  error: StudioError | null
}

function OrganizationsErrorNotice({ error }: OrganizationsErrorNoticeProps): ReactNode {
  return (
    <Admonition
      type="warning"
      title="Unable to load organizations"
      description={
        <>
          Please try again. If the problem persists, contact support.
          {error && (
            <span className="mt-1 block text-foreground-lighter">Error: {error.message}</span>
          )}
        </>
      }
    />
  )
}

interface OrganizationsEmptyStateProps {
  authId: string
}

function OrganizationsEmptyState({ authId }: OrganizationsEmptyStateProps): ReactNode {
  const returnTo = `/authorize?auth_id=${authId}`

  return (
    <Admonition
      type="warning"
      title="No organizations found"
      description="Create an organization before authorizing this request."
      actions={[
        <Button asChild key="new-org">
          <Link href={`/new?returnTo=${encodeURIComponent(returnTo)}`}>Create an organization</Link>
        </Button>,
      ]}
    />
  )
}

function NotMemberOfOrganizationNotice(): ReactNode {
  return (
    <Admonition
      type="warning"
      title="Organization unavailable"
      description="Your account is not a member of the pre-selected organization."
    />
  )
}

interface OrganizationSelectorProps {
  form: UseFormReturn<IApprovalFormSchema>
  requester: ApiAuthorizationResponse
  requestedOrganizationSlug: string | undefined
  organizations: Array<Organization>
  disabled?: boolean
  onOrganizationChange: () => void
}

function OrganizationSelector({
  form,
  requester,
  requestedOrganizationSlug,
  organizations,
  disabled = false,
  onOrganizationChange,
}: OrganizationSelectorProps): ReactNode {
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="selectedOrgSlug"
        render={({ field, fieldState }) => (
          <FormItem className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
                Organization
              </p>
              {requestedOrganizationSlug && (
                <p className="text-xs text-foreground-lighter">Pre-selected by {requester.name}</p>
              )}
            </div>
            <FormControl>
              <Select
                value={field.value ?? ''}
                disabled={disabled}
                onValueChange={(value) => {
                  field.onChange(value)
                  onOrganizationChange()
                  form.trigger('selectedOrgSlug')
                }}
              >
                <SelectTrigger
                  size="small"
                  aria-label="Organization to grant API access to"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? 'organization-selection-error' : undefined}
                >
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((organization) => (
                    <SelectItem
                      key={organization.slug}
                      value={organization.slug}
                      className="text-xs"
                    >
                      {organization.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage id="organization-selection-error" className="text-xs" />
          </FormItem>
        )}
      />
    </Form>
  )
}

interface FormFooterProps {
  approvalState: ApprovalState
  approveDisabled?: boolean
  requester: ApiAuthorizationResponse
  redirectUrl?: string
  actionError?: string
  onDecline: () => void
  onApprove: () => void
}

function FormFooter({
  approvalState,
  approveDisabled = false,
  requester,
  redirectUrl,
  actionError,
  onDecline,
  onApprove,
}: FormFooterProps): ReactNode {
  const hasImpersonationWarning = Boolean(
    getOAuthImpersonationWarning({
      name: requester.name,
      redirectUri: requester.redirect_uri,
    })
  )

  return (
    <div className="flex flex-col gap-2">
      <ApprovalButton
        disabled={approveDisabled || approvalState !== 'indeterminate'}
        approvalState={approvalState}
        requester={requester}
        onApprove={onApprove}
      />
      <Button
        variant="text"
        block
        loading={approvalState === 'declining'}
        disabled={approvalState !== 'indeterminate'}
        onClick={onDecline}
      >
        Cancel
      </Button>
      <InterstitialActionError error={actionError} />
      {!actionError && redirectUrl && (
        <div className="mt-3 border-t border-muted pt-5">
          <p className="text-center text-xs text-foreground-lighter text-balance">
            Authorizing will redirect you to{' '}
            <span className={hasImpersonationWarning ? 'text-warning' : 'text-foreground'}>
              {redirectUrl}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

interface ApprovalButtonProps {
  disabled?: boolean
  approvalState: ApprovalState
  requester: ApiAuthorizationResponse
  onApprove: () => void
}

function ApprovalButton({
  disabled,
  approvalState,
  requester,
  onApprove,
}: ApprovalButtonProps): ReactNode {
  return (
    <Button
      variant="primary"
      block
      loading={approvalState === 'approving'}
      disabled={disabled}
      aria-label={`Authorize ${requester.name}`}
      onClick={onApprove}
    >
      Authorize {requester.name}
    </Button>
  )
}
