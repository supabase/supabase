import {
  Bot,
  Check,
  File,
  Github,
  LockKeyhole,
  MoreHorizontal,
  MousePointer2,
  Search,
  Send,
  Upload,
  UserRound,
  Workflow,
} from 'lucide-react'
import type { ReactNode } from 'react'

import type { CatalogPreviewKind } from '@/config/library'

const previewTitles: Partial<Record<CatalogPreviewKind, string>> = {
  table: 'customers',
  storage: 'product-assets',
  chat: 'team chat',
  editor: 'index.ts',
  mcp: 'mcp-server',
  dashboard: 'acme workspace',
  client: 'supabase.ts',
  flow: 'shared canvas',
}

function PreviewWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="w-full max-w-xs overflow-hidden rounded-lg border bg-background shadow-lg">
      <div className="flex h-8 items-center justify-between border-b px-3 text-foreground-light">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-brand" />
          <span className="text-[10px]">{title}</span>
        </div>
        <MoreHorizontal className="size-3.5" />
      </div>
      <div className="flex min-h-28 flex-col justify-center gap-2.5 p-3">{children}</div>
    </div>
  )
}

export function CatalogPreview({ kind }: { kind: CatalogPreviewKind }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full select-none flex-col p-5 text-[10px] text-foreground [mask-image:linear-gradient(to_bottom,black_calc(100%-20px),transparent)] md:p-6 md:[mask-image:linear-gradient(to_bottom,black_calc(100%-24px),transparent)]"
    >
      <div className="my-auto flex w-full shrink-0 items-center justify-center">
        {kind === 'auth' || kind === 'social' || kind === 'consent' ? (
          <div className="w-full max-w-[200px] rounded-lg border bg-background p-4 shadow-lg">
            <div className="mb-2 flex size-6 items-center justify-center rounded-md border bg-surface-100">
              <LockKeyhole className="size-3 text-brand" />
            </div>
            <p className="text-xs font-medium">
              {kind === 'consent' ? 'Connect to Acme' : 'Welcome back'}
            </p>
            <p className="mt-1 text-[9px] text-foreground-light">
              {kind === 'consent'
                ? 'Review the access requested below.'
                : 'Sign in to continue to your account.'}
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {kind === 'social' ? (
                <>
                  <div className="flex items-center justify-center gap-2 rounded border px-2 py-1.5">
                    <Github className="size-3" />
                    Continue with GitHub
                  </div>
                  <div className="rounded border px-2 py-1.5 text-center">Continue with Google</div>
                </>
              ) : kind === 'consent' ? (
                <>
                  <div className="flex items-center gap-2 py-1">
                    <Check className="size-3 text-brand" />
                    Read your profile
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <Check className="size-3 text-brand" />
                    Access your projects
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded border px-2 py-1.5 text-foreground-lighter">
                    you@example.com
                  </div>
                  <div className="rounded border px-2 py-1.5 text-foreground-lighter">••••••••</div>
                </>
              )}
              {kind !== 'social' && (
                <div className="rounded border border-brand/30 bg-brand/20 py-1.5 text-center text-foreground">
                  {kind === 'consent' ? 'Allow access' : 'Sign in'}
                </div>
              )}
            </div>
          </div>
        ) : kind === 'avatar' || kind === 'avatars' ? (
          <div className="flex w-full max-w-[210px] flex-col items-center rounded-lg border bg-background px-4 py-5 shadow-lg">
            <div className="flex -space-x-2">
              {(kind === 'avatar' ? ['JD'] : ['JD', 'AS', 'MK', '+2']).map((initials, index) => (
                <div
                  key={initials}
                  className={`relative flex size-10 items-center justify-center rounded-full border-2 border-background text-xs ${index % 2 === 0 ? 'bg-brand/20 text-brand' : 'bg-surface-300 text-foreground-light'}`}
                >
                  {initials}
                  {index === 0 && (
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-brand" />
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs font-medium">
              {kind === 'avatar' ? 'Jamie Davis' : 'Better together'}
            </p>
            <p className="mt-1 text-foreground-light">
              {kind === 'avatar' ? 'jamie@example.com' : '5 people in this workspace'}
            </p>
            <div className="mt-4 w-full rounded border px-3 py-1.5 text-center text-foreground-light">
              {kind === 'avatar' ? 'Account settings' : 'Everyone is up to date'}
            </div>
          </div>
        ) : kind === 'cursors' ? (
          <div className="relative h-36 w-full max-w-xs rounded-lg border bg-background shadow-lg">
            <div className="absolute inset-x-5 top-5 h-2 w-2/5 rounded bg-surface-200" />
            <div className="absolute inset-x-5 top-10 h-2 rounded bg-surface-200" />
            <div className="absolute inset-x-5 top-14 h-2 w-3/5 rounded bg-surface-200" />
            <div className="absolute left-10 top-16 text-brand">
              <MousePointer2 className="size-5 fill-current" />
              <span className="ml-4 rounded bg-brand/20 px-2 py-1">Jamie</span>
            </div>
            <div className="absolute bottom-7 right-6 text-foreground-light">
              <MousePointer2 className="size-5 fill-current" />
              <span className="ml-4 rounded bg-surface-300 px-2 py-1">Alex</span>
            </div>
          </div>
        ) : (
          <PreviewWindow title={previewTitles[kind] ?? 'workspace'}>
            {kind === 'table' && (
              <>
                <div className="flex items-center gap-2 rounded border bg-surface-100 px-2 py-1 text-foreground-light">
                  <Search className="size-3" />
                  Filter rows
                </div>
                {['jamie', 'alex', 'morgan'].map((name, index) => (
                  <div key={name} className="flex items-center gap-3 border-b pb-1.5">
                    <span className="text-foreground-lighter">0{index + 1}</span>
                    <span className="truncate">{name}@example.com</span>
                    <span className="ml-auto size-1.5 shrink-0 rounded-full bg-brand" />
                  </div>
                ))}
              </>
            )}
            {kind === 'storage' && (
              <>
                <div className="flex items-center justify-center gap-2 rounded-md border border-dashed py-3 text-foreground-light">
                  <Upload className="size-3.5" />
                  Drop files to upload
                </div>
                {['cover.png', 'design.fig'].map((name) => (
                  <div key={name} className="flex items-center gap-2 rounded border px-2 py-1.5">
                    <File className="size-3 text-foreground-light" />
                    <span>{name}</span>
                    <Check className="ml-auto size-3 text-brand" />
                  </div>
                ))}
              </>
            )}
            {kind === 'chat' && (
              <>
                <div className="flex items-start gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-200">
                    JD
                  </span>
                  <div className="rounded-md border bg-surface-100 px-2 py-1.5">
                    How is the new project going?
                  </div>
                </div>
                <div className="ml-8 rounded-md border border-brand/20 bg-brand/10 px-2 py-1.5">
                  Ready to share a first look.
                </div>
                <div className="mt-1 flex items-center justify-between rounded border px-2 py-1.5 text-foreground-lighter">
                  <span>Write a message...</span>
                  <Send className="size-3" />
                </div>
              </>
            )}
            {(kind === 'editor' || kind === 'client') && (
              <div className="overflow-hidden whitespace-nowrap font-mono text-[9px] leading-5 text-foreground-light">
                <p>
                  <span className="text-brand">import</span> {'{ createClient }'}
                </p>
                <p className="pl-3">from &apos;@supabase/supabase-js&apos;</p>
                <p className="mt-2">
                  <span className="text-brand">const</span> supabase = createClient(
                </p>
                <p className="pl-3">SUPABASE_URL,</p>
                <p className="pl-3">SUPABASE_PUBLISHABLE_KEY</p>
                <p>)</p>
              </div>
            )}
            {kind === 'dashboard' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {['Users', 'Queries', 'Files'].map((label, index) => (
                    <div className="rounded border p-2" key={label}>
                      <p className="text-[9px] text-foreground-light">{label}</p>
                      <p className="mt-1 text-xs">{['824', '128', '42'][index]}</p>
                    </div>
                  ))}
                </div>
                <div className="flex h-12 items-end gap-1.5 pt-2">
                  {['h-2/5', 'h-3/5', 'h-1/2', 'h-4/5', 'h-3/5', 'h-full', 'h-4/5', 'h-full'].map(
                    (height, index) => (
                      <div key={index} className={`flex-1 rounded-t bg-brand/30 ${height}`} />
                    )
                  )}
                </div>
              </>
            )}
            {kind === 'mcp' &&
              ['get_user', 'list_projects', 'search_documents'].map((tool, index) => (
                <div key={tool} className="flex items-center gap-2 rounded border p-2">
                  <Bot
                    className={`size-3.5 ${index === 0 ? 'text-brand' : 'text-foreground-light'}`}
                  />
                  <span>{tool}</span>
                  <span className="ml-auto text-foreground-lighter">tool</span>
                </div>
              ))}
            {kind === 'flow' && (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 rounded border px-3 py-2">
                  <Workflow className="size-3 text-brand" />
                  New event
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="h-px w-2/3 bg-border" />
                <div className="flex w-full justify-around">
                  <div className="h-3 w-px bg-border" />
                  <div className="h-3 w-px bg-border" />
                </div>
                <div className="flex w-full justify-around gap-2">
                  <div className="rounded border px-2 py-2">Update record</div>
                  <div className="flex items-center gap-1 rounded border px-2 py-2">
                    <UserRound className="size-3" />
                    Notify team
                  </div>
                </div>
              </div>
            )}
          </PreviewWindow>
        )}
      </div>
    </div>
  )
}
