import { useState } from 'react'
import SqlLayout from '../components/layouts/SqlLayout'
import { Button, Typography } from '@supabase/ui'
import { useMetaStore } from '../store/postgres/MetaStore'

export default function Sql() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const meta = useMetaStore()

  async function runQuery(q: string) {
    setResults(null)
    setError(null)
    const { data, error } = await meta.query(q)
    if (error) {
      console.error('Error:', error)
      setError(error)
    } else {
      console.log('data', data)
      setResults(data)
    }
  }

  return (
    <SqlLayout title="SQL">
      <>
        <textarea
          className="w-full border-b"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="default" onClick={() => runQuery(query)}>
          Run
        </Button>
      </>
    </SqlLayout>
  )
}
