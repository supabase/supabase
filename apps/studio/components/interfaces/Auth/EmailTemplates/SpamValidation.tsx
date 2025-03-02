import { Markdown } from 'components/interfaces/Markdown'
import InformationBox from 'components/ui/InformationBox'
import { ValidateSpamResponse } from 'data/auth/validate-spam-mutation'
import {
  cn,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WarningIcon,
} from 'ui'

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
    <InformationBox
      className={cn('mb-2', hasSpamWarning && '!bg-alternative/75', '!px-0', 'rounded-t-none')}
      icon={hasSpamWarning && <WarningIcon />}
      title={
        hasSpamWarning
          ? 'Email has a high probability of being marked as spam and deliverability may be affected'
          : 'Email content is unlikely to be marked as spam'
      }
      description={
        hasSpamWarning ? (
          <>
            <div className="flex flex-col gap-y-3">
              <p>
                {hasSpamWarning
                  ? ` Rectify the following issues to improve your email's deliverability in order of priority:`
                  : ` Address the following issues to improve your email's deliverability:`}
              </p>
              <Table>
                <TableHeader className="font-mono uppercase text-xs [&_th]:h-auto [&_th]:py-2">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-0">Warning</TableHead>
                    <TableHead className="pr-0">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spamRules.map((rule) => (
                    <TableRow key={rule.name} className="hover:bg-transparent">
                      <TableCell className="pl-0 font-mono text-xs text-foreground">
                        {rule.name}
                      </TableCell>
                      <TableCell className="pr-0">{rule.desc}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Separator />
            <Markdown
              className="!max-w-none text-foreground-muted text-xs [&_a]:text-foreground-lighter mt-2"
              content="Spam validation is powered by [SpamAssassin](https://spamassassin.apache.org/doc.html). Full list of all available warnings can be found [here](https://gist.github.com/ychaouche/a2faff159c2a1fea16019156972c7f8b)."
            />
          </>
        ) : null
      }
    />
  )
}
