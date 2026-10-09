import { FeatureItem, type Feature } from '~/components/FeatureItem'
import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { Archive, FileStack, RotateCcw } from 'lucide-react'
import { MarketingForm } from 'marketing/forms'
import { Badge } from 'ui'

import { BroomSparklesIcon } from './BroomSparklesIcon'
import { getGoPageBySlug } from '@/lib/go'

const GO_PAGE_SLUG = 'storage-object-versioning-early-access'
const FORM_ID = 'form'

const highlights: Feature[] = [
  {
    // The same icon Studio puts on a versioned bucket.
    icon: FileStack,
    heading: 'Version history',
    subheading: 'Every overwrite keeps the copy it replaced.',
  },
  {
    icon: Archive,
    heading: 'Archive instead of delete',
    subheading: 'A deleted file leaves the listing but stays recoverable.',
  },
  {
    icon: RotateCcw,
    heading: 'Restore',
    subheading: 'Put back an archived file, or roll a live one back to an earlier version.',
  },
  {
    // The same icon Studio puts on a bucket's lifecycle policy.
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
        <div className="flex flex-col gap-4">
          <div>
            <Badge variant="warning">Private Alpha</Badge>
          </div>
          <h3 className="text-2xl md:text-4xl text-foreground-lighter">
            Storage
            <br />
            <span className="text-foreground">Object versioning</span>
          </h3>
          <p className="text-foreground-light">
            Turn on versioning for a bucket and Storage keeps the previous copy every time a file
            changes. Deleting a file archives it instead of destroying it. Restore any version when
            you need it, and set lifecycle policies to expire the rest.
          </p>
          <p className="text-foreground-lighter text-sm">{form.description}</p>
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
