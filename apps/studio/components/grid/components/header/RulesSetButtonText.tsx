import { Fragment } from 'react'

interface RuleSetButtonTextProps {
  // used to determine the text of the button
  rules: string[]
  // used to determine the text of the button
  type: 'sort' | 'filter'
  // used to render the rule in the button text
  renderRule: (rule: string) => { column: string; operator?: string; value: string }
}

// used for both sort and filter button content
const RuleSetButtonText = ({ rules, type, renderRule }: RuleSetButtonTextProps) => {
  if (!rules?.length) return type === 'sort' ? 'Sort' : 'Filter'

  return (
    <span className="text-foreground-light">
      {type === 'sort' ? 'Sorting' : 'Filtering'} by
      {rules.slice(0, 2).map((rule, i) => {
        const { column, operator, value } = renderRule(rule)
        return (
          <Fragment key={`${type}-${rule}-${i}`}>
            <span className="ml-1 bg-selection border border-foreground-muted px-2 h-5 text-foreground text-xs rounded-full inline-flex items-center">
              <span className="opacity-75">{column}</span>
              <span className="opacity-50 mx-0.5">{operator ? `:${operator}:` : ':'}</span>
              <span className="font-mono max-w-32 truncate">{value}</span>
            </span>
            {i === 0 && rules.length > 1 && <span className="ml-1">and</span>}
          </Fragment>
        )
      })}
      {rules.length > 2 && (
        <span className="ml-1 text-xs">
          and {rules.length - 2} more {rules.length - 2 === 1 ? 'rule' : 'rules'}
        </span>
      )}
    </span>
  )
}

export default RuleSetButtonText
