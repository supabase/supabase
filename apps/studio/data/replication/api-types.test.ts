import { expectTypeOf, test } from 'vitest'

import type { ReplicationCompatiblePaths } from './api-types'

test('widens pipeline IDs without widening other resource IDs', () => {
  type Detail =
    ReplicationCompatiblePaths['/platform/replication/{ref}/pipelines/{pipeline_id}']['get']
  type Pipeline = Detail['responses'][200]['content']['application/json']
  type Version =
    ReplicationCompatiblePaths['/platform/replication/{ref}/pipelines/{pipeline_id}/version']['get']['responses'][200]['content']['application/json']
  expectTypeOf<Detail['parameters']['path']['pipeline_id']>().toEqualTypeOf<string | number>()
  expectTypeOf<Pipeline['id']>().toEqualTypeOf<string | number>()
  expectTypeOf<Pipeline['source_id']>().toEqualTypeOf<number>()
  expectTypeOf<Pipeline['destination_id']>().toEqualTypeOf<number>()
  expectTypeOf<Pipeline['replicator_id']>().toEqualTypeOf<number>()
  expectTypeOf<Version['version']['id']>().toEqualTypeOf<number>()
})
