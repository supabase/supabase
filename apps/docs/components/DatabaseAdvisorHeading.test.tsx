import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { DatabaseAdvisorHeading } from './DatabaseAdvisorHeading'

const selectedTab = vi.hoisted(() => ({ current: 'health' }))

vi.mock('~/features/ui/Tabs', () => ({
  useIsTabActive: (id: string) => selectedTab.current === id,
}))

vi.mock('ui', async () => {
  const { default: Heading } = await import('ui/src/components/CustomHTMLElements/Heading')
  return { Heading }
})

function renderAdvisors(activeTab: string) {
  selectedTab.current = activeTab

  return renderToStaticMarkup(
    <>
      {['health', 'security'].map((lintId) => (
        <section key={lintId} id={lintId}>
          <DatabaseAdvisorHeading lintId={lintId} tag="h3">
            How to Resolve
          </DatabaseAdvisorHeading>
          <p>{lintId} instructions</p>
          <DatabaseAdvisorHeading lintId={lintId} tag="h3" id="custom-example">
            Example
          </DatabaseAdvisorHeading>
        </section>
      ))}
    </>
  )
}

describe('DatabaseAdvisorHeading', () => {
  it.each(['health', 'security'])(
    'keeps one legacy anchor per heading and all advisor text when %s is active',
    (activeTab) => {
      const html = renderAdvisors(activeTab)

      expect(html.match(/id="how-to-resolve"/g)).toHaveLength(1)
      expect(html.match(/href="#how-to-resolve"/g)).toHaveLength(1)
      expect(html.match(/id="custom-example"/g)).toHaveLength(1)
      expect(html.match(/href="#custom-example"/g)).toHaveLength(1)
      expect(html).toContain('health instructions')
      expect(html).toContain('security instructions')
      expect(html.match(/<h3/g)).toHaveLength(4)

      expect(html).toContain(`<section id="${activeTab}"><h3 id="how-to-resolve"`)
    }
  )
})
