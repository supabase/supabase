import { Button } from '@ui/components/shadcn/ui/button'
import { Input } from '@ui/components/shadcn/ui/input'
import { DocsLayout } from 'components/layouts'
import { useState } from 'react'
import type { NextPageWithLayout } from 'types'
import SqlToRest from 'ui-patterns/SqlToRest'

const AiAPIPage: NextPageWithLayout = () => {
  const [sql, setSql] = useState('')
  const [showSql, setShowSql] = useState(false)

  return (
    <div className="flex flex-col items-center">
      <div className="p-4 flex flex-col gap-4 max-w-4xl w-1/2">
        <h1>AI API Generator</h1>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            const inputElement =
              (e.target instanceof HTMLFormElement && e.target.querySelector('input')) || undefined

            if (!inputElement) {
              throw new Error('Missing input element in form')
            }

            const prompt = inputElement.value

            const response = await fetch('/api/ai/sql/generate-postgrest', {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                prompt,
              }),
            })

            const { sql } = await response.json()

            setSql(sql)
          }}
        >
          <span className="text-sm">What would you like to fetch from the API?</span>
          <Input
            placeholder="Books and their authors sorted by author name descending"
            defaultValue="Books and their authors sorted by author name descending"
          />
        </form>
        <Button className="max-w-40 text-xs" onClick={() => setShowSql((current) => !current)}>
          [Debug] {showSql ? 'Hide' : 'Show'} SQL
        </Button>
        <SqlToRest value={sql} hideSql={!showSql} />
      </div>
    </div>
  )
}

AiAPIPage.getLayout = (page) => <DocsLayout title="Generate API requests">{page}</DocsLayout>

export default AiAPIPage
