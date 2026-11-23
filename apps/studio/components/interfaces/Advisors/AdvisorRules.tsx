import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection } from 'ui-patterns/PageSection'

import { lintInfoMap } from '../Linter/Linter.utils'
import { AdvisorRuleItem } from './AdvisorRuleItem'

interface AdvisorRulesProps {
  category: 'security' | 'performance'
}

export const AdvisorRules = ({ category }: AdvisorRulesProps) => {
  const lints = lintInfoMap.filter((x) => x.category === category)

  return (
    <PageContainer>
      <PageSection className="pt-6 last:pb-6">
        <div className="[&>div:first-child>div]:rounded-t [&>div:last-child>div]:border-b [&>div:last-child>div]:rounded-b">
          {lints.map((lint) => (
            <AdvisorRuleItem key={lint.name} lint={lint} />
          ))}
        </div>
      </PageSection>
    </PageContainer>
  )
}
