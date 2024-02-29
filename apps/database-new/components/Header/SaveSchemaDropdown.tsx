'use client'

import { getAppStateSnapshot } from '@/lib/state'
import { SITE_URL } from '@ui/lib/constants'
import { Share } from 'lucide-react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
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
  const params = useParams()

  const thread_id = params.thread_id as string

  const copyToClipboard = () => {
    const snap = getAppStateSnapshot()
    const focused = window.document.hasFocus()
    if (focused) {
      window.navigator?.clipboard?.writeText(snap.selectedCode)
    } else {
      console.warn('Unable to copy to clipboard')
    }
  }

  const shareSchema = () => {
    console.log({ params })
    const shareUrl = SITE_URL + '/t/' + thread_id.substring(0, 8)
    const focused = window.document.hasFocus()
    if (focused) {
      window.navigator?.clipboard?.writeText(shareUrl)
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
        <DropdownMenuItem className="space-x-2" onClick={() => shareSchema()}>
          <Share size={14} strokeWidth={1.5} className="text-lighter" />
          <p>Share Schema</p>
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
