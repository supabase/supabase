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
        <DialogTitle>Add RLS policy</DialogTitle>
        <DialogDescription>
          We recommend adding a Row Level Security (RLS) policy for your Firebase JWT keys to
          explicitly specify which tables can be accessed via the Data APIs in order to prevent
          accidental exposure of data.
        </DialogDescription>
      </DialogHeader>
      <DialogSectionSeparator />
      <DialogSection padding={'small'}>
        <SQLCodeBlock projectRef={projectRef!}>{[description]}</SQLCodeBlock>
      </DialogSection>
      <DialogFooter padding={'small'}>
        <Button
          type="default"
          onClick={() => handleCopy(description)}
          icon={copied ? <Check className="text-brand-600" /> : null}
        >
          {copied ? <p>Copied</p> : <p>Copy code</p>}
        </Button>
        <Button type="primary">
          <Link
            href={`/project/${projectRef}/sql/new?content=${encodeURIComponent(description)}`}
            passHref
          >
            Open in SQL Editor
          </Link>
        </Button>
      </DialogFooter>
    </>
  )
}
