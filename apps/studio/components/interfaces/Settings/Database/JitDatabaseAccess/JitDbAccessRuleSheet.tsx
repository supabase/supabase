import { InlineLink } from 'components/ui/InlineLink'
import { DOCS_URL } from 'lib/constants'
import {
  Button,
  ScrollArea,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { JitMemberOption, JitUserRule, JitUserRuleDraft, SheetMode } from './JitDbAccess.types'
import { JitDbAccessRoleGrantFields } from './JitDbAccessRoleGrantFields'

interface JitDbAccessRuleSheetProps {
  open: boolean
  mode: SheetMode
  draft: JitUserRuleDraft
  editingUser: JitUserRule | null
  memberOptions: JitMemberOption[]
  availableMembersForAddCount: number
  showInlineValidation: boolean
  inlineValidation: {
    member?: string
    roles?: string
  }
  isSubmitting?: boolean
  onDraftChange: (next: JitUserRuleDraft) => void
  onCancel: () => void
  onSave: () => void
  onRequestDelete: () => void
}

export function JitDbAccessRuleSheet({
  open,
  mode,
  draft,
  editingUser,
  memberOptions,
  availableMembersForAddCount,
  showInlineValidation,
  inlineValidation,
  isSubmitting = false,
  onDraftChange,
  onCancel,
  onSave,
  onRequestDelete,
}: JitDbAccessRuleSheetProps) {
  const updateGrant = (
    roleId: string,
    updater: (grant: JitUserRuleDraft['grants'][number]) => JitUserRuleDraft['grants'][number]
  ) => {
    onDraftChange({
      ...draft,
      grants: draft.grants.map((grant) => (grant.roleId === roleId ? updater(grant) : grant)),
    })
  }

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <SheetContent
        showClose={false}
        size="default"
        className="flex h-full w-full max-w-full flex-col gap-0 sm:!w-[560px] sm:max-w-[560px]"
      >
        <SheetHeader>
          <SheetTitle>
            {mode === 'edit' ? 'Edit JIT access rule' : 'New JIT access rule'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Configure which database roles a user can request with JIT access.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 max-h-[calc(100vh-116px)]">
          <div className="space-y-8 px-5 py-6 sm:px-6">
            <FormItemLayout layout="vertical" isReactForm={false} label="Member">
              <Select_Shadcn_
                value={draft.memberId}
                disabled={mode === 'edit' || (mode === 'add' && availableMembersForAddCount === 0)}
                onValueChange={(value) => onDraftChange({ ...draft, memberId: value })}
              >
                <SelectTrigger_Shadcn_>
                  <SelectValue_Shadcn_ placeholder="Select a member" />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {memberOptions.map((member) => (
                    <SelectItem_Shadcn_ key={member.id} value={member.id}>
                      {member.name ? (
                        <>
                          {member.name}{' '}
                          <span className="text-foreground-lighter">({member.email})</span>
                        </>
                      ) : (
                        member.email
                      )}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>

              {mode === 'edit' && (
                <p className="mt-2 text-xs text-foreground-lighter">
                  The member cannot be changed when editing an existing JIT access rule.
                </p>
              )}

              {mode === 'add' && availableMembersForAddCount === 0 && (
                <p className="mt-2 text-xs text-foreground-lighter">
                  All project members already have JIT access rules. Edit an existing rule from the
                  table above.
                </p>
              )}

              {showInlineValidation && inlineValidation.member && (
                <p className="mt-2 text-xs text-destructive">{inlineValidation.member}</p>
              )}
            </FormItemLayout>

            <FormItemLayout layout="vertical" isReactForm={false} label="Roles and settings">
              <div className="overflow-hidden rounded-md border">
                {draft.grants.length === 0 ? (
                  <div className="p-4 text-sm text-foreground-light">No assignable roles found</div>
                ) : (
                  draft.grants.map((grant, index) => (
                    <div key={grant.roleId} className={index > 0 ? 'border-t' : ''}>
                      <JitDbAccessRoleGrantFields
                        role={{ id: grant.roleId, label: grant.roleId }}
                        grant={grant}
                        onChange={(next) => updateGrant(grant.roleId, () => next)}
                      />
                    </div>
                  ))
                )}
              </div>

              <p className="mt-2 text-xs leading-normal text-foreground-lighter">
                Define scoped permissions with{' '}
                <InlineLink
                  href={`${DOCS_URL}/guides/database/postgres/roles`}
                  className="decoration-foreground-muted"
                >
                  custom Postgres roles
                </InlineLink>{' '}
                before creating a JIT access rule. Narrow roles limit the impact of direct database
                access.
              </p>

              {showInlineValidation && inlineValidation.roles && (
                <p className="text-xs text-destructive">{inlineValidation.roles}</p>
              )}
            </FormItemLayout>
          </div>
        </ScrollArea>

        <SheetFooter className="mt-auto w-full border-t py-4">
          {mode === 'edit' && editingUser && (
            <div className="mr-auto">
              <Button type="danger" onClick={onRequestDelete} disabled={isSubmitting}>
                Delete rule
              </Button>
            </div>
          )}
          <Button type="default" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="primary" onClick={onSave} disabled={isSubmitting}>
            {mode === 'edit' ? 'Save rule' : 'Create rule'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
