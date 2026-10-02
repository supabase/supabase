import { promises as fs } from 'fs'
import path from 'path'
import { Client } from 'pg'

const migrations = ['01-auth-schema.sql', '02-dummy-data.sql']

void (async () => {
  const dbConfig = {
    connectionString: process.env.DATABASE_URL,
  }
  const client = new Client(dbConfig)
  await client.connect()

  try {
    for (const migrationName of migrations) {
      const dummyDataFile = path.resolve(__dirname, migrationName)
      const data = await fs.readFile(dummyDataFile, 'utf-8')
      await client.query(data)
    }
  } finally {
    await client.end()
  }
})()
