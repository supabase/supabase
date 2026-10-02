import path from 'node:path'
import { BaseSequencer, type TestSpecification } from 'vitest/node'

const testOrder = ['*', 'tus.test.ts', 's3-protocol.test.ts', 'rls.test.ts'] as const

export default class IntegrationSequencer extends BaseSequencer {
  async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
    const testBuckets = Object.fromEntries(
      testOrder.map((entry) => [entry, [] as TestSpecification[]])
    ) as Record<(typeof testOrder)[number], TestSpecification[]>

    for (const file of files) {
      const fileName = path.basename(file.moduleId)
      const bucket = testBuckets[fileName as keyof typeof testBuckets] ?? testBuckets['*']
      bucket.push(file)
    }

    const sortedBuckets = await Promise.all(
      testOrder.map((entry) => super.sort(testBuckets[entry]))
    )

    return sortedBuckets.flat()
  }
}
