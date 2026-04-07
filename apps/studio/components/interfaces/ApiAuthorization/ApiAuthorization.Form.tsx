import dayjs from 'dayjs'
import Link from 'next/link'
import { useMemo, type ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  FormMessage_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  WarningIcon,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

import type { ApprovalState, IApprovalFormSchema } from './ApiAuthorization.Schema'
import { AuthorizeRequesterDetails } from '@/components/interfaces/Organization/OAuthApps/AuthorizeRequesterDetails'
import type { ApiAuthorizationResponse } from '@/data/api-authorization/api-authorization-query'
import { BASE_PATH } from '@/lib/constants'
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

type OrganizationsState =
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

  return (
    <FormShell title={`Authorize API access for ${requester.name}`}>
      {isMcpClient && <McpNotice />}
      <AuthorizeRequesterDetails
        icon={requester.icon}
        name={requester.name}
        domain={requester.domain}
        scopes={requester.scopes}
      />
      {isExpired && <ExpiredNotice />}
      {organizations._tag === 'loading' && <OrganizationsLoader />}
      {organizations._tag === 'error' && <OrganizationsErrorNotice error={organizations.error} />}
      {organizations._tag === 'empty' && <OrganizationsEmptyState />}
      {organizations._tag === 'not_member' && <NotMemberOfOrganizationNotice />}
      {organizations._tag === 'success' && (
        <OrganizationSelector
          form={form}
          disabled={isExpired || !!requestedOrganizationSlug}
          requester={requester}
          organizations={organizations.organizations}
          requestedOrganizationSlug={requestedOrganizationSlug}
        />
      )}
      <FormFooter
        disabled={isExpired || organizations._tag !== 'success'}
        approvalState={approvalState}
        requester={requester}
        organizations={organizations}
        onApprove={onApprove}
        onDecline={onDecline}
      />
    </FormShell>
  )
}

interface FormShellProps {
  title: string
  children: ReactNode
}

function FormShell({ title, children }: FormShellProps): ReactNode {
  return (
    <Card>
      <CardHeader>{title}</CardHeader>
      <CardContent className="space-y-8">{children}</CardContent>
    </Card>
  )
}

function McpNotice(): ReactNode {
  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>MCP Client Connection</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        This is an MCP (Model Context Protocol) client designed to connect with AI applications.
        Please ensure you trust this application before granting access to your organization's data.
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

function ExpiredNotice(): ReactNode {
  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>This authorization request is expired</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        Please retry your authorization request from the requesting app
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

function OrganizationsLoader(): ReactNode {
  return (
    <div className="py-4 space-y-2">
      <ShimmeringLoader />
      <ShimmeringLoader className="w-3/4" />
    </div>
  )
}

interface OrganizationsErrorNoticeProps {
  error: ResponseError | null
}

function OrganizationsErrorNotice({ error }: OrganizationsErrorNoticeProps): ReactNode {
  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>There was an error loading your organizations</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        Please try again. If the problem persists, contact support.
        {error && <p className="mt-2">Error: {error.message}</p>}
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

function OrganizationsEmptyState(): ReactNode {
  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>Organization is needed for installing an integration</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        Your account isn't associated with any organizations. To use this integration, it must be
        installed within an organization. You'll be redirected to create an organization first.
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

function NotMemberOfOrganizationNotice(): ReactNode {
  return (
    <Alert_Shadcn_ variant="warning">
      <WarningIcon />
      <AlertTitle_Shadcn_>Organization is needed for installing an integration</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        Your account is not a member of the pre-selected organization. To use this integration, it
        must be installed within an organization your account is associated with.
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
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
    <Form_Shadcn_ {...form}>
      <FormField_Shadcn_
        control={form.control}
        name="selectedOrgSlug"
        render={({ field }) => (
          <FormItem_Shadcn_>
            <FormLayout
              label="Organization to grant API access to"
              description={
                requestedOrganizationSlug
                  ? `This organization has been pre-selected by ${requester.name}.`
                  : undefined
              }
              isReactForm
            >
              <FormControl_Shadcn_>
                <Select_Shadcn_
                  value={field.value || undefined}
                  disabled={disabled}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger_Shadcn_ size="small">
                    <SelectValue_Shadcn_ placeholder="Select an organization" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {organizations.map((organization) => (
                      <SelectItem_Shadcn_
                        key={organization.slug}
                        value={organization.slug}
                        className="text-xs"
                      >
                        {organization.name}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </FormControl_Shadcn_>
            </FormLayout>
          </FormItem_Shadcn_>
        )}
      />
    </Form_Shadcn_>
  )
}

interface FormFooterProps {
  disabled?: boolean
  approvalState: ApprovalState
  requester: ApiAuthorizationResponse
  organizations: OrganizationsState
  onDecline: () => void
  onApprove: () => void
}

function FormFooter({
  disabled = false,
  approvalState,
  requester,
  organizations,
  onDecline,
  onApprove,
}: FormFooterProps): ReactNode {
  const showApprovalButton = organizations._tag === 'success' || organizations._tag === 'not_member'

  return (
    <CardFooter className="justify-end space-x-2">
      <Button
        type="default"
        loading={approvalState === 'declining'}
        disabled={disabled || approvalState !== 'indeterminate'}
        onClick={onDecline}
      >
        Decline
      </Button>
      {organizations._tag === 'loading' && (
        <LoadingApprovalButton>Authorize {requester.name}</LoadingApprovalButton>
      )}
      {organizations._tag === 'empty' && <CreateOrganizationLink />}
      {showApprovalButton && (
        <ApprovalButton
          disabled={disabled || approvalState !== 'indeterminate'}
          approvalState={approvalState}
          requester={requester}
          onApprove={onApprove}
        />
      )}
    </CardFooter>
  )
}

interface LoadingApprovalButtonProps {
  children: ReactNode
}

function LoadingApprovalButton({ children }: LoadingApprovalButtonProps): ReactNode {
  return <Button loading={true}>{children}</Button>
}

function createReturnToSearchParam(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  const basePath = BASE_PATH

  let pathname = basePath ? location.pathname.replace(basePath, '') : location.pathname
  if (location.search) {
    pathname += location.search
  }

  return pathname
}

function CreateOrganizationLink(): ReactNode {
  const searchParamString = useMemo(function createSearchParams() {
    const searchParams = new URLSearchParams()
    const returnTo = createReturnToSearchParam()
    if (returnTo) {
      searchParams.set('returnTo', returnTo)
    }
    return searchParams.toString()
  }, [])

  return (
    <Button asChild>
      <Link href={`/new?${searchParamString}`}>Create an organization</Link>
    </Button>
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
    <Button loading={approvalState === 'approving'} disabled={disabled} onClick={onApprove}>
      Authorize {requester.name}
    </Button>
  )
}
