import { Card } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { HotkeyToggle } from './HotkeyToggle'
import { SHORTCUT_DEFINITIONS } from '@/state/shortcuts/registry'

const SHORTCUT_ORDER = Object.values(SHORTCUT_DEFINITIONS).filter(
  (definition) => definition.showInSettings !== false
)

export const HotkeySettings = () => {
  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle id="keyboard-shortcuts">Keyboard shortcuts</PageSectionTitle>
          <PageSectionDescription>
            Choose which shortcuts stay active while working in the dashboard.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          {SHORTCUT_ORDER.map((definition, index) => (
            <HotkeyToggle
              key={definition.id}
              definition={definition}
              isLast={index === SHORTCUT_ORDER.length - 1}
            />
          ))}
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
