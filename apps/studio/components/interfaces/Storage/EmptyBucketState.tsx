import { BucketPlus } from 'icons'
import { EmptyStatePresentational } from 'ui-patterns'

import { QuickStartSnippet } from '@/components/ui/QuickStartSnippet'
import { CreateBucketButton } from './NewBucketButton'
import { BUCKET_TYPES } from './Storage.constants'

interface EmptyBucketStateProps {
  bucketType: keyof typeof BUCKET_TYPES
  className?: string
  onCreateBucket: () => void
}

// First-upload snippet shown beneath the "Create bucket" CTA. This is a
// teach-first nudge so the empty state doubles as the first paragraph of
// the docs — a user who lands here without having read anything can copy
// this, swap one identifier, and watch a file land in their bucket.
const FILES_BUCKET_UPLOAD_SNIPPET = `import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const { data, error } = await supabase
  .storage
  .from('your-bucket')
  .upload('hello.txt', file)`

const ANALYTICS_BUCKET_QUERY_SNIPPET = `import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Run an Iceberg-compatible analytics query against your bucket
const { data, error } = await supabase
  .from('your-bucket.your-table')
  .select('*')
  .limit(10)`

const VECTORS_BUCKET_QUERY_SNIPPET = `import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Search your vector bucket for the K nearest neighbours of an embedding
const { data, error } = await supabase
  .schema('vectors')
  .from('your-bucket')
  .select('id, content')
  .limit(10)`

const SNIPPETS_BY_BUCKET_TYPE: Record<
  keyof typeof BUCKET_TYPES,
  { caption: string; snippet: string }
> = {
  files: {
    caption: 'Or upload your first file from your app:',
    snippet: FILES_BUCKET_UPLOAD_SNIPPET,
  },
  analytics: {
    caption: 'Or query an analytics bucket from your app:',
    snippet: ANALYTICS_BUCKET_QUERY_SNIPPET,
  },
  vectors: {
    caption: 'Or query a vector bucket from your app:',
    snippet: VECTORS_BUCKET_QUERY_SNIPPET,
  },
}

export const EmptyBucketState = ({
  bucketType,
  className,
  onCreateBucket,
}: EmptyBucketStateProps) => {
  const config = BUCKET_TYPES[bucketType]
  const quickStart = SNIPPETS_BY_BUCKET_TYPE[bucketType]

  return (
    <EmptyStatePresentational
      icon={BucketPlus}
      title={`Create ${config.article} ${config.singularName} bucket`}
      description={config.valueProp}
      className={className}
    >
      <CreateBucketButton onClick={onCreateBucket} />
      {quickStart ? (
        <QuickStartSnippet
          caption={quickStart.caption}
          snippet={quickStart.snippet}
          language="js"
        />
      ) : null}
    </EmptyStatePresentational>
  )
}
