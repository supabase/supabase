import type { Metadata } from 'next'

import { ApiSection } from './_components/ApiSection'
import { PermissionsSection } from './_components/PermissionsSection'
import { StorageContent } from './_components/StorageContent'

export const metadata: Metadata = {
  title: 'Storage | Supabase',
  description:
    'An open source S3 Compatible Object Store with unlimited scalability, for any file type.',
}

export default function StoragePage() {
  return <StorageContent apiSlot={<ApiSection />} permissionsSlot={<PermissionsSection />} />
}
