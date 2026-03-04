import { useParams } from 'common'
import { useCreateRuleMutation } from 'data/advisors/rules-query'
import { DollarSign, ShieldCheck, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge, Button, Card, CardContent } from 'ui'

import { ALL_TEMPLATES, type RuleTemplate } from './rule-templates'

const categoryIcons = {
  security: ShieldCheck,
  performance: Zap,
  cost: DollarSign,
} as const

export function RuleTemplates({ existingRuleNames }: { existingRuleNames: string[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {ALL_TEMPLATES.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          existingRuleNames={existingRuleNames}
        />
      ))}
    </div>
  )
}

function TemplateCard({
  template,
  existingRuleNames,
}: {
  template: RuleTemplate
  existingRuleNames: string[]
}) {
  const { ref: projectRef } = useParams()
  const createMutation = useCreateRuleMutation(projectRef)
  const [applying, setApplying] = useState(false)

  const Icon = categoryIcons[template.category] ?? ShieldCheck
  const newRules = template.rules.filter((r) => !existingRuleNames.includes(r.name))
  const allApplied = newRules.length === 0

  const handleApply = async () => {
    setApplying(true)
    try {
      for (const rule of newRules) {
        await createMutation.mutateAsync(rule)
      }
      toast.success(`Applied ${newRules.length} rules from "${template.name}"`)
    } catch (err) {
      toast.error('Failed to apply template')
    } finally {
      setApplying(false)
    }
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-surface-200 p-2 shrink-0">
            <Icon className="h-4 w-4 text-foreground-lighter" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{template.name}</p>
            <p className="text-xs text-foreground-lighter mt-0.5">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Badge variant="default">{template.rules.length} rules</Badge>
          {allApplied ? (
            <span className="text-xs text-foreground-muted">All applied</span>
          ) : (
            <Button
              type="default"
              size="tiny"
              loading={applying}
              onClick={handleApply}
            >
              {newRules.length < template.rules.length
                ? `Apply ${newRules.length} remaining`
                : 'Apply template'
              }
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
