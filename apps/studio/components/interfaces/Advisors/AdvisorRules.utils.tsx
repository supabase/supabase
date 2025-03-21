import { LintException } from 'data/lint/lint-rules-query'
import { Member } from 'data/organizations/organization-members-query'
import { lintInfoMap } from '../Linter/Linter.utils'

export const generateRuleText = (e: LintException, member?: Member) => {
  const lintName = lintInfoMap.find((x) => x.name === e.lint_name)?.title
  return `${e.is_disabled ? 'Ignore' : 'Assigned'} ${
    !!e.lint_category && !e.lint_name
      ? `all ${e.lint_category.toLowerCase()} lints`
      : `"${lintName}"`
  } for ${!e.assigned_to ? 'all project members' : `${member?.username ?? member?.primary_email}`}`
}

export const generateRuleDescription = ({
  type,
  category,
  name,
  member,
  disabled,
}: {
  type: string
  category?: string
  name?: string
  member?: Member
  disabled: boolean
}) => {
  return (
    <>
      {type === 'category' ? (
        <>
          All lints in the{' '}
          <span className="capitalize">{(category ?? '').toLowerCase()} Advisor</span>
        </>
      ) : (
        <>The "{lintInfoMap.find((x) => x.name === name)?.title}" lint</>
      )}{' '}
      will be{' '}
      {disabled
        ? `ignored for ${!!member ? `${member.username ?? member.primary_email} only` : 'this project'}`
        : `visible to ${!!member ? `${member.username ?? member.primary_email} only` : ''}`}
    </>
  )
}
