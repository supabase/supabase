import dayjs from 'dayjs'
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
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import type { ApprovalState, IApprovalFormSchema } from './ApiAuthorization.Schema'
import {
  AuthorizeRequesterDetails,
  RequesterLogo,
} from '@/components/interfaces/Organization/OAuthApps/AuthorizeRequesterDetails'
import { InterstitialLayout, LogoPair, SupabaseLogo } from '@/components/layouts/InterstitialLayout'
import type { ApiAuthorizationResponse } from '@/data/api-authorization/api-authorization-query'
import type { Organization, ResponseError } from '@/types'

type OrganizationsState_Loading = {
  _tag: 'loading'
}

type OrganizationsState_Error = {
  _tag: 'error'
  error: ResponseError | null
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

function isExternalRedirectUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1'
  } catch {
    return false
  }
}

export interface ApiAuthorizationMainViewProps {
  approvalState: ApprovalState
  form: UseFormReturn<IApprovalFormSchema>
  requester: ApiAuthorizationResponse
  organizations: OrganizationsState
  requestedOrganizationSlug: string | undefined
  onApprove: () => void
  onDecline: () => void
}

export function ApiAuthorizationMainView({
  approvalState,
  form,
  requester,
  organizations,
  requestedOrganizationSlug,
  onApprove,
  onDecline,
}: ApiAuthorizationMainViewProps): ReactNode {
  const isExpired = dayjs().isAfter(dayjs(requester.expires_at))
  const showReadyContent = !isExpired && organizations._tag === 'success'
  const redirectUrl = requester.redirect_uri ?? requester.website
  const externalRedirectUrl = isExternalRedirectUrl(redirectUrl) ? redirectUrl : undefined

  return (
    <InterstitialLayout
      logo={
        <LogoPair
          left={<RequesterLogo icon={requester.icon} name={requester.name} />}
          right={<SupabaseLogo />}
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
              {organizations._tag === 'loading' && <OrganizationsLoader />}
              {organizations._tag === 'error' && (
                <OrganizationsErrorNotice error={organizations.error} />
              )}
              {organizations._tag === 'empty' && <OrganizationsEmptyState />}
              {organizations._tag === 'not_member' && <NotMemberOfOrganizationNotice />}
              {organizations._tag === 'success' && (
                <OrganizationSelector
                  form={form}
                  disabled={!!requestedOrganizationSlug}
                  requester={requester}
                  organizations={organizations.organizations}
                  requestedOrganizationSlug={requestedOrganizationSlug}
                />
              )}
              {showReadyContent && (
                <>
                  <AuthorizeRequesterDetails
                    icon={requester.icon}
                    name={requester.name}
                    domain={requester.domain}
                    scopes={requester.scopes}
                  />
                  <FormFooter
                    approvalState={approvalState}
                    requester={requester}
                    redirectUrl={externalRedirectUrl}
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
  error: ResponseError | null
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

function OrganizationsEmptyState(): ReactNode {
  return (
    <Admonition
      type="warning"
      title="No organizations found"
      description="Create an organization before authorizing this request."
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
}

function OrganizationSelector({
  form,
  requester,
  requestedOrganizationSlug,
  organizations,
  disabled = false,
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
  requester: ApiAuthorizationResponse
  redirectUrl?: string
  onDecline: () => void
  onApprove: () => void
}

function FormFooter({
  approvalState,
  requester,
  redirectUrl,
  onDecline,
  onApprove,
}: FormFooterProps): ReactNode {
  return (
    <div className="flex flex-col gap-2">
      <ApprovalButton
        disabled={approvalState !== 'indeterminate'}
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
      {redirectUrl && (
        <div className="mt-3 border-t border-muted pt-5">
          <p className="text-center text-xs text-foreground-lighter text-balance">
            Authorizing will redirect you to <span className="text-foreground">{redirectUrl}</span>
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
