'use client'
import Link from 'next/link'

import { useParams } from 'next/navigation'
import { Button } from 'ui'

import SaveSchemaDropdown from './SaveSchemaDropdown'
import ToggleCodeEditorButton from './ToggleCodeEditorButton'

const HeaderActions = () => {
  const params = useParams()

  return (
    <div className="flex items-center gap-x-2">
      {params.thread_id && (
        <div className="hidden xl:flex items-center gap-x-2">
          <ToggleCodeEditorButton />
          <SaveSchemaDropdown />
          <div className="border-r py-3" />
        </div>
      )}

      <Button type="default" className="hidden xl:block">
        <Link href="/">New conversation</Link>
      </Button>
    </div>
  )
}

export default HeaderActions
