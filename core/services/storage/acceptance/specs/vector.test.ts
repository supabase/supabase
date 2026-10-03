import { randomUUID } from 'node:crypto'
import { describeAcceptance, getAcceptanceConfig } from '../support/config'
import { createRestClient } from '../support/http'
import { requireServiceKey } from '../support/resources'

interface VectorListBucketsResponse {
  nextToken?: string
  vectorBuckets?: Array<{ vectorBucketName?: string }>
}

interface VectorListIndexesResponse {
  indexes?: Array<{ indexName?: string }>
  nextToken?: string
}

interface VectorResponse {
  distanceMetric?: string
  nextToken?: string
  vectors?: Array<{
    data?: { float32?: number[] }
    distance?: number
    key?: string
    metadata?: Record<string, unknown>
  }>
}

function fixedLengthVectorKey(prefix: string, length: number): string {
  if (prefix.length > length) {
    throw new Error(`Vector key prefix is longer than ${length} characters`)
  }

  return `${prefix}${'x'.repeat(length - prefix.length)}`
}

describeAcceptance(
  'vector API contract',
  {
    destructive: true,
    profiles: ['full'],
    requires: ['vector'],
  },
  () => {
    it('covers vector bucket, index, put/get/list/query/delete lifecycle', async () => {
      const config = getAcceptanceConfig()
      const client = createRestClient()
      const token = requireServiceKey(config)
      const maxQueryTopK = config.vectorBucketProvider === 'pgvector' ? 100 : 10_000
      const suffix = randomUUID().replace(/-/g, '').slice(0, 12)
      const vectorPrefix = `${config.resourcePrefix.slice(0, 24)}-vec-${suffix}`.slice(0, 41)
      const vectorBucketName = `${vectorPrefix}-a`
      const secondaryVectorBucketName = `${vectorPrefix}-b`
      const indexName = `idx-${suffix}-a`
      const secondaryIndexName = `idx-${suffix}-b`
      const defaultPageIndexName = `bulk-${suffix}`
      const vectorKeys = [`vec-a-${suffix}`, `vec-b-${suffix}`]
      const maxLengthVectorKey = fixedLengthVectorKey(`vec-max-${suffix}-`, 1024)
      const tooLongVectorKey = fixedLengthVectorKey(`vec-too-long-${suffix}-`, 1025)
      const defaultPageVectorKeys = [
        maxLengthVectorKey,
        ...Array.from({ length: 127 }, (_, i) => `bulk-${i.toString().padStart(3, '0')}-${suffix}`),
      ]
      const euclideanVectorKeys = [
        `vec-origin-${suffix}`,
        `vec-near-${suffix}`,
        `vec-far-${suffix}`,
      ]
      const euclideanDistractorVectorKeys = Array.from(
        { length: 32 },
        (_, i) => `vec-far-${i.toString().padStart(2, '0')}-${suffix}`
      )

      try {
        await client.request('POST', '/vector/CreateVectorBucket', {
          body: {
            vectorBucketName,
          },
          expectedStatus: 200,
          token,
        })

        await client.request('POST', '/vector/CreateVectorBucket', {
          body: {
            vectorBucketName: secondaryVectorBucketName,
          },
          expectedStatus: 200,
          token,
        })

        const buckets = await client.request<VectorListBucketsResponse>(
          'POST',
          '/vector/ListVectorBuckets',
          {
            body: {
              maxResults: 1,
              prefix: vectorPrefix,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(buckets.json?.vectorBuckets).toHaveLength(1)
        expect(buckets.json?.nextToken).toBeTruthy()

        const bucketsSecondPage = await client.request<VectorListBucketsResponse>(
          'POST',
          '/vector/ListVectorBuckets',
          {
            body: {
              maxResults: 1,
              nextToken: buckets.json?.nextToken,
              prefix: vectorPrefix,
            },
            expectedStatus: 200,
            token,
          }
        )
        const listedBucketNames = [
          ...(buckets.json?.vectorBuckets ?? []),
          ...(bucketsSecondPage.json?.vectorBuckets ?? []),
        ].map((bucket) => bucket.vectorBucketName)
        expect(listedBucketNames).toEqual(
          expect.arrayContaining([vectorBucketName, secondaryVectorBucketName])
        )

        await client.request('POST', '/vector/GetVectorBucket', {
          body: {
            vectorBucketName,
          },
          expectedStatus: 200,
          token,
        })

        await client.request('POST', '/vector/CreateIndex', {
          body: {
            dataType: 'float32',
            dimension: 2,
            distanceMetric: 'cosine',
            indexName,
            metadataConfiguration: {
              nonFilterableMetadataKeys: ['private-note'],
            },
            vectorBucketName,
          },
          expectedStatus: 200,
          token,
        })

        await client.request('POST', '/vector/CreateIndex', {
          body: {
            dataType: 'float32',
            dimension: 2,
            distanceMetric: 'euclidean',
            indexName: secondaryIndexName,
            vectorBucketName,
          },
          expectedStatus: 200,
          token,
        })

        await client.request('POST', '/vector/CreateIndex', {
          body: {
            dataType: 'float32',
            dimension: 2,
            distanceMetric: 'cosine',
            indexName: defaultPageIndexName,
            vectorBucketName,
          },
          expectedStatus: 200,
          token,
        })

        const indexes = await client.request<VectorListIndexesResponse>(
          'POST',
          '/vector/ListIndexes',
          {
            body: {
              maxResults: 1,
              prefix: `idx-${suffix}`,
              vectorBucketName,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(indexes.json?.indexes).toHaveLength(1)
        expect(indexes.json?.nextToken).toBeTruthy()

        const indexesSecondPage = await client.request<VectorListIndexesResponse>(
          'POST',
          '/vector/ListIndexes',
          {
            body: {
              maxResults: 1,
              nextToken: indexes.json?.nextToken,
              prefix: `idx-${suffix}`,
              vectorBucketName,
            },
            expectedStatus: 200,
            token,
          }
        )
        const listedIndexNames = [
          ...(indexes.json?.indexes ?? []),
          ...(indexesSecondPage.json?.indexes ?? []),
        ].map((index) => index.indexName)
        expect(listedIndexNames).toEqual(expect.arrayContaining([indexName, secondaryIndexName]))

        await client.request('POST', '/vector/GetIndex', {
          body: {
            indexName,
            vectorBucketName,
          },
          expectedStatus: 200,
          token,
        })

        await client.request('POST', '/vector/PutVectors', {
          body: {
            indexName,
            vectorBucketName,
            vectors: [
              {
                data: {
                  float32: [1, 0],
                },
                key: vectorKeys[0],
                metadata: {
                  group: 'acceptance',
                  'private-note': `private-${suffix}-a`,
                  role: 'primary',
                  score: 0.75,
                  'user-id': `user-${suffix}-a`,
                },
              },
              {
                data: {
                  float32: [0, 1],
                },
                key: vectorKeys[1],
                metadata: {
                  group: 'acceptance',
                  role: 'secondary',
                  score: 10,
                  'user-id': `user-${suffix}-b`,
                },
              },
            ],
          },
          expectedStatus: 200,
          token,
        })

        const vectors = await client.request<VectorResponse>('POST', '/vector/ListVectors', {
          body: {
            indexName,
            maxResults: 1,
            returnData: true,
            returnMetadata: true,
            vectorBucketName,
          },
          expectedStatus: 200,
          token,
        })
        expect(vectors.json?.vectors).toHaveLength(1)
        expect(vectors.json?.nextToken).toBeTruthy()

        const vectorsSecondPage = await client.request<VectorResponse>(
          'POST',
          '/vector/ListVectors',
          {
            body: {
              indexName,
              maxResults: 1,
              nextToken: vectors.json?.nextToken,
              returnData: true,
              returnMetadata: true,
              vectorBucketName,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(
          [...(vectors.json?.vectors ?? []), ...(vectorsSecondPage.json?.vectors ?? [])].map(
            (vector) => vector.key
          )
        ).toEqual(expect.arrayContaining(vectorKeys))
        expect(vectorsSecondPage.json?.nextToken).toBeUndefined()

        await client.request('POST', '/vector/PutVectors', {
          body: {
            indexName: defaultPageIndexName,
            vectorBucketName,
            vectors: defaultPageVectorKeys.map((key, i) => ({
              data: {
                // Offset by 1 so no vector has zero norm, which a cosine index rejects.
                float32: [i + 1, 0],
              },
              key,
            })),
          },
          expectedStatus: 200,
          token,
        })

        const defaultPageVectors = await client.request<VectorResponse>(
          'POST',
          '/vector/ListVectors',
          {
            body: {
              indexName: defaultPageIndexName,
              vectorBucketName,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(defaultPageVectors.json?.vectors).toHaveLength(defaultPageVectorKeys.length)
        expect(defaultPageVectors.json?.nextToken).toBeUndefined()
        expect(defaultPageVectors.json?.vectors?.map((vector) => vector.key)).toEqual(
          expect.arrayContaining(defaultPageVectorKeys)
        )

        await client.request('POST', '/vector/PutVectors', {
          body: {
            indexName: defaultPageIndexName,
            vectorBucketName,
            vectors: [
              {
                data: {
                  float32: [0, 0],
                },
              },
            ],
          },
          expectedStatus: 400,
          token,
        })

        await client.request('POST', '/vector/PutVectors', {
          body: {
            indexName: defaultPageIndexName,
            vectorBucketName,
            vectors: [
              {
                data: {
                  float32: [0, 0],
                },
                key: tooLongVectorKey,
              },
            ],
          },
          expectedStatus: 400,
          token,
        })

        const largePageVectors = await client.request<VectorResponse>(
          'POST',
          '/vector/ListVectors',
          {
            body: {
              indexName,
              maxResults: 1000,
              vectorBucketName,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(largePageVectors.json?.vectors?.map((vector) => vector.key)).toEqual(
          expect.arrayContaining(vectorKeys)
        )

        const segmentedVectors = await Promise.all(
          [0, 1].map((segmentIndex) =>
            client.request<VectorResponse>('POST', '/vector/ListVectors', {
              body: {
                indexName,
                maxResults: 1000,
                segmentCount: 2,
                segmentIndex,
                vectorBucketName,
              },
              expectedStatus: 200,
              token,
            })
          )
        )
        const segmentedKeys = segmentedVectors.flatMap(
          (segment) => segment.json?.vectors?.map((vector) => vector.key ?? '') ?? []
        )
        expect(new Set(segmentedKeys).size).toBe(segmentedKeys.length)
        expect(segmentedKeys).toEqual(expect.arrayContaining(vectorKeys))

        const fetched = await client.request<VectorResponse>('POST', '/vector/GetVectors', {
          body: {
            indexName,
            keys: vectorKeys,
            returnData: true,
            returnMetadata: true,
            vectorBucketName,
          },
          expectedStatus: 200,
          token,
        })
        expect(fetched.json?.vectors?.map((vector) => vector.key)).toEqual(
          expect.arrayContaining(vectorKeys)
        )
        const fetchedPrimary = fetched.json?.vectors?.find((vector) => vector.key === vectorKeys[0])
        expect(fetchedPrimary?.metadata).toMatchObject({
          group: 'acceptance',
          role: 'primary',
          score: 0.75,
          'user-id': `user-${suffix}-a`,
        })
        expect(fetchedPrimary?.data?.float32?.[0]).toBeCloseTo(1, 5)
        expect(fetchedPrimary?.data?.float32?.[1]).toBeCloseTo(0, 5)

        await client.request('POST', '/vector/GetVectors', {
          body: {
            indexName,
            keys: Array.from({ length: 101 }, (_, i) => `missing-${i}-${suffix}`),
            vectorBucketName,
          },
          expectedStatus: 400,
          token,
        })

        const query = await client.request<VectorResponse>('POST', '/vector/QueryVectors', {
          body: {
            filter: {
              group: 'acceptance',
            },
            indexName,
            queryVector: {
              float32: [1, 0],
            },
            returnDistance: true,
            returnMetadata: true,
            topK: 2,
            vectorBucketName,
          },
          expectedStatus: 200,
          token,
        })
        expect(query.json?.vectors?.map((vector) => vector.key)).toContain(vectorKeys[0])

        const maxTopKQuery = await client.request<VectorResponse>('POST', '/vector/QueryVectors', {
          body: {
            filter: {
              group: 'acceptance',
            },
            indexName,
            queryVector: {
              float32: [1, 0],
            },
            topK: maxQueryTopK,
            vectorBucketName,
          },
          expectedStatus: 200,
          token,
        })
        expect(maxTopKQuery.json?.vectors?.map((vector) => vector.key)).toContain(vectorKeys[0])

        await client.request('POST', '/vector/QueryVectors', {
          body: {
            indexName,
            queryVector: {
              float32: [1, 0],
            },
            topK: maxQueryTopK + 1,
            vectorBucketName,
          },
          expectedStatus: 400,
          token,
        })

        if (config.vectorBucketProvider === 'pgvector') {
          await client.request('POST', '/vector/QueryVectors', {
            body: {
              indexName,
              nextToken: 'next-page-token',
              queryVector: {
                float32: [1, 0],
              },
              topK: 2,
              vectorBucketName,
            },
            expectedStatus: 400,
            token,
          })
        } else {
          const paginatedQueryBody = {
            indexName: defaultPageIndexName,
            queryVector: {
              float32: [1, 0],
            },
            topK: defaultPageVectorKeys.length,
            vectorBucketName,
          }
          const firstQueryPage = await client.request<VectorResponse>(
            'POST',
            '/vector/QueryVectors',
            {
              body: paginatedQueryBody,
              expectedStatus: 200,
              token,
            }
          )
          expect(firstQueryPage.json?.vectors).toHaveLength(100)
          expect(firstQueryPage.json?.nextToken).toBeTruthy()

          const secondQueryPage = await client.request<VectorResponse>(
            'POST',
            '/vector/QueryVectors',
            {
              body: {
                ...paginatedQueryBody,
                nextToken: firstQueryPage.json?.nextToken,
              },
              expectedStatus: 200,
              token,
            }
          )
          expect(secondQueryPage.json?.vectors).toHaveLength(28)
          expect(secondQueryPage.json?.nextToken).toBeUndefined()

          const paginatedQueryKeys = [
            ...(firstQueryPage.json?.vectors ?? []),
            ...(secondQueryPage.json?.vectors ?? []),
          ].map((vector) => vector.key)
          expect(paginatedQueryKeys).toHaveLength(defaultPageVectorKeys.length)
          expect(new Set(paginatedQueryKeys).size).toBe(defaultPageVectorKeys.length)
          expect(paginatedQueryKeys).toEqual(expect.arrayContaining(defaultPageVectorKeys))
        }

        const hyphenKeyFilter = await client.request<VectorResponse>(
          'POST',
          '/vector/QueryVectors',
          {
            body: {
              filter: {
                'user-id': `user-${suffix}-a`,
              },
              indexName,
              queryVector: {
                float32: [1, 0],
              },
              returnMetadata: true,
              topK: 2,
              vectorBucketName,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(hyphenKeyFilter.json?.vectors?.map((vector) => vector.key)).toEqual([vectorKeys[0]])
        expect(hyphenKeyFilter.json?.vectors?.[0]?.distance).toBeUndefined()

        await client.request('POST', '/vector/QueryVectors', {
          body: {
            filter: {
              'private-note': `private-${suffix}-a`,
            },
            indexName,
            queryVector: {
              float32: [1, 0],
            },
            topK: 2,
            vectorBucketName,
          },
          expectedStatus: 400,
          token,
        })

        const numericFilter = await client.request<VectorResponse>('POST', '/vector/QueryVectors', {
          body: {
            filter: {
              score: {
                $gte: 5,
              },
            },
            indexName,
            queryVector: {
              float32: [1, 0],
            },
            returnMetadata: true,
            topK: 2,
            vectorBucketName,
          },
          expectedStatus: 200,
          token,
        })
        expect(numericFilter.json?.vectors?.map((vector) => vector.key)).toEqual([vectorKeys[1]])

        await client.request('POST', '/vector/PutVectors', {
          body: {
            indexName: secondaryIndexName,
            vectorBucketName,
            vectors: [
              {
                data: {
                  float32: [0, 0],
                },
                key: euclideanVectorKeys[0],
              },
              {
                data: {
                  float32: [3, 4],
                },
                key: euclideanVectorKeys[1],
              },
              {
                data: {
                  float32: [8, 15],
                },
                key: euclideanVectorKeys[2],
              },
              ...euclideanDistractorVectorKeys.map((key, i) => ({
                data: {
                  float32: [100 + i, -100 - i],
                },
                key,
              })),
            ],
          },
          expectedStatus: 200,
          token,
        })

        const euclideanQuery = await client.request<VectorResponse>(
          'POST',
          '/vector/QueryVectors',
          {
            body: {
              indexName: secondaryIndexName,
              queryVector: {
                float32: [0, 0],
              },
              returnDistance: true,
              topK: 3,
              vectorBucketName,
            },
            expectedStatus: 200,
            token,
          }
        )
        expect(euclideanQuery.json?.distanceMetric).toBe('euclidean')
        expect(euclideanQuery.json?.vectors?.map((vector) => vector.key)).toEqual(
          euclideanVectorKeys
        )
        // Backends differ on the euclidean convention: pgvector's `<->` returns the true L2
        // distance, while the S3 Vectors engine returns the squared L2 distance. Both preserve
        // ordering (squaring is monotonic for non-negative values). Detect the convention from
        // the first neighbor, then require the rest to be consistent with it.
        const nearDistance = euclideanQuery.json?.vectors?.[1]?.distance ?? Number.NaN
        const farDistance = euclideanQuery.json?.vectors?.[2]?.distance ?? Number.NaN
        const squaredDistance = Math.abs(nearDistance - 25) < Math.abs(nearDistance - 5)
        expect(euclideanQuery.json?.vectors?.[0]?.distance).toBeCloseTo(0, 5)
        expect(nearDistance).toBeCloseTo(squaredDistance ? 25 : 5, 3)
        expect(farDistance).toBeCloseTo(squaredDistance ? 289 : 17, 3)

        await client.request('POST', '/vector/DeleteVectors', {
          body: {
            indexName,
            keys: Array.from({ length: 501 }, (_, i) => `missing-${i}-${suffix}`),
            vectorBucketName,
          },
          expectedStatus: 400,
          token,
        })

        await client.request('POST', '/vector/DeleteVectors', {
          body: {
            indexName,
            keys: vectorKeys,
            vectorBucketName,
          },
          expectedStatus: 200,
          token,
        })
      } finally {
        await client
          .request('POST', '/vector/DeleteIndex', {
            body: {
              indexName,
              vectorBucketName,
            },
            expectedStatus: [200, 400, 404],
            token,
          })
          .catch(() => undefined)
        await client
          .request('POST', '/vector/DeleteIndex', {
            body: {
              indexName: secondaryIndexName,
              vectorBucketName,
            },
            expectedStatus: [200, 400, 404],
            token,
          })
          .catch(() => undefined)
        await client
          .request('POST', '/vector/DeleteIndex', {
            body: {
              indexName: defaultPageIndexName,
              vectorBucketName,
            },
            expectedStatus: [200, 400, 404],
            token,
          })
          .catch(() => undefined)
        await client
          .request('POST', '/vector/DeleteVectorBucket', {
            body: {
              vectorBucketName,
            },
            expectedStatus: [200, 400, 404],
            token,
          })
          .catch(() => undefined)
        await client
          .request('POST', '/vector/DeleteVectorBucket', {
            body: {
              vectorBucketName: secondaryVectorBucketName,
            },
            expectedStatus: [200, 400, 404],
            token,
          })
          .catch(() => undefined)
      }
    })
  }
)
