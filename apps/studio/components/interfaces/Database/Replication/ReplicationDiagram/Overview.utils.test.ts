import { expect, test } from 'vitest'

import { getOverviewDestination } from './Overview.utils'

const destination = (projectId: string, datasetId: string) => ({
  id: 7,
  tenant_id: 'default',
  name: 'Analytics',
  config: { big_query: { project_id: projectId, dataset_id: datasetId } },
})

test('merges the same BigQuery dataset configured in different clusters', () => {
  const target = destination('warehouse', 'events')
  const singapore = getOverviewDestination({ destination: target, destinationId: 7 })
  const frankfurt = getOverviewDestination({
    destination: { ...target, id: 9 },
    destinationId: 9,
    clusterId: '2',
  })
  expect(singapore.id).toBe(frankfurt.id)
})

test.each([
  ['another-project', 'events'],
  ['warehouse', 'events_with_a_long_shared_prefix_and_a_different_suffix'],
])('keeps distinct BigQuery targets separate: %s.%s', (project, dataset) => {
  const first = getOverviewDestination({
    destination: destination('warehouse', 'events'),
    destinationId: 7,
  })
  const second = getOverviewDestination({
    destination: destination(project, dataset),
    destinationId: 7,
  })
  expect(first.id).not.toBe(second.id)
})

test('does not merge destinations when their external identity is unavailable', () => {
  const singapore = getOverviewDestination({ destinationId: 7 })
  const frankfurt = getOverviewDestination({ destinationId: 7, clusterId: '2' })
  expect(singapore.id).not.toBe(frankfurt.id)
})
