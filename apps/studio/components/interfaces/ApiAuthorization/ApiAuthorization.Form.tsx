import dayjs from 'dayjs'
import { Building2, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Button,
  Card,
  CardContent,
  cn,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from 'ui'
import { Admonition, ShimmeringLoader } from 'ui-patterns'

import type { ApprovalState, IApprovalFormSchema } from './ApiAuthorization.Schema'
import {
  AuthorizeRequesterDetails,
  RequesterLogo,
} from '@/components/interfaces/Organization/OAuthApps/AuthorizeRequesterDetails'
import {
  InterstitialExpandableContent,
  InterstitialLayout,
  InterstitialMetadataPill,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
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
  const isMcpClient = requester.registration_type === 'dynamic'
  const isExpired = dayjs().isAfter(dayjs(requester.expires_at))
  const showReadyContent = !isExpired && organizations._tag === 'success'

  return (
    <InterstitialLayout
      logo={
        <LogoPair
          left={<RequesterLogo icon={requester.icon} name={requester.name} />}
          right={<SupabaseLogo />}
        />
      }
      title={requester.name}
      description="wants to access your Supabase account"
      subtitle={<InterstitialMetadataPill>{requester.domain}</InterstitialMetadataPill>}
      subtitleClassName="leading-none"
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
                    isMcpClient={isMcpClient}
                  />
                  <FormFooter
                    approvalState={approvalState}
                    requester={requester}
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
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="shadow-none">
            <CardContent className="flex items-center gap-3 border-none px-4 py-3">
              <ShimmeringLoader className="size-9 flex-shrink-0 rounded-lg py-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <ShimmeringLoader className="h-4 w-28 py-0" />
                <ShimmeringLoader className="h-3 w-20 py-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
  const [showAll, setShowAll] = useState(false)
  const visibleOrganizations = organizations.slice(0, 3)
  const additionalOrganizations = organizations.slice(3)
  const hiddenCount = additionalOrganizations.length

  const renderOrganization = (organization: Organization, selectedOrgSlug: string | undefined) => {
    const isSelected = selectedOrgSlug === organization.slug

    return (
      <button
        key={organization.slug}
        type="button"
        role="radio"
        aria-checked={isSelected}
        disabled={disabled}
        onClick={() => {
          form.setValue('selectedOrgSlug', organization.slug, { shouldValidate: true })
          form.trigger('selectedOrgSlug')
        }}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-70',
          isSelected
            ? 'border-brand bg-brand-200 text-foreground'
            : 'border-muted bg-surface-100 hover:border-strong'
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Building2 className="size-5 text-foreground-lighter" strokeWidth={1.5} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {organization.name}
          </span>
          <span className="block truncate text-sm text-foreground-lighter">
            {organization.plan?.name ?? 'Supabase organization'}
          </span>
        </span>
        {isSelected && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-background">
            <Check className="size-4" strokeWidth={2} />
          </span>
        )}
      </button>
    )
  }

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="selectedOrgSlug"
        render={({ field, fieldState }) => (
          <FormItem className="space-y-2">
            <FormControl>
              <section className="space-y-2" aria-label="Organization">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-foreground-light">
                    Organization
                  </p>
                  {requestedOrganizationSlug && (
                    <p className="text-xs text-foreground-lighter">
                      Pre-selected by {requester.name}
                    </p>
                  )}
                </div>
                <div
                  role="radiogroup"
                  aria-label="Organization to grant API access to"
                  aria-invalid={fieldState.invalid}
                  aria-describedby={fieldState.error ? 'organization-selection-error' : undefined}
                  className="space-y-2"
                >
                  {visibleOrganizations.map((organization) =>
                    renderOrganization(organization, field.value)
                  )}
                  {hiddenCount > 0 && (
                    <Button
                      type="text"
                      size="tiny"
                      block
                      iconRight={showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      onClick={() => setShowAll((value) => !value)}
                    >
                      {showAll ? 'Show fewer' : `Show ${hiddenCount} more`}
                    </Button>
                  )}
                  <InterstitialExpandableContent show={showAll}>
                    <div className="space-y-2">
                      {additionalOrganizations.map((organization) =>
                        renderOrganization(organization, field.value)
                      )}
                    </div>
                  </InterstitialExpandableContent>
                </div>
              </section>
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
  onDecline: () => void
  onApprove: () => void
}

function FormFooter({
  approvalState,
  requester,
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
        type="text"
        block
        loading={approvalState === 'declining'}
        disabled={approvalState !== 'indeterminate'}
        onClick={onDecline}
      >
        Cancel
      </Button>
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
      type="primary"
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
