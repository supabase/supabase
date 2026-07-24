import { ArrowRightLeft, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, Button, Card, CardContent, CardHeader, cn } from 'ui'

export function LogoBox({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
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

export function LogoPair({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      {left}
      <ArrowRightLeft className="size-4 text-foreground-muted" />
      {right}
    </div>
  )
}

export function StripeLogo() {
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

export function SupabaseLogo({ forceLight = false }: { forceLight?: boolean } = {}) {
  return (
    <LogoBox className={forceLight ? 'border-black/10 bg-white' : 'bg-surface-75'}>
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

export function AccountRow({
  displayName,
  action,
}: {
  displayName: string
  action?: React.ReactNode
}) {
  return (
    <Card className={cn('shadow-none', !action && 'border-muted bg-surface-200/50')}>
      <CardContent
        className={cn('flex gap-3 border-none', action ? 'items-center px-4 py-3' : 'p-3')}
      >
        <Avatar className="size-8 border border-muted">
          <AvatarFallback className="text-xs">A</AvatarFallback>
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

export function InterstitialShell({
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

export function SignOutButton() {
  return <Button variant="default" icon={<LogOut />} className="px-2" aria-label="Sign out" />
}
