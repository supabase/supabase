import { FeatureItem, type Feature } from '~/components/FeatureItem'
import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { Archive, ArrowUpRight, FileStack, RotateCcw } from 'lucide-react'
import { MarketingForm } from 'marketing/forms'
import Link from 'next/link'
import { Badge, Button } from 'ui'

import { BroomSparklesIcon } from './BroomSparklesIcon'
import { getGoPageBySlug } from '@/lib/go'

const GO_PAGE_SLUG = 'storage-object-versioning-early-access'
const FORM_ID = 'form'

const highlights: Feature[] = [
  {
    icon: FileStack,
    heading: 'Version history',
    subheading: 'Every upsert keeps the copy it replaced.',
  },
  {
    icon: Archive,
    heading: 'Archive instead of delete',
    subheading: 'A soft-deleted file stays recoverable.',
  },
  {
    icon: RotateCcw,
    heading: 'Restore',
    subheading: 'Recover an archived file or an earlier version.',
  },
  {
    icon: BroomSparklesIcon,
    heading: 'Lifecycle policies',
    subheading: 'Expire old versions by age, or keep a set number per file.',
  },
]

function getWaitlistForm() {
  const page = getGoPageBySlug(GO_PAGE_SLUG)
  const form = page?.sections?.find((section) => section.id === FORM_ID)
  if (!page || form?.type !== 'form') {
    throw new Error(`Go page form "${GO_PAGE_SLUG}#${FORM_ID}" not found`)
  }

  return form
}

export function ObjectVersioningSection() {
  const form = getWaitlistForm()

  return (
    <SectionContainerWithCn>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        <div className="flex flex-col items-start gap-4">
          <div>
            <Badge variant="warning">Private Alpha</Badge>
          </div>
          <h3 className="text-2xl md:text-4xl text-foreground-lighter">
            Recover any file with
            <br />
            <span className="text-foreground">Object versioning</span>
          </h3>
          <p className="text-foreground-light">
            With versioning enabled on a bucket, Storage keeps previous versions of an object when
            it's overwritten or deleted, so you can restore any of them when you need to.
          </p>
          <p className="text-foreground-light">
            Lifecycle policies control how many versions are kept and for how long, so storage costs
            stay predictable.
          </p>
          <p className="text-foreground-lighter text-sm">{form.description}</p>
          <Button size="small" iconRight={<ArrowUpRight />} asChild>
            <Link href="#" target="_blank">
              Documentation
            </Link>
          </Button>
        </div>
        <MarketingForm
          fields={form.fields}
          submitLabel={form.submitLabel}
          disclaimer={form.disclaimer}
          successMessage={form.successMessage}
          successRedirect={form.successRedirect}
          formRef={{ slug: GO_PAGE_SLUG, formId: FORM_ID }}
        />
      </div>
      <ul className="grid grid-cols-1 gap-4 gap-y-10 md:grid-cols-2 md:gap-12 xl:grid-cols-4 mt-16 md:mt-24">
        {highlights.map((highlight) => (
          <FeatureItem feature={highlight} key={highlight.heading} />
        ))}
      </ul>
    </SectionContainerWithCn>
  )
}
