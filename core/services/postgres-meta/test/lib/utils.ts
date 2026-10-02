import { afterAll } from 'vitest'
import { PostgresMeta } from '../../src/lib'

export const TEST_CONNECTION_STRING = 'postgresql://postgres:postgres@localhost:5432'

export const pgMeta = new PostgresMeta({
  max: 1,
  connectionString: TEST_CONNECTION_STRING,
})

afterAll(() => pgMeta.end())
