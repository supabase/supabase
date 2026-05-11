import { Check } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'

const BUCKET_TYPES = [
  {
    title: 'Files buckets',
    features: [
      'Store images, videos, documents, and more',
      'Serve fast from a global CDN',
      'Fine-grained access controls',
      'Image optimizations and transformations',
    ],
    cta: { label: 'Learn more', href: '/docs/guides/storage' },
  },
  {
    title: 'Analytics buckets',
    features: [
      'Apache Iceberg open table format',
      'Efficient query, partition, and transform',
      'Historical and time-series data',
      'Optionally expose via Postgres',
    ],
    cta: { label: 'Learn more', href: '/docs/guides/storage/analytics-buckets' },
  },
  {
    title: 'Vector buckets',
    features: [
      'Store and index vector embeddings',
      'Multiple distance metrics',
      'Metadata filtering and similarity queries',
      'RAG systems and AI-powered search',
    ],
    cta: { label: 'Learn more', href: '/docs/guides/storage/vector-buckets' },
  },
]

export function BucketTypesSection() {
  return (
    <div className="py-24 flex flex-col gap-16">
      {/* Header */}
      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 w-full">
        <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
          Bucket types
          <br />
          <span className="text-foreground">for every application</span>
        </h3>
      </div>

      <div className="mx-auto max-w-[var(--container-max-w,75rem)] px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {BUCKET_TYPES.map((bucket) => (
            <div
              key={bucket.title}
              className="relative flex flex-col overflow-hidden min-h-[320px] bg-surface-75 border border-border rounded-lg"
            >
              <div className="relative z-10 flex flex-col justify-between h-full p-6 md:p-8">
                <div className="flex flex-col gap-4">
                  <h4 className="text-foreground text-lg font-medium">{bucket.title}</h4>
                  <ul className="flex flex-col text-foreground-lighter text-sm gap-1.5">
                    {bucket.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 stroke-2 text-brand" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <Button type="default" size="small" asChild>
                    <Link href={bucket.cta.href}>{bucket.cta.label}</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
