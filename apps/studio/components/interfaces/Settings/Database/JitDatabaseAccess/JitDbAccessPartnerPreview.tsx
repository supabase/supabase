import { Link } from '@tanstack/react-router'
import { ArrowUpRightIcon, EyeIcon, MoreVerticalIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  DialogSectionSeparator,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import {
  DialogDisclosure,
  DialogDisclosureContent,
  DialogDisclosureTrigger,
} from 'ui-patterns/DialogDisclosure'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import type { JitUserRule } from './JitDbAccess.types'
import { JitDbAccessRulesTable } from './JitDbAccessRulesTable'
import { OAuthAppAvatar } from '@/components/interfaces/Organization/OAuthApps/OAuthAppAvatar'
import { authorizedAppsPreview } from '@/components/interfaces/Organization/OAuthApps/OAuthAppsAuthorizedPreview'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const integrations = authorizedAppsPreview.flatMap(({ approval, databaseAccess }) =>
  databaseAccess ? [{ approval, accessLevel: databaseAccess.mode }] : []
)
const memberRule = {
  id: 'preview-rule',
  memberId: 'preview-member',
  name: 'Alex Morgan',
  email: 'alex@example.com',
  grants: [
    {
      roleId: 'supabase_read_only_user',
      enabled: true,
      branchesOnly: false,
      expiryMode: 'never',
      hasExpiry: false,
      expiry: '',
      ipRanges: [],
    },
  ],
  status: { active: 1, expired: 0, activeIp: 0, expiredIp: 0 },
} satisfies JitUserRule
const largeMemberList = [
  memberRule,
  ...Array.from({ length: 99 - integrations.length }, (_, index) => {
    const number = index + 2
    return {
      ...memberRule,
      id: `preview-rule-${number}`,
      memberId: `preview-member-${number}`,
      name: `Example Member ${number}`,
      email: `member-${number}@example.com`,
    }
  }),
]

export function JitDbAccessPartnerPreview({ showLargeList = false }: { showLargeList?: boolean }) {
  const memberRules = showLargeList ? largeMemberList : [memberRule]
  const activeMemberRules = memberRules.filter(({ status }) => status.active > 0)
  const memberCount = activeMemberRules.length
  const appCount = integrations.length
  const affectedAccess = new Intl.ListFormat('en').format([
    ...(memberCount > 0 ? [`${memberCount} ${memberCount === 1 ? 'member' : 'members'}`] : []),
    ...(appCount > 0 ? [`${appCount} ${appCount === 1 ? 'app' : 'apps'}`] : []),
  ])

  const { data: organization } = useSelectedOrganizationQuery()
  const switchRef = useRef<HTMLButtonElement>(null)
  const [isEnabled, setIsEnabled] = useState(!showLargeList)
  const [pendingEnabled, setPendingEnabled] = useState<boolean | null>(null)
  const isEnabling = pendingEnabled === true

  const integrationSection = isEnabled && integrations.length > 0 && (
    <Card>
      <CardContent className="flex items-center justify-between gap-2">
        <div className="space-y-1">
          <h3 className="settings-field-title">App access</h3>
          <p className="text-sm text-foreground-lighter">
            Apps that rely on temporary access to connect to this database.
          </p>
        </div>
        {organization && (
          <Button asChild iconRight={<ArrowUpRightIcon size={14} aria-hidden="true" />}>
            <Link
              to="/org/$slug/apps"
              params={{ slug: organization.slug }}
              search={{ mock_scenario: 'trusted_partner_authorized_apps' }}
            >
              OAuth Apps
            </Link>
          </Button>
        )}
      </CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>App</TableHead>
            <TableHead>Access level</TableHead>
            {organization && (
              <TableHead className="w-1">
                <span className="sr-only">Actions</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {integrations.map(({ approval, accessLevel }) => {
            const { app } = approval.attributes
            return (
              <TableRow key={approval.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <OAuthAppAvatar name={app.name} icon={app.icon} />
                    {app.name}
                  </div>
                </TableCell>
                <TableCell>{accessLevel}</TableCell>
                {organization && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          icon={<MoreVerticalIcon />}
                          className="px-1"
                          aria-label={`Manage ${app.name}`}
                        />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom" className="w-40">
                        <DropdownMenuItem asChild className="gap-x-2">
                          <Link
                            to="/org/$slug/apps"
                            params={{ slug: organization.slug }}
                            search={{
                              mock_scenario: 'trusted_partner_authorized_apps',
                              access_app: approval.id,
                            }}
                          >
                            <EyeIcon size={14} />
                            View access
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Temporary access</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent className="space-y-4">
        <Card>
          <CardContent>
            <FormLayout
              layout="flex-row-reverse"
              label="Allow temporary access"
              labelClassName="settings-field-title"
              description="Allow database sign-ins with a temporary grant."
            >
              <Switch
                ref={switchRef}
                aria-label="Allow temporary access"
                size="large"
                checked={isEnabled}
                onCheckedChange={setPendingEnabled}
              />
            </FormLayout>
          </CardContent>
        </Card>
        {isEnabled && (
          <JitDbAccessRulesTable
            users={memberRules}
            canUpdate={false}
            onAddRule={() => {}}
            onEditRule={() => {}}
            onDeleteRule={() => {}}
          />
        )}
        {integrationSection}
      </PageSectionContent>
      <AlertDialog
        open={pendingEnabled !== null}
        onOpenChange={(open) => {
          if (!open) setPendingEnabled(null)
        }}
      >
        <AlertDialogContent
          size="small"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            switchRef.current?.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEnabling ? 'Enable temporary access' : 'Disable temporary access'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEnabling
                ? `This lets ${affectedAccess} open new database connections using their existing grants.`
                : `This blocks new database connections through temporary access for ${affectedAccess}. Existing connections stay open.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isEnabling && (
            <>
              <DialogSectionSeparator />
              <DialogDisclosure>
                <DialogDisclosureTrigger className="px-5 py-4">
                  Who will regain access?
                </DialogDisclosureTrigger>
                <DialogDisclosureContent>
                  <div className="mb-2 max-h-64 overflow-y-auto px-5 pt-1">
                    <Table>
                      <TableHeader className="[&>tr]:bg-transparent">
                        <TableRow>
                          <TableHead className="pl-0">Member or app</TableHead>
                          <TableHead className="pr-0">Access</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="[:where(&)>tr]:hover:bg-transparent">
                        {activeMemberRules.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="pl-0 whitespace-normal break-all">
                              {member.name}
                              <p className="text-foreground-lighter">{member.email}</p>
                            </TableCell>
                            <TableCell className="pr-0">Member grant</TableCell>
                          </TableRow>
                        ))}
                        {integrations.map(({ approval, accessLevel }) => (
                          <TableRow key={approval.id}>
                            <TableCell className="pl-0 whitespace-normal">
                              {approval.attributes.app.name}
                            </TableCell>
                            <TableCell className="pr-0">{accessLevel}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogDisclosureContent>
              </DialogDisclosure>
            </>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={isEnabling ? 'primary' : 'danger'}
              onClick={() => setIsEnabled(isEnabling)}
            >
              {isEnabling ? 'Enable' : 'Disable'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageSection>
  )
}
