import { useState } from 'react'
import { useRouter } from 'next/router'
import { Button, IconLoader } from '@supabase/ui'

import { useStore } from 'hooks'
import AutoTextArea from 'components/to-be-cleaned/forms/AutoTextArea'
import { timeout } from 'lib/helpers'

// Removes some auto-generated Postgrest text
// Ideally PostgREST wouldn't add this if there is already a comment
const temp_removePostgrestText = (content) => {
  const postgrestTextPk = `Note:\nThis is a Primary Key.<pk/>`
  const postgrestTextFk = `Note:\nThis is a Foreign Key to`
  const pkTextPos = content.lastIndexOf(postgrestTextPk)
  const fkTextPos = content.lastIndexOf(postgrestTextFk)

  let cleansed = content
  if (pkTextPos >= 0) cleansed = cleansed.substring(0, pkTextPos)
  if (fkTextPos >= 0) cleansed = cleansed.substring(0, fkTextPos)
  return cleansed
}

export default function Description({ content, metadata, onChange = () => {} }) {
  const router = useRouter()
  const { meta } = useStore()

  const contentText = temp_removePostgrestText(content || '').trim()
  const [value, setValue] = useState(contentText)
  const [isUpdating, setIsUpdating] = useState(false)

  const { ref } = router.query
  const { table, column, rpc } = metadata

  const hasChanged = value != contentText
  const animateCss = `transition duration-150`
  const buttonCss = `inline-block text-sm border text-white font-bold rounded py-1 px-3 w-20 cursor-pointer`
  const primaryCss = `${buttonCss} ${animateCss} bg-gray-500 border-gray-400 hover:border-green-500 hover:bg-green-500 `
  const secondaryCss = `${buttonCss} ${animateCss} bg-gray-500 border-gray-400 hover:border-red-500 hover:bg-red-500 `

  const updateDescription = async () => {
    if (isUpdating) return false
    try {
      setIsUpdating(true)
      let query = ''
      let description = value.replaceAll("'", "''")
      if (table && column)
        query = `comment on column public.${table}.${column} is '${description}';`
      if (table && !column) query = `comment on table public.${table} is '${description}';`
      if (rpc) query = `comment on function ${rpc} is '${description}';`

      if (query) {
        await meta.query(query)
        // [Joshen] Temp fix, immediately refreshing the docs fetches stale state
        await timeout(500)
      }

      onChange(value)
    } catch (error) {
      console.error('Update description error:', error)
    } finally {
      setIsUpdating(false)
    }
  }
  return (
    <div className="space-y-2">
      <AutoTextArea
        className="w-full"
        placeholder="Click to edit."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div
        className={`flex items-center gap-2 ${
          hasChanged ? 'opacity-100' : 'opacity-0 cursor-default h-0'
        } ${animateCss}`}
      >
        <Button
          type="default"
          disabled={!hasChanged}
          onClick={() => {
            setValue(contentText)
            setIsUpdating(false)
          }}
        >
          Cancel
        </Button>
        <Button disabled={!hasChanged} onClick={updateDescription}>
          {isUpdating ? (
            <IconLoader className="animate-spin mx-auto" size={14} strokeWidth={2} />
          ) : (
            <span>Save</span>
          )}
        </Button>
      </div>
    </div>
  )
}
