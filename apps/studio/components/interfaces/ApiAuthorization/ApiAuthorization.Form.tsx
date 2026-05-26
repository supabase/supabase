import dayjs from 'dayjs'
import { Info } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
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
      subtitle={
        <PublisherInfoDialog
          domain={requester.domain}
          name={requester.name}
          redirectUrl={externalRedirectUrl}
        />
      }
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

function PublisherInfoDialog({
  domain,
  name,
  redirectUrl,
}: {
  domain: string
  name: string
  redirectUrl?: string
}): ReactNode {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="About this publisher"
            className="mx-auto mt-1.5 flex w-fit cursor-pointer items-center gap-1.5 rounded-full border border-muted py-1 pl-2 pr-1.5 font-mono text-[11px] tracking-tight text-foreground-lighter transition-colors hover:border-foreground-muted hover:bg-surface-200 hover:text-foreground-light"
            onClick={() => setOpen(true)}
          >
            <span>{domain}</span>
            <Info className="size-3.5 text-foreground-muted transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-56 text-xs">
          About this publisher
        </TooltipContent>
      </Tooltip>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>About this publisher</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3">
              <p>
                Make sure you trust the source of <strong>{name}</strong>. After authorizing, it
                will be able to access your organization&apos;s projects based on the selected
                permissions.
              </p>
              {redirectUrl && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground-light">Redirects to</p>
                  <p className="break-all font-mono text-[11px] text-foreground">{redirectUrl}</p>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
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
