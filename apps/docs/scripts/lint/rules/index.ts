import { Content } from 'mdast'
import { headingsSentenceCase } from '../rules/headings-sentence-case'
import { LintRule } from '../rules/rules'

export interface RulesConfig {
  byType: Partial<Record<Content['type'], LintRule[]>>
}

export const builtinRules: LintRule[] = [headingsSentenceCase()]

export function validateUniqueRuleIds(rules: LintRule[]) {
  const conflictingIds = rules
    .map((rule) => rule.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index)

  if (conflictingIds.length === 0) {
    return { success: true }
  }

  return { success: false, conflictingIds }
}

export function getRulesConfig(rules: LintRule[]): RulesConfig {
  return rules.reduce(
    (rulesConfig, currRule) => {
      let nodeTypes = currRule.nodeTypes
      nodeTypes.forEach((nodeType) => {
        if (!(nodeType in rulesConfig.byType)) {
          rulesConfig.byType[nodeType] = []
        }
        rulesConfig.byType[nodeType].push(currRule)
      })
      return rulesConfig
    },
    { byType: {} }
  )
}
