import { describe, it, expect } from 'vitest'
import {
  getSelfHostedPoolerStrings,
  getSelfHostedDirectStrings,
  getConnectionStrings,
} from './DatabaseSettings.utils'

describe('DatabaseSettings.utils', () => {
  describe('getSelfHostedPoolerStrings', () => {
    it('generates correct strings for self-hosted pooler', () => {
      const result = getSelfHostedPoolerStrings('my-host', 5432, 'my-db')
      expect(result.uri).toBe('postgresql://postgres.[POOLER_TENANT_ID]:[YOUR-PASSWORD]@my-host:5432/my-db')
      expect(result.psql).toBe("psql 'postgresql://postgres.[POOLER_TENANT_ID]:[YOUR-PASSWORD]@my-host:5432/my-db'")
      expect(result.nodejs).toBe('DATABASE_URL=postgresql://postgres.[POOLER_TENANT_ID]:[YOUR-PASSWORD]@my-host:5432/my-db')
    })
  })

  describe('getSelfHostedDirectStrings', () => {
    it('generates correct strings for self-hosted direct', () => {
      const result = getSelfHostedDirectStrings('my-host', 5432, 'my-db')
      expect(result.uri).toBe('postgresql://postgres:[YOUR-PASSWORD]@my-host:5432/my-db')
      expect(result.psql).toBe("psql 'postgresql://postgres:[YOUR-PASSWORD]@my-host:5432/my-db'")
    })
  })

  describe('getConnectionStrings', () => {
    const connectionInfo = {
      db_user: 'postgres',
      db_port: 5432,
      db_host: 'db.project.supabase.co',
      db_name: 'postgres',
    }
    const poolingInfo = {
      connectionString: 'postgresql://postgres.project:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
      db_user: 'postgres.project',
      db_port: 6543,
      db_host: 'aws-0-us-east-1.pooler.supabase.com',
      db_name: 'postgres',
    }
    const metadata = { projectRef: 'project' }

    it('generates correct strings for platform (md5)', () => {
      const result = getConnectionStrings({ connectionInfo, poolingInfo, metadata })
      
      expect(result.direct.uri).toBe('postgresql://postgres:[YOUR-PASSWORD]@db.project.supabase.co:5432/postgres')
      expect(result.pooler.uri).toBe(poolingInfo.connectionString)
      expect(result.pooler.psql).toContain('options=reference%3Dproject')
    })

    it('generates correct strings for platform (non-md5)', () => {
      const nonMd5PoolingInfo = {
        ...poolingInfo,
        connectionString: 'postgresql://postgres.project:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
      }
      // Assuming non-md5 doesn't have options=reference in the connection string
      const result = getConnectionStrings({ 
        connectionInfo, 
        poolingInfo: { ...nonMd5PoolingInfo, connectionString: 'postgresql://postgres.project:[YOUR-PASSWORD]@host:6543/db' }, 
        metadata 
      })
      
      expect(result.pooler.psql).toBe('psql -h host -p 6543 -d db -U postgres.project')
    })
  })
})
