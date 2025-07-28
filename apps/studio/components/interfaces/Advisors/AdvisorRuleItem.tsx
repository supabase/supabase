import { ChevronRight, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { useLintRuleDeleteMutation } from 'data/lint/delete-lint-rule-mutation'
import { useProjectLintRulesQuery } from 'data/lint/lint-rules-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  Badge,
  Button,
  Card,
  CardContent,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { LintInfo } from '../Linter/Linter.constants'
import { generateRuleText } from './AdvisorRules.utils'
import { CreateRuleSheet } from './CreateRuleSheet'
import { DisableRuleModal } from './DisableRuleModal'
import { EnableRuleModal } from './EnableRuleModal'

interface AdvisorRuleItemProps {
  lint: LintInfo
}

// [Joshen] Context: We're going with a simplified interface for LW15 as we launch
// this as a feature preview. Going to be purely disabling rules for the whole project,
// not assigning to members, etc (all these can come in the future when we're ready)
// Hence using this to clearly indicate where is being simplified
const SIMPLIFIED_INTERFACE = true

export const AdvisorRuleItem = ({ lint }: AdvisorRuleItemProps) => {
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()

  const [open, setOpen] = useState(false)
  const [expandedLint, setExpandedLint] = useState<string>()
  const [selectedRuleToDelete, setSelectedRuleToDelete] = useState<string>()

  const { data: members = [] } = useOrganizationMembersQuery({ slug: organization?.slug })
  const {
    data = { exceptions: [] },
    error,
    isLoading,
    isSuccess,
    isError,
  } = useProjectLintRulesQuery({ projectRef })

  const rules = data.exceptions.filter((x) => x.lint_name === lint.name)
  const selectedRuleMeta = data.exceptions.find((x) => x.id === selectedRuleToDelete)
  const selectedMemberForRule = members.find((x) => x.gotrue_id === selectedRuleMeta?.assigned_to)

  const { mutate: deleteRule, isLoading: isDeleting } = useLintRuleDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted rule')
      setSelectedRuleToDelete(undefined)
    },
  })

  const onDeleteRule = () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!selectedRuleToDelete) return console.error('No rules selected')
    deleteRule({ projectRef, ids: [selectedRuleToDelete] })
  }

  if (SIMPLIFIED_INTERFACE) {
    return (
      <Card className="border-b-0 rounded-none last:border-b first:rounded-t-md last:rounded-b-md">
        <CardContent className="py-3 flex items-center justify-between text-sm gap-4 cursor-pointer transition hover:bg-surface-200">
          <div className="flex items-center justify-center [&>svg]:text-foreground-lighter">
            {lint.icon}
          </div>
          <div className="flex-1 flex items-center gap-x-2">
            <span>{lint.title}</span>
            {rules.length > 0 && <Badge>Disabled</Badge>}
          </div>
          <div className="flex items-center gap-x-2">
            <DocsButton href={lint.docsLink} />
            {rules.length > 0 ? (
              <EnableRuleModal lint={lint} rule={rules[0]} />
            ) : (
              <DisableRuleModal lint={lint} />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Collapsible_Shadcn_
        id={lint.name}
        open={expandedLint === lint.name}
        onOpenChange={(open) => {
          if (open) setExpandedLint(lint.name)
          else setExpandedLint(undefined)
        }}
      >
        <CollapsibleTrigger_Shadcn_ asChild className="[&[data-state=open]>div>svg]:!rotate-90">
          <Card className="border-b-0 rounded-none">
            <CardContent className="py-3 flex items-center justify-between text-sm gap-4 cursor-pointer transition hover:bg-surface-200">
              <div className="flex items-center justify-center [&>svg]:text-foreground-lighter">
                {lint.icon}
              </div>
              <div className="flex-1 flex items-center gap-x-2">
                <span>{lint.title}</span>
                {rules.length > 0 && (
                  <span className="font-mono text-xs w-5 h-5 rounded-full border border-alternative bg-surface-300 flex items-center justify-center">
                    {rules.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-x-2">
                <DocsButton href={lint.docsLink} />
                <Button
                  type="default"
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpen(true)
                  }}
                >
                  Create rule
                </Button>
              </div>
              <ChevronRight strokeWidth={1.5} size={16} className="transition" />
            </CardContent>
          </Card>
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_
          className={cn(
            'bg-surface border-x border-t !rounded-none',
            rules.length > 0 ? 'divide-y' : ''
          )}
        >
          {isLoading && (
            <div className="px-6 py-3">
              <GenericSkeletonLoader />
            </div>
          )}
          {isError && (
            <AlertError
              className="rounded-none border-0"
              error={error}
              subject="Failed to retrieve advisor rules"
            />
          )}
          {isSuccess && (
            <>
              {rules.length === 0 ? (
                <div className="px-6 py-3">
                  <p className="text-sm text-foreground">
                    Lint is visible to all project members in the{' '}
                    <span className="capitalize">{lint.category}</span> Advisor.
                  </p>
                  <p className="text-sm text-foreground-lighter">
                    Create a rule to configure the visibility of this lint in your project
                  </p>
                </div>
              ) : (
                rules.map((rule) => {
                  const member = members.find((x) => x.gotrue_id === rule.assigned_to)
                  const ruleText = generateRuleText(rule, member)
                  return (
                    <div key={rule.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm">{ruleText}</p>
                        {rule.note && (
                          <p className="text-sm text-foreground-lighter">{rule.note}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-x-2">
                        {/* [Joshen] Will implement in part 2 */}
                        {/* <ButtonTooltip
                          type="default"
                          icon={<Edit />}
                          className="w-7"
                          tooltip={{ content: { side: 'bottom', text: 'Edit rule' } }}
                        /> */}
                        <ButtonTooltip
                          type="default"
                          icon={<Trash />}
                          className="w-7"
                          onClick={() => setSelectedRuleToDelete(rule.id)}
                          tooltip={{ content: { side: 'bottom', text: 'Delete rule' } }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </>
          )}
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>

      <CreateRuleSheet lint={lint} open={open} onOpenChange={setOpen} />

      <ConfirmationModal
        size="medium"
        loading={isDeleting}
        visible={!!selectedRuleToDelete}
        onCancel={() => setSelectedRuleToDelete(undefined)}
        title="Confirm to delete selected rule"
        onConfirm={() => onDeleteRule()}
        alert={{
          base: { variant: 'warning' },
          title: 'The following rule will be removed',
          description: !!selectedRuleMeta
            ? generateRuleText(selectedRuleMeta, selectedMemberForRule)
            : '',
        }}
      >
        {!!selectedRuleMeta && (
          <>
            <p className="text-sm text-foreground">
              The selected lint will appear under the{' '}
              <span className="capitalize">{lint.category}</span> Advisor again
              {!!selectedRuleMeta.assigned_to ? ' for all project members' : ''} once this rule is
              removed.
            </p>
          </>
        )}
      </ConfirmationModal>
    </>
  )
}
