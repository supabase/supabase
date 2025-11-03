import { Check, MailWarning } from 'lucide-react'

import { Markdown } from 'components/interfaces/Markdown'
import { ValidateSpamResponse } from 'data/auth/validate-spam-mutation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

interface SpamValidationProps {
  validationResult?: ValidateSpamResponse
}

// [Joshen] According to API, we label as a spam risk as long as there are spam
// rules identified with scores above 0. Scores are irrelevant in our context and
// are hence not visualized in the UI

export const SpamValidation = ({ validationResult }: SpamValidationProps) => {
  const spamRules = (validationResult?.rules ?? []).filter((rule) => rule.score >= 0)
  const hasSpamWarning = spamRules.length > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-2">
        {hasSpamWarning ? (
          <MailWarning size={16} strokeWidth={1.5} className="text-warning mt-0.5" />
        ) : (
          <Check size={16} strokeWidth={1.5} className="text-brand mt-0.5" />
        )}
        <p className={`text-sm ${hasSpamWarning ? 'text-foreground' : 'text-foreground-light'}`}>
          {hasSpamWarning
            ? 'High probability of being marked as spam. Review these issues to improve deliverability:'
            : 'Not likely to be marked as spam'}
        </p>
      </div>
      {hasSpamWarning && (
        <div className="flex flex-col gap-1">
          <div className="w-full border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warning</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spamRules.map((rule) => (
                  <TableRow key={rule.name}>
                    <TableCell className="font-mono">{rule.name}</TableCell>
                    <TableCell>{rule.desc}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Markdown
            className="!max-w-none text-foreground-lighter text-xs mt-2"
            content="Spam validation is powered by [SpamAssassin](https://spamassassin.apache.org/doc.html). Full list of all available warnings can be found [here](https://gist.github.com/ychaouche/a2faff159c2a1fea16019156972c7f8b)."
          />
        </div>
      )}
    </div>
  )
}
