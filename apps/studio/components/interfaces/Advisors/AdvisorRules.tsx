import { Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FilterPopover } from 'components/ui/FilterPopover'
import { useLintRuleDeleteMutation } from 'data/lint/delete-lint-rule-mutation'
import { useProjectLintRulesQuery } from 'data/lint/lint-rules-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { generateRuleText } from './AdvisorRules.utils'
import { CreateRuleSheet } from './CreateRuleSheet'

export const AdvisorRules = () => {
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()

  const [showPanel, setShowPanel] = useState(false)
  const [filters, setFilters] = useState<{
    categories: string[]
    users: string[]
  }>({ categories: [], users: [] })
  const [selectedRule, setSelectedRule] = useState<string>()

  const { data, isLoading } = useProjectLintRulesQuery({ projectRef })
  const { data: members = [] } = useOrganizationMembersQuery({ slug: organization?.slug })
  const { mutate: deleteRule, isLoading: isDeleting } = useLintRuleDeleteMutation({
    onSuccess: () => {
      toast.success('Successfully deleted rule')
      setSelectedRule(undefined)
    },
  })

  const exceptions = (data?.exceptions ?? [])
    .filter((x) => {
      if (filters.categories.length > 0) {
        return filters.categories.includes(x.lint_category ?? '')
      } else return x
    })
    .filter((x) => {
      if (filters.users.length > 0) {
        return filters.users.includes(x.assigned_to ?? '')
      } else return x
    })
  const selectedRuleMeta = exceptions.find((x) => x.id === selectedRule)
  const selectedMemberForRule = members.find((x) => x.gotrue_id === selectedRuleMeta?.assigned_to)

  const onDeleteRule = () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!selectedRule) return console.error('No rules selected')
    deleteRule({ projectRef, ids: [selectedRule] })
  }

  return (
    <PageLayout
      title="Advisor Rules"
      subtitle="Disable specific advisor categories or rules, or assign them to members for resolution"
    >
      <ScaffoldContainer>
        <ScaffoldSection isFullWidth className="!pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-x-2">
              <p className="text-xs prose">Filter by</p>
              <FilterPopover
                name="Categories"
                options={[
                  { key: 'All', value: 'ALL' },
                  { key: 'Performance', value: 'PERFORMANCE' },
                  { key: 'Security', value: 'SECURITY' },
                ]}
                labelKey="key"
                valueKey="value"
                activeOptions={filters.categories}
                onSaveFilters={(values) => setFilters({ ...filters, categories: values })}
              />
              <FilterPopover
                name="Users"
                options={members}
                labelKey="username"
                valueKey="gotrue_id"
                activeOptions={filters.users}
                onSaveFilters={(values) => setFilters({ ...filters, users: values })}
              />
            </div>
            <Button key="create-rule" onClick={() => setShowPanel(true)}>
              Create rule
            </Button>
          </div>

          <Table
            head={[<Table.th key="rule">Rule</Table.th>, <Table.th key="actions" />]}
            body={
              exceptions.length === 0
                ? [
                    <Table.tr key="empty-state">
                      <Table.td colSpan={3} className="p-3 py-12 text-center">
                        <p className="text-foreground-light">
                          {isLoading
                            ? 'Checking for rules'
                            : 'You do not have any advisor rules created yet'}
                        </p>
                      </Table.td>
                    </Table.tr>,
                  ]
                : exceptions.map((e) => {
                    const member = members.find((x) => x.gotrue_id === e.assigned_to)
                    const ruleText = generateRuleText(e, member)

                    return (
                      <Table.tr key={e.id}>
                        <Table.td>
                          <p>{ruleText}</p>
                          {!!e.note && <p className="!text-foreground-lighter">{e.note}</p>}
                        </Table.td>
                        <Table.td className="flex items-center justify-end gap-x-2">
                          <ButtonTooltip
                            type="default"
                            icon={<Trash />}
                            className="w-7"
                            onClick={() => setSelectedRule(e.id)}
                            tooltip={{ content: { side: 'bottom', text: 'Delete rule' } }}
                          />
                        </Table.td>
                      </Table.tr>
                    )
                  })
            }
          />
        </ScaffoldSection>
      </ScaffoldContainer>

      <CreateRuleSheet open={showPanel} onOpenChange={setShowPanel} />

      <ConfirmationModal
        size="medium"
        loading={isDeleting}
        visible={!!selectedRule}
        onCancel={() => setSelectedRule(undefined)}
        title="Confirm to delete selected rule"
        onConfirm={() => onDeleteRule()}
        alert={{
          base: { variant: 'warning' },
          title: 'The following rule will be deleted',
          description: !!selectedRuleMeta
            ? generateRuleText(selectedRuleMeta, selectedMemberForRule)
            : '',
        }}
      >
        {!!selectedRuleMeta && (
          <>
            <p className="text-sm text-foreground">
              {selectedRuleMeta.lint_category === 'ALL' ? 'All' : 'The'} lint
              {selectedRuleMeta.lint_category === 'ALL' ? 's' : ''} will appear under{' '}
              {selectedRuleMeta.lint_category === 'ALL' ? (
                <>all Advisors</>
              ) : (
                <>
                  the{' '}
                  <span className="capitalize">
                    {selectedRuleMeta.lint_category?.toLowerCase()}
                  </span>{' '}
                  Advisor
                </>
              )}{' '}
              again{!!selectedRuleMeta.assigned_to ? ' for all project members' : ''} once this rule
              is removed.
            </p>
          </>
        )}
      </ConfirmationModal>
    </PageLayout>
  )
}
