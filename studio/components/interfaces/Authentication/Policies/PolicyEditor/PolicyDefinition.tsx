import { FC, useEffect } from 'react'
import { IconHelpCircle } from '@supabase/ui'
import * as Tooltip from '@radix-ui/react-tooltip'

import { usePrevious } from 'hooks'
import SqlEditor from 'components/ui/SqlEditor'

interface Props {
  operation: string
  definition: string
  check: string
  onUpdatePolicyUsing: (using: string | undefined) => void
  onUpdatePolicyCheck: (check: string | undefined) => void
}

const PolicyDefinition: FC<Props> = ({
  operation = '',
  definition = '',
  check = '',
  onUpdatePolicyUsing,
  onUpdatePolicyCheck,
}) => {
  const showUsing = (operation: string) =>
    ['SELECT', 'UPDATE', 'DELETE', 'ALL'].includes(operation) || !operation
  const showCheck = (operation: string) => ['INSERT', 'UPDATE', 'ALL'].includes(operation)

  const previousOperation = usePrevious(operation) || ''
  useEffect(() => {
    if (showUsing(previousOperation) && !showUsing(operation)) onUpdatePolicyUsing(undefined)
    if (showCheck(previousOperation) && !showCheck(operation)) onUpdatePolicyCheck(undefined)
  }, [operation])

  return (
    <div className="space-y-4">
      {showUsing(operation) && (
        <div className="flex space-x-12">
          <div className="flex w-1/3 flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-scale-1100 text-base" htmlFor="policy-name">
                USING expression
              </label>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <IconHelpCircle className="text-scale-1100" size={16} strokeWidth={1.5} />
                </Tooltip.Trigger>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'bg-scale-100 rounded py-1 px-2 leading-none shadow',
                      'border-scale-200 border w-[300px] space-y-2',
                    ].join(' ')}
                  >
                    <p className="text-scale-1200 text-xs">
                      This expression will be added to queries that refer to the table if row-level
                      security is enabled.
                    </p>
                    <p className="text-scale-1200 text-xs">
                      Rows for which the expression returns true will be visible. Any rows for which
                      the expression returns false or null will not be visible to the user (in a
                      SELECT), and will not be available for modification (in an UPDATE or DELETE).
                    </p>
                    <p className="text-scale-1200 text-xs">
                      Such rows are silently suppressed - no error is reported.
                    </p>
                  </div>
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
            <p className="text-scale-900 text-sm">
              Provide a SQL conditional expression that returns a boolean.
            </p>
          </div>
          <div className={`w-2/3 ${showCheck(operation) ? 'h-32' : 'h-56'}`}>
            <SqlEditor defaultValue={definition} onInputChange={onUpdatePolicyUsing} />
          </div>
        </div>
      )}
      {showCheck(operation) && (
        <div className="flex space-x-12">
          <div className="flex w-1/3 flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <label className="text-scale-1100 text-base" htmlFor="policy-name">
                WITH CHECK expression
              </label>
              <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger>
                  <IconHelpCircle className="text-scale-1100" size={16} strokeWidth={1.5} />
                </Tooltip.Trigger>
                <Tooltip.Content side="bottom">
                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                  <div
                    className={[
                      'bg-scale-100 rounded py-1 px-2 leading-none shadow',
                      'border-scale-200 border w-[300px] space-y-2',
                    ].join(' ')}
                  >
                    <p className="text-scale-1200 text-xs">
                      This expression will be used in INSERT and UPDATE queries against the table if
                      row-level security is enabled.
                    </p>
                    <p className="text-scale-1200 text-xs">
                      Only rows for which the expression evaluates to true will be allowed. An error
                      will be thrown if the expression evaluates to false or null for any of the
                      records inserted or any of the records that result from the update.
                    </p>
                    <p className="text-scale-1200 text-xs">
                      Note that this expression is evaluated against the proposed new contents of
                      the row, not the original contents.
                    </p>
                  </div>
                </Tooltip.Content>
              </Tooltip.Root>
            </div>
            <p className="text-scale-900 text-sm">
              Provide a SQL conditional expression that returns a boolean.
            </p>
          </div>
          <div className={`w-2/3 ${showUsing(operation) ? 'h-32' : 'h-56'}`}>
            <SqlEditor defaultValue={check} onInputChange={onUpdatePolicyCheck} />
          </div>
        </div>
      )}
    </div>
  )
}

export default PolicyDefinition
