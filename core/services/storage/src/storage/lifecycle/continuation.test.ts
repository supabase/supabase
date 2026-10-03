import { randomUUID } from 'node:crypto'
import { withOptionalVersion } from '@storage/backend/adapter'
import {
  advanceLifecycleEvaluationPage,
  armLifecycleAttempt,
  commitLifecycleBatchResults,
  completeLifecycleBatch,
  createLifecycleContinuation,
  decodeLifecycleContinuation,
  filterStagedLifecycleBatch,
  freezeLifecycleBatchVersion,
  LifecycleContinuationDecodeError,
  recordLifecycleArtifactOutcomes,
  refreshStagedLifecycleBatchArtifacts,
  stageLifecycleBatch,
} from './continuation'

function validContinuation() {
  const generation = randomUUID()
  return {
    continuationVersion: 1,
    runId: randomUUID(),
    trigger: 'scheduled',
    generation,
    snapshotAt: '2026-08-06T00:00:00.000Z',
    mode: 'DELETE',
    topology: {
      scanKind: 'NONCURRENT',
      epoch: '1',
      shardId: 0,
      shardCount: 1,
    },
    pageEnd: {
      name: 'logs/example.json',
      archivedAt: '2026-08-05T12:00:00.000Z',
    },
    counters: {
      versionsExamined: 1,
      versionsEligible: 1,
      objectVersionsDeleted: 0,
      deleteMarkersDeleted: 0,
      bytesDeleted: 0,
      batchesCompleted: 0,
    },
    batch: {
      versions: [
        {
          name: 'logs/example.json',
          version: randomUUID(),
          artifacts: [
            { key: 'logs/example.json/version', outcome: 'UNRESOLVED' },
            { key: 'logs/example.json/version.info', outcome: 'UNRESOLVED' },
          ],
        },
      ],
      inFlight: {
        attemptId: randomUUID(),
        authorizedGeneration: generation,
        startedAt: '2026-08-06T00:01:00.000Z',
      },
    },
  }
}

describe('decodeLifecycleContinuation', () => {
  test('decodes a bounded v1 continuation', () => {
    const input = validContinuation()
    expect(decodeLifecycleContinuation(input)).toEqual(input)
  })

  test('rejects a resolved artifact with a missing companion', () => {
    const input = validContinuation()
    const artifacts = input.batch.versions[0].artifacts
    artifacts[0].outcome = 'DELETED'
    artifacts.pop()

    expect(() => decodeLifecycleContinuation(input)).toThrow(
      'batch.versions[0].artifacts must contain 0 or 2 entries'
    )
  })

  test('round-trips an armed legacy physical version without replacing null with a sentinel', () => {
    const input = validContinuation()
    const legacy = freezeLifecycleBatchVersion({
      name: 'logs/example.json',
      version: null,
      isDeleteMarker: false,
    })
    const journal = { ...input, batch: { ...input.batch, versions: [legacy] } }
    expect(decodeLifecycleContinuation(JSON.parse(JSON.stringify(journal)))).toEqual(journal)
    expect(legacy.artifacts).toEqual([
      { key: 'logs/example.json', outcome: 'UNRESOLVED' },
      { key: 'logs/example.json.info', outcome: 'UNRESOLVED' },
    ])
  })

  test('rejects an omitted physical version selector in a durable batch', () => {
    const input = validContinuation()
    const { version: _version, ...entry } = input.batch.versions[0]
    expect(() =>
      decodeLifecycleContinuation({ ...input, batch: { ...input.batch, versions: [entry] } })
    ).toThrow('batch.versions[0].version')
  })

  test.each([
    2, 3,
  ])('fails closed on unknown continuation version %s before reading the payload', (continuationVersion) => {
    expect(() => decodeLifecycleContinuation({ continuationVersion })).toThrow(
      `Unsupported lifecycle continuation version ${continuationVersion}`
    )
  })

  test.each([
    [
      'invalid UUID',
      (value: ReturnType<typeof validContinuation>) => {
        value.runId = 'not-a-uuid' as ReturnType<typeof validContinuation>['runId']
      },
    ],
    [
      'batch without page end',
      (value: ReturnType<typeof validContinuation>) => {
        delete (value as { pageEnd?: unknown }).pageEnd
      },
    ],
    [
      'unknown artifact outcome',
      (value: ReturnType<typeof validContinuation>) => {
        value.batch.versions[0].artifacts[0].outcome = 'MAYBE'
      },
    ],
  ])('rejects %s', (_name, mutate) => {
    const value = validContinuation()
    mutate(value)
    expect(() => decodeLifecycleContinuation(value)).toThrow(LifecycleContinuationDecodeError)
  })

  test('bounds the durable logical-version batch', () => {
    const value = validContinuation()
    value.batch.versions = Array.from({ length: 501 }, () => value.batch.versions[0])
    expect(() => decodeLifecycleContinuation(value)).toThrow('at most 500 entries')
  })
})

describe('lifecycle continuation transitions', () => {
  test('rejects empty staging and advances pages without eligible candidates', () => {
    const initial = createLifecycleContinuation({
      runId: randomUUID(),
      trigger: 'scheduled',
      generation: randomUUID(),
      snapshotAt: '2026-08-15T00:00:00.000Z',
      mode: 'DELETE',
      topology: {
        scanKind: 'NONCURRENT',
        epoch: '1',
        shardId: 0,
        shardCount: 1,
      },
    })
    const page = {
      rawRowsExamined: 1,
      candidates: [],
      pageEnd: { name: 'logs/example.json', archivedAt: '2026-08-02T00:00:00.000Z' },
      exhausted: false,
    }

    expect(() =>
      stageLifecycleBatch(initial, {
        pageEnd: page.pageEnd,
        rawRowsExamined: page.rawRowsExamined,
        versions: [],
      })
    ).toThrow('Lifecycle batch cannot be empty')

    expect(advanceLifecycleEvaluationPage(initial, page)).toEqual({
      ...initial,
      cursor: page.pageEnd,
      counters: { ...initial.counters, versionsExamined: 1 },
    })
  })

  test('keeps null and literal null-string identities separate through filtering and recovery', () => {
    const initial = validContinuation()
    const legacy = freezeLifecycleBatchVersion({
      name: 'logs/example.json',
      version: null,
      isDeleteMarker: false,
    })
    const named = freezeLifecycleBatchVersion({
      name: legacy.name,
      version: 'null',
      isDeleteMarker: false,
    })
    const staged = decodeLifecycleContinuation({
      ...initial,
      counters: { ...initial.counters, versionsExamined: 2, versionsEligible: 2 },
      batch: { versions: [legacy, named] },
    })

    expect(filterStagedLifecycleBatch(staged, [legacy]).batch?.versions).toEqual([legacy])
    expect(filterStagedLifecycleBatch(staged, [named]).batch?.versions).toEqual([named])

    const armed = armLifecycleAttempt(staged, initial.batch.inFlight)
    const recorded = recordLifecycleArtifactOutcomes(
      armed,
      new Map(named.artifacts.map(({ key }) => [key, { outcome: 'ABSENT' as const }]))
    )
    const recovered = commitLifecycleBatchResults(recorded, [legacy], {
      objectVersions: 1,
      deleteMarkers: 0,
      bytes: 12,
    })
    expect(recovered.batch).toEqual({ versions: [legacy], inFlight: initial.batch.inFlight })
    expect(recovered.cursor).toBeUndefined()
  })

  test('freezes exact physical keys using the backend locator helper', () => {
    const physicalKey = withOptionalVersion('logs/example.json', 'version-a')
    expect(
      freezeLifecycleBatchVersion({
        name: 'logs/example.json',
        version: 'version-a',
        isDeleteMarker: false,
      })
    ).toEqual({
      name: 'logs/example.json',
      version: 'version-a',
      artifacts: [
        { key: physicalKey, outcome: 'UNRESOLVED' },
        { key: `${physicalKey}.info`, outcome: 'UNRESOLVED' },
      ],
    })

    expect(
      freezeLifecycleBatchVersion({
        name: 'deleted',
        version: randomUUID(),
        isDeleteMarker: true,
      }).artifacts
    ).toEqual([])
  })

  test('requires an armed attempt to complete a delete-marker batch', () => {
    const initial = validContinuation()
    const marker = freezeLifecycleBatchVersion({
      name: initial.pageEnd.name,
      version: randomUUID(),
      isDeleteMarker: true,
    })
    const staged = decodeLifecycleContinuation({
      ...initial,
      batch: { versions: [marker] },
    })

    expect(() => completeLifecycleBatch(staged)).toThrow('must be armed before completing')

    const armed = armLifecycleAttempt(staged, initial.batch.inFlight)
    const completed = completeLifecycleBatch(armed, {
      objectVersions: 0,
      deleteMarkers: 1,
      bytes: 0,
    })
    expect(completed.cursor).toEqual(staged.pageEnd)
    expect(completed.batch).toBeUndefined()
    expect(completed.counters).toEqual({
      ...staged.counters,
      deleteMarkersDeleted: 1,
      batchesCompleted: 1,
    })

    const filtered = filterStagedLifecycleBatch(staged, [])
    expect(filtered.cursor).toEqual(staged.pageEnd)
    expect(filtered.batch).toBeUndefined()
    expect(filtered.counters).toEqual({ ...staged.counters, batchesCompleted: 1 })
  })

  test('keeps one stable attempt as compensation authority across generation replacement', () => {
    const generation = randomUUID()
    const initial = createLifecycleContinuation({
      runId: randomUUID(),
      trigger: 'scheduled',
      generation,
      snapshotAt: '2026-08-15T00:00:00.000Z',
      mode: 'DELETE',
      topology: {
        scanKind: 'NONCURRENT',
        epoch: '1',
        shardId: 0,
        shardCount: 1,
      },
    })
    const candidate = freezeLifecycleBatchVersion({
      name: 'logs/example.json',
      version: randomUUID(),
      isDeleteMarker: false,
    })
    const staged = stageLifecycleBatch(initial, {
      pageEnd: { name: candidate.name, archivedAt: '2026-08-02T00:00:00.000Z' },
      rawRowsExamined: 1,
      versions: [candidate],
    })
    const attempt = {
      attemptId: randomUUID(),
      authorizedGeneration: generation,
      startedAt: '2026-08-15T00:01:00.000Z',
    }
    const armed = armLifecycleAttempt(staged, attempt)

    expect(armLifecycleAttempt(armed, attempt)).toBe(armed)
    expect(() => completeLifecycleBatch(armed)).toThrow('artifact compensation')

    const partiallyResolved = recordLifecycleArtifactOutcomes(
      armed,
      new Map([[candidate.artifacts[0].key, { outcome: 'DELETED' }]])
    )
    expect(partiallyResolved.batch?.inFlight).toEqual(attempt)
    expect(() => completeLifecycleBatch(partiallyResolved)).toThrow('artifact compensation')

    const resolved = recordLifecycleArtifactOutcomes(
      partiallyResolved,
      new Map([[candidate.artifacts[1].key, { outcome: 'ABSENT' }]])
    )
    expect(completeLifecycleBatch(resolved)).toMatchObject({
      cursor: staged.pageEnd,
      counters: { versionsExamined: 1, versionsEligible: 1, batchesCompleted: 1 },
    })
  })

  test('refreshes the exact artifact set from the locked row shape before arming', () => {
    const generation = randomUUID()
    const version = randomUUID()
    const staged = stageLifecycleBatch(
      createLifecycleContinuation({
        runId: randomUUID(),
        trigger: 'scheduled',
        generation,
        snapshotAt: '2026-08-15T00:00:00.000Z',
        mode: 'DELETE',
        topology: {
          scanKind: 'NONCURRENT',
          epoch: '1',
          shardId: 0,
          shardCount: 1,
        },
      }),
      {
        pageEnd: {
          name: 'deleted',
          archivedAt: '2026-08-02T00:00:00.000Z',
        },
        rawRowsExamined: 1,
        versions: [
          {
            name: 'deleted',
            version,
            artifacts: [
              { key: 'stale-artifact', outcome: 'UNRESOLVED' },
              { key: 'stale-artifact.info', outcome: 'UNRESOLVED' },
            ],
          },
        ],
      }
    )

    expect(
      refreshStagedLifecycleBatchArtifacts(staged, [
        { name: 'deleted', version, isDeleteMarker: true },
      ]).batch?.versions
    ).toEqual([{ name: 'deleted', version, artifacts: [] }])
  })

  test('rejects attempt replacement and cursor advancement with unresolved artifacts', () => {
    const continuation = decodeLifecycleContinuation(validContinuation())
    expect(() =>
      armLifecycleAttempt(continuation, {
        attemptId: randomUUID(),
        authorizedGeneration: continuation.generation,
        startedAt: '2026-08-15T00:01:00.000Z',
      })
    ).toThrow('different armed attempt')
    expect(() => completeLifecycleBatch(continuation)).toThrow('artifact compensation')
  })

  test('retains partial artifact success and records completed-version counters immediately', () => {
    const continuation = decodeLifecycleContinuation(validContinuation())
    const version = continuation.batch!.versions[0]
    const partial = recordLifecycleArtifactOutcomes(
      continuation,
      new Map([
        [version.artifacts[0].key, { outcome: 'DELETED' as const }],
        [version.artifacts[1].key, { outcome: 'FAILED' as const, error: 'retry me' }],
      ])
    )

    expect(() => completeLifecycleBatch(partial)).toThrow('artifact compensation')
    expect(
      commitLifecycleBatchResults(partial, [version], {
        objectVersions: 2,
        deleteMarkers: 1,
        bytes: 30,
      })
    ).toMatchObject({
      batch: {
        inFlight: partial.batch!.inFlight,
        versions: [
          {
            name: version.name,
            version: version.version,
            artifacts: [
              expect.objectContaining({ outcome: 'DELETED' }),
              expect.objectContaining({ outcome: 'FAILED' }),
            ],
          },
        ],
      },
      counters: {
        objectVersionsDeleted: 2,
        deleteMarkersDeleted: 1,
        bytesDeleted: 30,
        batchesCompleted: 0,
      },
    })
  })

  test.each([
    ['UNRESOLVED', 'UNRESOLVED'],
    ['DELETED', 'UNRESOLVED'],
    ['DELETED', 'FAILED'],
    ['ABSENT', 'FAILED'],
  ])('rejects dropping %s/%s artifacts while retaining another version', (main, sidecar) => {
    const input = validContinuation()
    const retained = input.batch.versions[0]
    input.counters.versionsExamined = 2
    input.counters.versionsEligible = 2
    input.batch.versions.push({
      name: 'logs/other.json',
      version: randomUUID(),
      artifacts: [
        { key: 'logs/other.json/version', outcome: main },
        { key: 'logs/other.json/version.info', outcome: sidecar },
      ],
    })
    const continuation = decodeLifecycleContinuation(input)

    expect(() =>
      commitLifecycleBatchResults(continuation, [retained], {
        objectVersions: 1,
        deleteMarkers: 0,
        bytes: 12,
      })
    ).toThrow('artifact compensation')
    expect(continuation).toEqual(input)
  })

  test('drains definitive all-failed versions and can filter an unarmed staged batch', () => {
    const armed = decodeLifecycleContinuation(validContinuation())
    const failed = recordLifecycleArtifactOutcomes(
      armed,
      new Map(
        armed.batch!.versions[0].artifacts.map((artifact) => [
          artifact.key,
          { outcome: 'FAILED' as const, error: 'not deleted' },
        ])
      )
    )
    expect(completeLifecycleBatch(failed)).toMatchObject({
      cursor: armed.pageEnd,
      counters: { batchesCompleted: 1 },
    })

    const staged = decodeLifecycleContinuation({
      ...validContinuation(),
      batch: { versions: armed.batch!.versions },
    })
    expect(filterStagedLifecycleBatch(staged, [])).toMatchObject({
      cursor: staged.pageEnd,
      counters: { batchesCompleted: 1 },
    })
  })
})
