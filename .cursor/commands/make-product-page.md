# Create Product Page for www

## Project Structure

Product pages in the www app are located in `/apps/www/pages/` and follow specific patterns depending on the type of product page:

### Types of Product Pages

1. **Core Product Pages** (database, auth, storage, realtime, edge-functions)

   - Location: `apps/www/pages/{product-name}.tsx`
   - Use `ProductsNav` for navigation
   - Use `ProductHeader` from `~/components/Sections/ProductHeader`

2. **Module Pages** (cron, queues, vector)

   - Location: `apps/www/pages/modules/{module-name}.tsx`
   - Use `ModulesNav` from `~/components/Modules/ModulesNav`
   - Use `ProductModulesHeader` from `~/components/Sections/ProductModulesHeader`
   - Data files in `apps/www/data/products/modules/{module-name}.tsx`

3. **Solutions Pages** (developers, agencies, startups, etc.)
   - Location: `apps/www/pages/solutions/{solution-name}.tsx`
   - Use `SolutionsStickyNav` from `components/SolutionsStickyNav`
   - Use `ProductHeader2` from `components/Sections/ProductHeader2`
   - Data files in `apps/www/data/solutions/{solution-name}.tsx`

## Core Components

### Layouts

- `DefaultLayout` from `~/components/Layouts/Default` - Main layout wrapper with Nav and Footer

### Section Components (from `~/components/Sections/`)

- `ProductHeader` - Hero header with icon, title, subheader, image, and CTA buttons
- `ProductHeader2` - Alternative hero with more flexible layout
- `ProductModulesHeader` - Centered hero for module pages
- `HighlightCards` - Grid of highlight cards with icons
- `ImageParagraphSection` - Section with image on one side, text on other
- `FeaturesSection` - Grid of feature cards
- `UseCasesSection` - Showcase use cases
- `CustomerQuotesSection` - Multiple customer testimonials
- `SingleQuote` - Single customer quote/testimonial
- `CTABanner` - Call-to-action banner
- `ProductsCta` / `ProductsCta2` - Product-specific CTAs
- `EnterpriseCta` - Enterprise-focused CTA
- `CenteredTitleImage` - Centered title with image below
- `TimedTabsSection` - Tabs that auto-rotate
- `APISection` - Code examples with tabs

### Layout Components

- `SectionContainer` from `~/components/Layouts/SectionContainer` - Container for sections

### Navigation

- `ProductsNav` from `~/components/Products/ProductsNav` - For core products
- `ModulesNav` from `~/components/Modules/ModulesNav` - For modules
- `SolutionsStickyNav` - For solutions pages

## Page Template: Module Page

```tsx
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

import DefaultLayout from '~/components/Layouts/Default'
import ModulesNav from '~/components/Modules/ModulesNav'
import ProductModulesHeader from '~/components/Sections/ProductModulesHeader'
import SectionContainer from '~/components/Layouts/SectionContainer'

import { PRODUCT_MODULES_NAMES } from 'shared-data/products'
import PageData from '~/data/products/modules/{module-name}'

const HighlightCards = dynamic(() => import('~/components/Sections/HighlightCards'))
const ImageParagraphSection = dynamic(() => import('~/components/Sections/ImageParagraphSection'))
const CTABanner = dynamic(() => import('~/components/CTABanner'))

function ModulePage() {
  const pageData = PageData()

  return (
    <>
      <NextSeo
        title={pageData.metaTitle}
        description={pageData.metaDescription}
        openGraph={{
          title: pageData.metaTitle,
          description: pageData.metaDescription,
          url: `https://supabase.com/modules/{module-name}`,
          images: [{ url: pageData.metaImage }],
        }}
      />
      <DefaultLayout className="!bg-alternative" stickyNavbar={false}>
        <ModulesNav activePage={PRODUCT_MODULES_NAMES.MODULE_NAME} docsUrl={pageData.docsUrl} />
        <ProductModulesHeader {...pageData.heroSection} />
        <SectionContainer>{pageData.videoSection?.video}</SectionContainer>
        <HighlightCards {...(pageData.highlightsSection as any)} />
        {/* Add more sections as needed */}
        <div className="bg-gradient-to-t from-alternative to-transparent mt-8 lg:mt-24">
          <CTABanner />
        </div>
      </DefaultLayout>
    </>
  )
}

export default ModulePage
```

## Page Template: Solutions Page

```tsx
import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo'

import Layout from 'components/Layouts/Default'
import ProductHeader from 'components/Sections/ProductHeader2'
import SolutionsStickyNav from 'components/SolutionsStickyNav'
import getContent from 'data/solutions/{solution-name}'
import { Solutions } from 'data/Solutions'

const FeaturesSection = dynamic(() => import('components/Solutions/FeaturesSection'))
const PlatformSection = dynamic(() => import('components/Solutions/PlatformSection'))
const SingleQuote = dynamic(() => import('components/Sections/SingleQuote'))

const SolutionPage: NextPage = () => {
  const content = getContent()

  return (
    <>
      <NextSeo
        title={content.metadata.metaTitle}
        description={content.metadata.metaDescription}
        openGraph={{
          title: content.metadata.metaTitle,
          description: content.metadata.metaDescription,
          url: `https://supabase.com/solutions/{solution-name}`,
        }}
      />
      <Layout className="overflow-visible">
        <SolutionsStickyNav activeItem={Solutions.{solution-name}} type="skill-based" />
        <ProductHeader {...content.heroSection} />
        <FeaturesSection {...content.featuresSection} />
        {/* Add more sections as needed */}
      </Layout>
    </>
  )
}

export default SolutionPage
```

## Data File Template: Module

```tsx
// apps/www/data/products/modules/{module-name}.tsx
import { PRODUCT_MODULES } from 'shared-data/products'
import { Image } from 'ui'

export default () => ({
  metaTitle: 'Supabase {Module Name} | Tagline',
  metaDescription: 'Description for SEO',
  metaImage: '/images/modules/{module-name}/og.png',
  url: 'https://supabase.com/dashboard/project/_/integrations/{module-name}',
  docsUrl: '/docs/guides/{module-name}',
  heroSection: {
    title: 'Supabase {Module Name}',
    h1: <>Main Headline</>,
    subheader: <>Description paragraph</>,
    icon: PRODUCT_MODULES['{module-name}'].icon[24],
    cta: {
      label: 'Get Started',
      link: 'https://supabase.com/dashboard',
    },
    secondaryCta: {
      label: 'Explore documentation',
      link: '/docs/guides/{module-name}',
    },
  },
  highlightsSection: {
    className: '!py-4 [&_.highlights-grid]:xl:grid-cols-3',
    highlights: [
      {
        title: 'Feature Title',
        paragraph: 'Feature description',
        svg: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {/* SVG path */}
          </svg>
        ),
      },
      // More highlights...
    ],
  },
  // More sections...
})
```

## Data File Template: Solutions

```tsx
// apps/www/data/solutions/{solution-name}.tsx
import { useSendTelemetryEvent } from 'lib/telemetry'

import type { Metadata, HeroSection, FeaturesSection } from './solutions.utils'

const data: () => {
  metadata: Metadata
  heroSection: HeroSection
  // Other section types...
} = () => {
  const sendTelemetryEvent = useSendTelemetryEvent()

  return {
    metadata: {
      metaTitle: 'Supabase for {Audience}',
      metaDescription: 'Description for SEO',
    },
    heroSection: {
      id: 'hero',
      title: 'Supabase for {Audience}',
      h1: <>Main Headline</>,
      subheader: [<>Description paragraph</>],
      ctas: [
        {
          label: 'Start your project',
          href: 'https://supabase.com/dashboard',
          type: 'primary',
          onClick: () =>
            sendTelemetryEvent({
              action: 'start_project_button_clicked',
              properties: { buttonLocation: 'Solutions: {solution-name} page hero' },
            }),
        },
      ],
    },
    // More sections...
  }
}

export default data
```

## Styling Guidelines

- Use `!bg-alternative` class on DefaultLayout for module pages
- Use dynamic imports for non-critical sections
- Background gradients: `bg-gradient-to-t from-alternative to-transparent`
- Divider line: `w-full h-[1px] bg-gradient-to-r from-background-alternative via-border to-background-alternative`
- Use `Image` component from `ui` with dark/light mode support:
  ```tsx
  <Image
    src={{
      dark: '/images/path/image-dark.png',
      light: '/images/path/image-light.png',
    }}
    alt="Description"
    fill
  />
  ```

## Shared Data

- `shared-data/products` - Product names, icons, and module constants
- `~/data/MainProducts` - Core product definitions
- `data/Solutions` - Solution page identifiers

## Required Assets

1. **OG Image** - `/public/images/modules/{name}/og.png` or `/public/images/product/{name}/og.png`
2. **Section images** - Light/dark variants in `/public/images/modules/{name}/` or `/public/images/product/{name}/`

## Checklist for New Product Page

- [ ] Create page file in appropriate location (`pages/`, `pages/modules/`, or `pages/solutions/`)
- [ ] Create data file with all section content
- [ ] Add OG image and section images to public folder
- [ ] Update navigation if needed (ProductsNav, ModulesNav, or SolutionsStickyNav)
- [ ] Add to `shared-data/products` if it's a new module
- [ ] Add to `data/Solutions` if it's a new solution
- [ ] Test light/dark mode for all images
- [ ] Verify SEO meta tags and OpenGraph data
