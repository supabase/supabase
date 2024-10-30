import { Check } from 'lucide-react'

import Table from 'components/to-be-cleaned/Table'
import InformationBox from 'components/ui/InformationBox'
import { ValidateSpamResponse } from 'data/auth/validate-spam-mutation'
import { cn, CriticalIcon, WarningIcon } from 'ui'

interface SpamValidationProps {
  validationResult?: ValidateSpamResponse
}

// [Joshen] Referring to this to understand SpamAssasin results:
// https://www.mailercheck.com/articles/spamassassin-score#test
// TLDR: A total score of above 5 is considered spam, ideal score is 0 - 2, everything in between is a warning
// Any individual metric above 0 is considered to be a warning

export const SpamValidation = ({ validationResult }: SpamValidationProps) => {
  const totalSpamScore = (validationResult?.rules ?? []).reduce((a, b) => a + b.score, 0)
  const hasSpamWarning = totalSpamScore > 2
  const exceedsThreshold = totalSpamScore >= 5
  const sortedRules = (validationResult?.rules ?? []).sort((a, b) => b.score - a.score)

  return (
    <InformationBox
      className={cn('mb-2', hasSpamWarning && '!bg-alternative')}
      icon={
        exceedsThreshold ? (
          <CriticalIcon />
        ) : hasSpamWarning ? (
          <WarningIcon />
        ) : (
          <Check size={16} className="text-brand" />
        )
      }
      title={
        hasSpamWarning
          ? exceedsThreshold
            ? 'Email content has been identified as spam and deliverability may be affected'
            : 'Email has a high probability of being marked as spam and deliverability may be affected'
          : 'Email content is unlikely to be marked as spam'
      }
      description={
        <>
          <p>
            Spam score by SpamAssasin: <span className="text-foreground">{totalSpamScore}</span>
          </p>
          <p className="mt-1">
            A score above 5 is considered spam, whereas an ideal score is 0 - 2. Higher scores
            indicate the chances of your email landing in the spam folder.
            {sortedRules.length > 0
              ? hasSpamWarning
                ? ` Rectify the following issues to improve your email's deliverability in order of priority:`
                : ` Address the following issues to improve your email's deliverability:`
              : ''}
          </p>

          {sortedRules.length > 0 && (
            <Table
              className="mt-3"
              head={[
                <Table.th key="score">Score</Table.th>,
                <Table.th key="name">Description</Table.th>,
                <Table.th key="desc"></Table.th>,
              ]}
              body={sortedRules.map((rule) => (
                <Table.tr key={rule.name}>
                  <Table.td className="tabular-nums">{rule.score}</Table.td>
                  <Table.td>{rule.name}</Table.td>
                  <Table.td>{rule.desc}</Table.td>
                </Table.tr>
              ))}
            />
          )}
        </>
      }
    />
  )
}
