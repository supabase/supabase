'use client'

import { getAppStateSnapshot } from '@/lib/state'
import Image from 'next/image'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconChevronDown,
  IconClipboard,
  IconDownload,
} from 'ui'

const SaveSchemaDropdown = () => {
  const copyToClipboard = () => {
    const snap = getAppStateSnapshot()
    const focused = window.document.hasFocus()
    if (focused) {
      window.navigator?.clipboard?.writeText(snap.selectedCode)
    } else {
      console.warn('Unable to copy to clipboard')
    }
  }

  const downloadSQL = () => {
    const snap = getAppStateSnapshot()
    const blob = new Blob([snap.selectedCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'migration.sql'
    link.href = url
    link.click()
  }

  const loadSQLInSupabase = () => {
    const snap = getAppStateSnapshot()
    window.open(
      `https://supabase.com/dashboard/project/_/sql?content=${encodeURIComponent(
        snap.selectedCode
      )}`,
      '_blank'
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type="default" iconRight={<IconChevronDown />}>
          Save schema
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44" align="end">
        <DropdownMenuItem className="space-x-2" onClick={() => copyToClipboard()}>
          <IconClipboard size={14} strokeWidth={1.5} className="text-lighter" />
          <p>Copy SQL</p>
        </DropdownMenuItem>
        <DropdownMenuItem className="space-x-2" onClick={() => downloadSQL()}>
          <IconDownload size={14} strokeWidth={1.5} className="text-lighter" />
          <p>Download SQL</p>
        </DropdownMenuItem>
        <DropdownMenuItem className="space-x-2" onClick={() => loadSQLInSupabase()}>
          <Image alt="supabase" src="/supabase.png" width={14} height={14} />
          <p>Load SQL in Supabase</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SaveSchemaDropdown
