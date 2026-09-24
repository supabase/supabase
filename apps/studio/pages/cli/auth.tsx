// Demo route for the CLI device-auth interstitial. Everything is client-side: no API calls,
// no token creation. Context: https://supabase.slack.com/archives/C088MLLE0KU/p1789542796124239

import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { ArrowRightLeft, LogOut, Terminal } from 'lucide-react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { type ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import {
  Badge,
  Button,
  cn,
  Form,
  FormControl,
  FormField,
  FormInputGroupInput,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import z from 'zod'

import {
  InterstitialLayout,
  LogoBox,
  LogoPair,
  SupabaseLogo,
} from '@/components/layouts/InterstitialLayout'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { withAuth } from '@/hooks/misc/withAuth'
import { useSignOut } from '@/lib/auth'
import { buildStudioPageTitle } from '@/lib/page-title'
import { useProfile } from '@/lib/profile'
import type { NextPageWithLayout } from '@/types'

const PAGE_TITLE = buildStudioPageTitle({ section: 'Authorize CLI', brand: 'Supabase' })

const FALLBACK_EMAIL = 'you@example.com'
const FALLBACK_ORG_NAME = 'Acme Labs'
const FALLBACK_PROJECTS = [
  { ref: 'abcdefghijklmnop', name: 'acme-production' },
  { ref: 'qrstuvwxyzabcdef', name: 'acme-staging' },
  { ref: 'ghijklmnopqrstuv', name: 'acme-playground' },
]

const ALLOWED_REDIRECT_HOSTS = ['127.0.0.1', 'localhost']

const CliLogo = () => (
  <LogoBox className="bg-black">
    <Terminal className="size-6 text-white" strokeWidth={2} />
  </LogoBox>
)

const CliAuthInterstitial = ({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) => (
  <InterstitialLayout
    logo={<LogoPair left={<CliLogo />} right={<SupabaseLogo />} />}
    title={title}
    description={description}
  >
    <div className="flex flex-col gap-6 px-6 pb-6">{children}</div>
  </InterstitialLayout>
)

const DetailRowAction = ({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="text"
        size="tiny"
        icon={icon}
        className="shrink-0 size-6 px-0 text-foreground-light hover:text-foreground"
        aria-label={label}
        // Tooltip repeats the label; screen readers would read it twice
        aria-describedby={undefined}
        onClick={onClick}
      />
    </TooltipTrigger>
    <TooltipContent side="top">{label}</TooltipContent>
  </Tooltip>
)

const DetailRow = ({
  label,
  action,
  children,
}: {
  label: string
  action?: ReactNode
  children: ReactNode
}) => (
  <div
    className={cn('flex items-center justify-between gap-4 text-xs', action ? 'py-1.5' : 'py-2.5')}
  >
    <span className="shrink-0 text-foreground-light">{label}</span>
    <span className="flex min-w-0 items-center justify-end gap-2 text-right text-foreground">
      {children}
      {action}
    </span>
  </div>
)

type ScopeGroup = { name: string; level: 'read' | 'read_write' }

const ScopeGroupCard = ({
  appName,
  scopeGroups,
}: {
  appName: string
  scopeGroups: ScopeGroup[]
}) => (
  <section className="flex flex-col gap-3">
    <div className="flex flex-col gap-1">
      <p className="text-xs text-foreground">Permissions requested</p>
      <p className="text-xs text-foreground-lighter">
        Authorizing {appName} grants it the following access permissions to the selected projects.
      </p>
    </div>

    <div className="divide-y rounded-md border bg-surface-75 px-4">
      {scopeGroups.map((scopeGroup) => (
        <div key={scopeGroup.name} className="flex flex-col gap-2 py-3">
          <p className="font-mono text-[11px] uppercase tracking-wider text-foreground-light">
            {scopeGroup.level === 'read' ? 'READ' : 'READ-WRITE'}
          </p>
          <p className="text-xs font-medium text-foreground">{scopeGroup.name}</p>
        </div>
      ))}
    </div>
  </section>
)

function toResourceName(scope: string) {
  const name = scope.split(':').slice(1).join(':') || scope
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function toScopeGroups(scopes: string[]): ScopeGroup[] {
  const readOnly = scopes.filter((scope) => scope.startsWith('read:')).map(toResourceName)
  const readWrite = scopes.filter((scope) => !scope.startsWith('read:')).map(toResourceName)
  const readOnlyExclusive = readOnly.filter((name) => !readWrite.includes(name))

  const groups: ScopeGroup[] = []
  if (readOnlyExclusive.length > 0) {
    groups.push({ name: readOnlyExclusive.join(', '), level: 'read' })
  }
  if (readWrite.length > 0) {
    groups.push({ name: readWrite.join(', '), level: 'read_write' })
  }
  return groups
}

function isAllowedRedirectUri(redirectUri: string) {
  try {
    const url = new URL(redirectUri)
    return url.protocol === 'http:' && ALLOWED_REDIRECT_HOSTS.includes(url.hostname)
  } catch {
    return false
  }
}

function generateDemoToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `sbp_${hex}`
}

const CliAuthPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { code, redirect_uri, scopes, project_ref } = useParams()

  if (!router.isReady) return null

  return (
    <>
      <Head>
        <title>{PAGE_TITLE}</title>
      </Head>
      <CliAuthScreen
        code={code}
        redirectUri={redirect_uri}
        scopesParam={scopes}
        projectRef={project_ref}
      />
    </>
  )
}

const formSchema = z.object({
  projectRef: z.string({ message: 'Please select a project' }),
  accessMode: z.enum(['full', 'readonly']),
})

type FormValues = z.infer<typeof formSchema>

const CliAuthScreen = ({
  code,
  redirectUri,
  scopesParam,
  projectRef,
}: {
  code?: string
  redirectUri?: string
  scopesParam?: string
  projectRef?: string
}) => {
  const router = useRouter()
  const signOut = useSignOut()
  const { profile } = useProfile()
  const { data: organizations } = useOrganizationsQuery()
  const organizationName = organizations?.[0]?.name ?? FALLBACK_ORG_NAME
  const { data: orgProjectsData } = useOrgProjectsInfiniteQuery({ slug: organizations?.[0]?.slug })

  const liveProjects = (orgProjectsData?.pages ?? []).flatMap((page) => page.projects)
  const projects = liveProjects.length > 0 ? liveProjects : FALLBACK_PROJECTS

  const requestedScopes = (scopesParam ?? '').split(',').filter(Boolean)
  const readScopes = requestedScopes.filter((scope) => scope.startsWith('read:'))

  const email = profile?.primary_email ?? FALLBACK_EMAIL
  const hasValidRedirect = redirectUri !== undefined && isAllowedRedirectUri(redirectUri)

  const form = useForm<FormValues>({
    defaultValues: {
      projectRef,
      accessMode: 'full',
    },
    resolver: zodResolver(formSchema),
  })

  const grantedScopes = useWatch({
    name: 'accessMode',
    control: form.control,
    compute: (accessMode) => (accessMode === 'full' ? requestedScopes : readScopes),
  })
  const scopeGroups = toScopeGroups(grantedScopes)

  if (!code || !redirectUri) {
    return (
      <CliAuthInterstitial
        title="Invalid request from CLI"
        description="This Supabase CLI request cannot be authorized"
      >
        <Admonition
          type="warning"
          description="The URL is missing the device code or redirect address. Run the login command from Supabase CLI again."
        />
      </CliAuthInterstitial>
    )
  }

  const handleAuthorize = (_values: FormValues) => {
    window.location.assign(
      `${redirectUri}?token=${generateDemoToken()}&scopes=${grantedScopes.join(',')}`
    )
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.reload()
  }

  const handleSwitchOrg = () => router.push('/organizations')

  const handleCancel = () => {
    window.location.assign(`${redirectUri}?error=access_denied`)
  }

  return (
    <CliAuthInterstitial
      title="Authorize Supabase CLI"
      description="Your terminal is requesting a scoped access token"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAuthorize)} className="flex flex-col gap-6 px-0">
          {!hasValidRedirect && (
            <Admonition
              type="destructive"
              title="Unrecognized redirect address"
              description={`Supabase CLI can only receive tokens at http://127.0.0.1 or http://localhost. The request asked for ${redirectUri}.`}
            />
          )}

          <section className="flex flex-col gap-2">
            <div className="divide-y rounded-md border bg-surface-75 px-4">
              <DetailRow
                label="Authorizing as"
                action={
                  <DetailRowAction
                    label="Sign out"
                    icon={<LogOut size={14} />}
                    onClick={handleSignOut}
                  />
                }
              >
                <span className="min-w-0 truncate">{email}</span>
              </DetailRow>
              <DetailRow
                label="Organization"
                action={
                  <DetailRowAction
                    label="Switch organization"
                    icon={<ArrowRightLeft size={14} />}
                    onClick={handleSwitchOrg}
                  />
                }
              >
                <span className="min-w-0 truncate">{organizationName}</span>
              </DetailRow>
              <DetailRow label="Expires">
                <span>Never</span>
              </DetailRow>
              <DetailRow label="Device">
                <span className="font-mono">{code}</span>
              </DetailRow>
            </div>
            <p className="text-xs text-foreground-lighter">
              Check that this code matches the one shown in your terminal. This token can never do
              more than your role in this organization allows.
            </p>
          </section>

          <FormField
            control={form.control}
            name="projectRef"
            render={({ field }) => (
              <FormItemLayout
                layout="vertical"
                label="Project"
                description="Access covers this project and all of its preview branches."
              >
                {projectRef ? (
                  <FormControl>
                    <InputGroup>
                      <FormInputGroupInput {...field} readOnly />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>
                          <Badge variant="default" className="shrink-0">
                            from config.toml
                          </Badge>
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                  </FormControl>
                ) : (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger size="small">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.ref} value={project.ref}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormItemLayout>
            )}
          />

          <FormField
            control={form.control}
            name="accessMode"
            render={({ field }) => (
              <FormItemLayout layout="vertical" label="Access">
                <RadioGroupStacked value={field.value} onValueChange={field.onChange}>
                  <RadioGroupStackedItem
                    value="full"
                    label="Full CLI access"
                    description="Every scope the CLI requested, including writes"
                  />
                  <RadioGroupStackedItem
                    value="readonly"
                    label="Read-only"
                    description="Only the read scopes. Deploys and migrations will fail"
                  />
                </RadioGroupStacked>
              </FormItemLayout>
            )}
          />

          {scopeGroups.length > 0 && (
            <ScopeGroupCard appName="Supabase CLI" scopeGroups={scopeGroups} />
          )}
          {scopeGroups.length === 0 && (
            <p className="text-xs text-foreground-lighter">No permissions requested.</p>
          )}

          <div className="flex flex-col gap-2">
            <Button block variant="primary" type="submit">
              Authorize CLI
            </Button>
            <Button block variant="text" onClick={handleCancel}>
              Cancel
            </Button>
          </div>

          <div className="border-t pt-6 text-xs text-foreground-lighter">
            <p>
              Authorizing returns you to your terminal. The token will appear under Access tokens.
            </p>
          </div>
        </form>
      </Form>
    </CliAuthInterstitial>
  )
}

export default withAuth(CliAuthPage)
