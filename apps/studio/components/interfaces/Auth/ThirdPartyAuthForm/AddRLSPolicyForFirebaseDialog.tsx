import { copyToClipboard } from 'lib/helpers'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Button,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import { SQLCodeBlock } from './SqlCodeBlock'

export const AddRLSPolicyForFirebaseDialog = ({
  projectRef,
  firebaseProjectId,
}: {
  visible: boolean
  projectRef: string
  firebaseProjectId: string
}) => {
  const description = `create policy 
  "Restrict access to Firebase Auth for project ID ${firebaseProjectId}" 
  on table_name 
  as restrictive 
  to authenticated using (
  (
    auth.jwt()->>'iss' = 'https://${projectRef}.supabase.co/auth/v1'
  )
  or (
    auth.jwt()->>'iss' = 'https://securetoken.google.com/${firebaseProjectId}'
    and auth.jwt()->>'aud' = '${firebaseProjectId}'
  )
);`

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  function handleCopy(formatted: string) {
    copyToClipboard(formatted, () => setCopied(true))
  }

  return (
    <>
      <DialogHeader padding={'small'}>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>
          Make changes to your profile here. Click save when you're done.
        </DialogDescription>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection className="space-y-4" padding={'small'}>
        <SQLCodeBlock projectRef={projectRef!}>{[description]}</SQLCodeBlock>
      </DialogSection>
      <DialogFooter padding={'small'}>
        <Button
          type="default"
          onClick={() => handleCopy(description)}
          icon={copied ? <Check size={16} className="text-brand-600" /> : null}
        >
          {copied ? <p>Copied</p> : <p>Copy code</p>}
        </Button>
        <Link
          href={`/project/${projectRef}/sql/new?content=${encodeURIComponent(description)}`}
          passHref
        >
          <Button type="primary">Open in SQL Editor</Button>
        </Link>
      </DialogFooter>
    </>
  )
}
