import { LintException } from 'data/lint/lint-rules-query'
import { Member } from 'data/organizations/organization-members-query'
import { lintInfoMap } from '../Linter/Linter.utils'

export const generateRuleText = (e: LintException, member?: Member) => {
  const lintName = lintInfoMap.find((x) => x.name === e.lint_name)?.title

  if (e.is_disabled) {
    return `Ignore "${lintName}" for ${!e.assigned_to ? 'all project members' : `${member?.username ?? member?.primary_email}`}`
  } else {
    return `"${lintName}" is only visible to ${member?.username} `
  }
}

export const generateRuleDescription = ({
  name,
  member,
  disabled,
}: {
  name?: string
  member?: Member
  disabled: boolean
}) => {
  const lint = lintInfoMap.find((x) => x.name === name)
  return (
    <>
      <p className="font-mono uppercase text-xs text-foreground-lighter">What this rule means:</p>
      <p className="!mb-0">
        The "{lint?.title}" lint will be{' '}
        {disabled
          ? `ignored for ${!!member ? `this user only` : 'this project'}`
          : `visible to ${!!member ? `this user only` : ''}`}
      </p>
      <p className="text-foreground-light">
        {!!member ? (
          disabled ? (
            <>
              Only {member.username ?? member.primary_email} will no longer see this lint in the{' '}
              <span className="capitalize">{lint?.category}</span> Advisor, the lint will still be
              visible to all other project members
            </>
          ) : (
            <>
              Only {member.username ?? member.primary_email} will see this lint in the{' '}
              <span className="capitalize">{lint?.category}</span> Advisor, the lint will no longer
              be visible to all other project members
            </>
          )
        ) : (
          <>
            All project members will no longer see this lint in the{' '}
            <span className="capitalize">{lint?.category}</span> Advisor, nor receive notifications
            via emails about this lint
          </>
        )}
      </p>
    </>
  )
}
