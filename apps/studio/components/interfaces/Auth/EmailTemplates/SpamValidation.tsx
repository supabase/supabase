import { AnimatePresence, motion } from 'framer-motion'

import { Markdown } from 'components/interfaces/Markdown'
import { ValidateSpamResponse } from 'data/auth/validate-spam-mutation'
import { CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Admonition } from 'ui-patterns'

interface SpamValidationProps {
  spamRules?: ValidateSpamResponse['rules']
}

// [Joshen] According to API, we label as a spam risk as long as there are spam
// rules identified with scores above 0. Scores are irrelevant in our context and
// are hence not visualized in the UI

export const SpamValidation = ({ spamRules = [] }: SpamValidationProps) => {
  const rules = spamRules.filter((rule) => rule.score >= 0)

  return (
    <AnimatePresence>
      {rules.length > 0 && (
        <motion.div
          className="border-b"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <CardContent className="py-6 flex flex-col gap-2">
            <Admonition
              type="destructive"
              title="Issues to resolve"
              description="This email is likely to be marked as spam by email servers. Please resolve the below issues before saving."
              className="bg-destructive-300/50 dark:bg-destructive-200 border-destructive-400"
            />

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
                    {rules.map((rule) => (
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
          </CardContent>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
