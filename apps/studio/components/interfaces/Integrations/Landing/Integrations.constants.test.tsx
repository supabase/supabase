import { renderToString } from 'react-dom/server'
import { describe, expect, test } from 'vitest'

import { INTEGRATIONS } from './Integrations.constants'

describe('INTEGRATIONS.navigate', () => {
  test('returns a stable component reference across repeated calls for the same route', () => {
    const queues = INTEGRATIONS.find((integration) => integration.id === 'queues')
    expect(queues).toBeDefined()

    const firstOverview = queues?.navigate({ id: 'queues', pageId: 'overview', childId: undefined })
    const secondOverview = queues?.navigate({
      id: 'queues',
      pageId: 'overview',
      childId: undefined,
    })

    expect(firstOverview).toBeTruthy()
    expect(firstOverview).toBe(secondOverview)
  })

  test('renders the loading fallback on the server for GraphiQLTab instead of evaluating GraphiQL', () => {
    const graphiql = INTEGRATIONS.find((integration) => integration.id === 'graphiql')
    const GraphiQLTab = graphiql?.navigate({
      id: 'graphiql',
      pageId: 'graphiql',
      childId: undefined,
    })

    expect(GraphiQLTab).toBeTruthy()
    if (!GraphiQLTab) throw new Error('Expected GraphiQLTab component')

    // Rendering without a Suspense boundary proves ClientOnly gates LazyGraphiQLTab
    // on the server — if LazyGraphiQLTab rendered during SSR, React would throw.
    const html = renderToString(<GraphiQLTab />)
    expect(html).not.toBe('')
    expect(html).not.toContain('graphiql')
  })
})
