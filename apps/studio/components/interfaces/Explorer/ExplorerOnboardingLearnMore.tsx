import { Card, CardContent } from 'ui'
import { CollapsibleCardSection } from 'ui-patterns/CollapsibleCardSection'

export const ExplorerOnboardingLearnMore = () => (
  <Card>
    <CardContent>
      <CollapsibleCardSection title="Learn more">
        <dl className="space-y-5 pt-2 text-sm">
          <div className="space-y-1">
            <dt className="font-medium">Where did my snippets go?</dt>
            <dd className="leading-relaxed text-foreground-light">
              Notebooks are intended to replace snippets over time. Your saved snippets are still
              accessible by switching back to the SQL Editor.
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium">Do notebooks replace custom reports?</dt>
            <dd className="leading-relaxed text-foreground-light">
              Notebooks are intended to replace custom reports over time. Your custom reports are
              still accessible under Observability.
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium">Who can see my notebooks?</dt>
            <dd className="leading-relaxed text-foreground-light">
              Notebooks are shared with everyone on your team by default.
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="font-medium">Can AI see my data?</dt>
            <dd className="leading-relaxed text-foreground-light">
              Your organization’s AI settings control whether Assistant can access schema, logs, and
              query results.
            </dd>
          </div>
        </dl>
      </CollapsibleCardSection>
    </CardContent>
  </Card>
)
