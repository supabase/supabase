import { PermissionAction } from '@supabase/shared-types/out/constants'
import { BookOpen, Check, Edit, MoreVertical, Trash, Webhook } from 'lucide-react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { Hook } from './hooks.constants'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { DOCS_URL } from '@/lib/constants'

interface HookCardProps {
  hook: Hook
  onSelectEdit: () => void
  onSelectDelete: () => void
}

export const HookCard = ({ hook, onSelectEdit, onSelectDelete }: HookCardProps) => {
  const { can: canUpdateAuthHook } = useAsyncCheckPermissions(PermissionAction.AUTH_EXECUTE, '*')

  return (
    <div className="bg-surface-100 border-default overflow-hidden border shadow-sm px-5 py-4 flex flex-row first:rounded-t-md last:rounded-b-md space-x-4">
      <div>
        <Webhook size={21} strokeWidth="1" />
      </div>
      <div className="flex flex-col grow overflow-y-auto w-full">
        <span className="text-sm text-foreground">{hook.title}</span>
        <span className="text-sm text-foreground-lighter">{hook.subtitle}</span>
        <div className="text-sm flex flex-row space-x-5 py-4">
          {hook.method.type === 'postgres' ? (
            <div className="flex flex-col w-full space-y-2 max-w-xl">
              <div className="flex flex-row items-center">
                <span className="text-foreground-light w-20">Type</span>
                <span className="text-foreground">Postgres function</span>
              </div>
              <div className="flex flex-row items-center">
                <label htmlFor="schema" className="text-foreground-light w-20">
                  Schema
                </label>
                <Input
                  id="schema"
                  title={hook.method.schema}
                  copy
                  readOnly
                  disabled
                  containerClassName="flex-1"
                  className="font-mono text-xs md:text-xs disabled:text-foreground-light opacity-100"
                  value={hook.method.schema}
                />
              </div>
              <div className="flex flex-row items-center">
                <label htmlFor="functionName" className="text-foreground-light w-20">
                  Function
                </label>
                <Input
                  id="functionName"
                  title={hook.method.functionName}
                  copy
                  readOnly
                  disabled
                  containerClassName="flex-1"
                  className="font-mono text-xs md:text-xs disabled:text-foreground-light opacity-100"
                  value={hook.method.functionName}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-full space-y-2 max-w-xl">
              <div className="flex flex-row items-center">
                <span className="text-foreground-light w-20">Type</span>
                <span className="text-foreground">HTTPS endpoint</span>
              </div>
              <div className="flex flex-row items-center">
                <label htmlFor="url" className="text-foreground-light w-20">
                  Endpoint
                </label>
                <Input
                  id="url"
                  title={hook.method.url}
                  copy
                  readOnly
                  disabled
                  containerClassName="flex-1"
                  className="font-mono text-xs md:text-xs disabled:text-foreground-light opacity-100"
                  value={hook.method.url}
                />
              </div>
              <div className="flex flex-row items-center">
                <label htmlFor="secret" className="text-foreground-light w-20">
                  Secret
                </label>
                <Input
                  id="secret"
                  copy
                  title={hook.method.secret}
                  reveal={true}
                  readOnly
                  disabled
                  containerClassName="flex-1"
                  className="font-mono text-xs md:text-xs disabled:text-foreground-light opacity-100"
                  value={hook.method.secret}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-x-2">
          {hook.enabled ? (
            <Badge className="space-x-1" variant="success">
              <div className="h-3.5 w-3.5 bg-brand rounded-full flex justify-center items-center">
                <Check className="h-2 w-2 text-background-overlay " strokeWidth={6} />
              </div>
              <span>Enabled</span>
            </Badge>
          ) : (
            <Badge variant="warning">
              <span>Disabled</span>
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="default"
                className="px-1"
                icon={<MoreVertical />}
                aria-label={`Open actions for ${hook.title}`}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItemTooltip
                className="gap-x-2"
                disabled={!canUpdateAuthHook}
                onClick={onSelectEdit}
                tooltip={{
                  content: {
                    text: !canUpdateAuthHook
                      ? 'You need additional permissions to configure auth hooks'
                      : undefined,
                    side: 'left',
                  },
                }}
              >
                <Edit size={12} />
                <span>Edit hook</span>
              </DropdownMenuItemTooltip>
              <DropdownMenuItem asChild className="gap-x-2">
                <a
                  target="_blank"
                  rel="noreferrer noopener"
                  href={`${DOCS_URL}/guides/auth/auth-hooks/${hook.docSlug}`}
                >
                  <BookOpen size={12} />
                  <span>Documentation</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItemTooltip
                className="gap-x-2"
                disabled={!canUpdateAuthHook}
                onClick={onSelectDelete}
                tooltip={{
                  content: {
                    text: !canUpdateAuthHook
                      ? 'You need additional permissions to delete auth hooks'
                      : undefined,
                    side: 'left',
                  },
                }}
              >
                <Trash size={12} />
                <span>Delete hook</span>
              </DropdownMenuItemTooltip>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
