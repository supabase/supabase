import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { lintInfoMap } from '../Linter/Linter.utils'
import { AdvisorRuleItem } from './AdvisorRuleItem'

interface AdvisorRulesProps {
  category: 'security' | 'performance'
}

export const AdvisorRules = ({ category }: AdvisorRulesProps) => {
  const lints = lintInfoMap.filter((x) => x.category === category)

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth className="!pt-6">
        <div className="[&>div:first-child>div]:rounded-t [&>div:last-child>div]:border-b [&>div:last-child>div]:rounded-b">
          {lints.map((lint) => (
            <AdvisorRuleItem key={lint.name} lint={lint} />
          ))}
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
