import { ArrowRightLeft, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, Button, Card, CardContent, CardHeader, cn } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

function LogoBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex size-12 items-center justify-center overflow-hidden rounded-xl border bg-muted',
        className
      )}
    >
      {children}
    </div>
  )
}

function LogoPair({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      {left}
      <ArrowRightLeft className="size-4 text-foreground-muted" />
      {right}
    </div>
  )
}

function StripeLogo() {
  return (
    <LogoBox className="border-[#533afd] bg-[#533afd]">
      <svg viewBox="0 0 512 512" className="size-full" aria-hidden>
        <path
          fill="#fff"
          fillRule="evenodd"
          d="m132 380 248-52.593V132l-248 53.208z"
          clipRule="evenodd"
        />
      </svg>
    </LogoBox>
  )
}

function SupabaseLogo() {
  return (
    <LogoBox className="bg-surface-75">
      <svg viewBox="0 0 109 113" className="size-7" aria-hidden>
        <path
          d="M63.708 110.284c-2.86 3.601-8.658 1.628-8.727-2.97L53.974 40.063h45.22c8.19 0 12.758 9.46 7.665 15.874L63.708 110.284Z"
          fill="#3ECF8E"
        />
        <path
          d="M45.317 2.071c2.86-3.601 8.658-1.628 8.726 2.97l.442 67.251H9.831C1.64 72.292-2.928 62.832 2.166 56.418L45.317 2.071Z"
          fill="#3ECF8E"
        />
      </svg>
    </LogoBox>
  )
}

function AccountRow({ displayName, action }: { displayName: string; action?: React.ReactNode }) {
  return (
    <Card className={cn('shadow-none', !action && 'border-muted bg-surface-200/50')}>
      <CardContent
        className={cn('flex gap-3 border-none', action ? 'items-center px-4 py-3' : 'p-3')}
      >
        <Avatar className="size-8 border border-muted">
          <AvatarFallback className="text-xs">DW</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-foreground-light">Signed in as</p>
          <p className="truncate text-sm text-foreground">{displayName}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  )
}

function InterstitialShell({
  logo,
  title,
  description,
  children,
}: {
  logo: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[520px] w-full items-center justify-center bg-studio px-2 py-6">
      <Card className="w-full max-w-[400px] overflow-hidden">
        <CardHeader className="items-center gap-0 space-y-0 border-0 px-6 py-6 text-center">
          <div className="mb-4 flex justify-center">{logo}</div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-balance text-lg font-medium tracking-tight text-foreground">
              {title}
            </h1>
            {description ? (
              <p className="m-0 px-3 text-balance text-sm leading-tight text-foreground-lighter">
                {description}
              </p>
            ) : null}
          </div>
        </CardHeader>
        <div className="px-6 pb-6">{children}</div>
      </Card>
    </div>
  )
}

export default function ConnectInterstitialDemo() {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-2">
      <InterstitialShell
        logo={<LogoPair left={<StripeLogo />} right={<SupabaseLogo />} />}
        title="Authorize Stripe Projects"
        description="This will create an organization on your behalf in Supabase"
      >
        <div className="flex flex-col gap-4">
          <AccountRow
            displayName="danny@supabase.io"
            action={
              <Button type="default" icon={<LogOut />} className="px-2" aria-label="Sign out" />
            }
          />
          <Button type="primary" block>
            Authorize Stripe Projects
          </Button>
          <Button type="text" block>
            Cancel
          </Button>
        </div>
      </InterstitialShell>

      <InterstitialShell
        logo={<SupabaseLogo />}
        title="Join organization"
        description="You have been invited to Acme Labs"
      >
        <div className="flex flex-col gap-4">
          <Admonition
            type="warning"
            title="Wrong account"
            description="Sign in with the Supabase account that received this invite, then open the link again."
          />
          <AccountRow displayName="other@example.com" />
          <Button type="primary" block>
            Sign out and continue
          </Button>
        </div>
      </InterstitialShell>
    </div>
  )
}
