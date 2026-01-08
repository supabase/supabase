# Create Featured Partner Page for www

## Overview

Featured partner pages are dedicated landing pages showcasing strategic partnerships with other companies. These pages highlight the combined value proposition, integration benefits, and co-marketing opportunities.

**Example:** [Vercel + AWS](https://vercel.com/partners/aws)

## Project Structure

### File Locations

- **Page file:** `apps/www/pages/partners/featured/[partner-name].tsx`
- **Data file:** `apps/www/data/partners/featured/[partner-name].tsx`
- **Components:** `apps/www/components/Partners/Featured/` (shared components)
- **Assets:** `apps/www/public/images/partners/featured/[partner-name]/`

## Page Structure

Based on [Vercel + Sitecore](https://vercel.com/partners/sitecore) and [Vercel + AWS](https://vercel.com/partners/aws):

1. **Hero Section** - Both company logos, headline, subheadline, CTAs
2. **Key Benefits Grid** - 3 stat-driven benefits (e.g., "2x Faster", "7x Time to Market")
3. **Security/Compliance Section** - Trust indicators (SLA, SOC 2, GDPR, etc.)
4. **Customer Testimonial** - Featured quote with photo and company
5. **Partner Testimonial** - Quote from partner company
6. **Feature Sections** - 3 detailed feature blocks with descriptions
7. **Customer Stats Row** - 4 success metrics with company logos
8. **Related Resources** - Link to guides, playbooks, docs
9. **CTA Banner** - Final call-to-action

## Core Components

### Layouts

- `DefaultLayout` from `~/components/Layouts/Default`
- `SectionContainer` from `~/components/Layouts/SectionContainer`

### Partner-Specific Components

Create these in `apps/www/components/Partners/Featured/`:

```tsx
// PartnerHero.tsx - Hero with dual logos
// PartnerBenefits.tsx - Key benefits grid
// PartnerFeatures.tsx - Integration features
// PartnerCustomers.tsx - Customer logos/quotes
```

## Page Template

```tsx
// apps/www/pages/partners/featured/[partner-name].tsx
import { NextSeo } from 'next-seo'
import dynamic from 'next/dynamic'

import DefaultLayout from '~/components/Layouts/Default'
import {
  PartnerHero,
  PartnerBenefits,
  PartnerTrustIndicators,
  PartnerTestimonial,
  PartnerFeatures,
  PartnerStats,
  PartnerResource,
} from '~/components/Partners/Featured'

import pageData from '~/data/partners/featured/[partner-name]'

const CTABanner = dynamic(() => import('~/components/CTABanner'))

function PartnerPage() {
  const data = pageData()

  return (
    <>
      <NextSeo
        title={data.metaTitle}
        description={data.metaDescription}
        openGraph={{
          title: data.metaTitle,
          description: data.metaDescription,
          url: `https://supabase.com/partners/featured/[partner-name]`,
          images: [{ url: data.metaImage }],
        }}
      />
      <DefaultLayout>
        <PartnerHero
          partnerName={data.partnerName}
          partnerLogo={data.partnerLogo}
          partnerLogoDark={data.partnerLogoDark}
          headline={data.heroSection.headline}
          subheadline={data.heroSection.subheadline}
          ctas={data.heroSection.ctas}
        />

        <PartnerBenefits benefits={data.benefits} />

        {data.trustIndicators && (
          <PartnerTrustIndicators
            title={data.trustIndicators.title}
            items={data.trustIndicators.items}
          />
        )}

        {data.testimonial && (
          <PartnerTestimonial
            quote={data.testimonial.quote}
            author={data.testimonial.author}
            role={data.testimonial.role}
            company={data.testimonial.company}
            companyLogo={data.testimonial.companyLogo}
          />
        )}

        {data.partnerTestimonial && (
          <PartnerTestimonial
            quote={data.partnerTestimonial.quote}
            author={data.partnerTestimonial.author}
            role={data.partnerTestimonial.role}
            variant="left"
          />
        )}

        <PartnerFeatures features={data.features} />

        {data.customerStats && <PartnerStats stats={data.customerStats} />}

        {data.relatedResource && <PartnerResource {...data.relatedResource} />}

        <div className="bg-gradient-to-t from-alternative to-transparent">
          <CTABanner />
        </div>
      </DefaultLayout>
    </>
  )
}

export default PartnerPage
```

## Data File Template

```tsx
// apps/www/data/partners/featured/[partner-name].tsx

export default () => ({
  metaTitle: 'Supabase + [Partner] | Partnership',
  metaDescription: 'Description of the partnership and its benefits',
  metaImage: '/images/partners/featured/[partner-name]/og.png',
  
  partnerName: '[Partner Name]',
  partnerLogo: '/images/partners/featured/[partner-name]/logo.svg',
  
  heroSection: {
    headline: <>Supabase + [Partner]</>,
    subheadline: 'Main value proposition of the partnership in one or two sentences.',
    ctas: [
      {
        label: 'Get Started',
        href: 'https://supabase.com/dashboard',
      },
      {
        label: 'Contact Sales',
        href: '/contact/sales',
      },
    ],
  },
  
  // Key benefits with stats - aim for 3
  benefits: [
    {
      stat: '2x',
      title: 'Faster Development',
      description: 'Description of this benefit and how it helps customers.',
    },
    {
      stat: '7x',
      title: 'Time to Market',
      description: 'Ship faster with the combined power of both platforms.',
    },
    {
      title: 'Zero Configuration',
      description: 'Deploy in minutes without managing infrastructure.',
    },
  ],
  
  // Trust indicators - security, compliance, SLAs
  trustIndicators: {
    title: 'Enterprise-grade security',
    items: [
      {
        badge: '99.99% Uptime SLA',
        title: 'High Availability',
        description: 'Built-in redundancy and automatic failover.',
      },
      {
        badge: 'SOC 2 Type 2',
        title: 'Compliance Ready',
        description: 'Meet regulatory requirements out of the box.',
      },
      {
        badge: 'GDPR Compliant',
        title: 'Data Protection',
        description: 'Full control over your data location and privacy.',
      },
    ],
  },
  
  // Customer testimonial
  testimonial: {
    quote: 'Quote from a customer using both products together...',
    author: 'Jane Doe',
    role: 'CTO',
    company: 'Acme Corp',
    companyLogo: '/images/customers/acme.svg',
  },
  
  // Partner testimonial (optional)
  partnerTestimonial: {
    quote: 'Quote from the partner company about the integration...',
    author: 'John Smith',
    role: 'VP of Partnerships, [Partner]',
  },
  
  // Feature sections - aim for 3
  features: [
    {
      title: 'Superior Performance',
      description: 'Build and deploy high-performance applications with the combined power of Supabase and [Partner]. Eliminate infrastructure complexities and leverage scalable infrastructure.',
    },
    {
      title: 'Seamless Integration',
      description: 'From selecting tools to building infrastructure, the integration simplifies your path with first-class support for [Partner] features.',
    },
    {
      title: 'Build What Users Want',
      description: 'Increased flexibility in development with a fully composable architecture lets you build how you want with best-of-breed tools.',
    },
  ],
  
  // Customer success stats with logos - aim for 4
  customerStats: [
    {
      value: '76%',
      label: 'increase in conversion',
      company: 'Company A',
      companyLogo: '/images/customers/company-a.svg',
    },
    {
      value: '80%',
      label: 'YoY growth',
      company: 'Company B',
      companyLogo: '/images/customers/company-b.svg',
    },
    {
      value: '1 year',
      label: 'of dev time saved',
      company: 'Company C',
      companyLogo: '/images/customers/company-c.svg',
    },
    {
      value: '300%',
      label: 'more organic clicks',
      company: 'Company D',
      companyLogo: '/images/customers/company-d.svg',
    },
  ],
  
  // Related resource/guide (optional)
  relatedResource: {
    title: 'Read the Integration Guide',
    description: 'Learn how to set up Supabase with [Partner] step by step.',
    href: '/docs/guides/integrations/[partner-name]',
    linkText: 'View Guide',
  },
})
```

## Styling Guidelines

### Colors
- Use brand colors for stats and highlights
- `text-foreground` for headings
- `text-foreground-lighter` for body text
- `bg-alternative` for alternating section backgrounds

### Dual Logo Treatment
```tsx
<div className="flex items-center gap-4">
  <div className="w-12 h-12 flex items-center justify-center">
    <Image src="/images/supabase-logo-icon.svg" alt="Supabase" width={48} height={48} />
  </div>
  <span className="text-3xl text-foreground-muted font-light">+</span>
  <div className="w-12 h-12 flex items-center justify-center">
    <Image src={partnerLogo} alt={partnerName} width={48} height={48} />
  </div>
</div>
```

### Stats Display
```tsx
<div className="flex flex-col">
  <span className="text-4xl md:text-5xl font-bold text-brand">{stat}</span>
  <span className="text-lg text-foreground-lighter">{description}</span>
</div>
```

## Required Assets

1. **Partner logo** - SVG preferred, dark/light variants if needed
2. **OG Image** - `og.png` (1200x630)
3. **Feature images** - Screenshots or diagrams of integration
4. **Customer logos** - If including customer success stories

## Checklist

- [ ] Create page file at `pages/partners/featured/[partner-name].tsx`
- [ ] Create data file at `data/partners/featured/[partner-name].tsx`
- [ ] Add partner logo and OG image to public folder
- [ ] Add feature images/diagrams
- [ ] Test light/dark mode for all assets
- [ ] Verify SEO meta tags
- [ ] Link from main partners page if appropriate
- [ ] Create documentation page for the integration (optional)

## Examples of Partner Pages to Reference

- Solutions pages: `apps/www/pages/solutions/*.tsx`
- Module pages: `apps/www/pages/modules/*.tsx`
- Customer pages: `apps/www/pages/customers/[slug].tsx`

## Component Patterns from Existing Pages

### ImageParagraphSection
Good for feature sections with image + text side by side:
```tsx
import ImageParagraphSection from '~/components/Sections/ImageParagraphSection'

<ImageParagraphSection
  heading={<>Feature Title</>}
  subheading="Feature description"
  image={<Image src="..." />}
  reverse={false} // alternate true/false for visual variety
/>
```

### HighlightCards
Good for benefit grids:
```tsx
import HighlightCards from '~/components/Sections/HighlightCards'

<HighlightCards
  highlights={[
    { title: 'Benefit 1', paragraph: 'Description', svg: <Icon /> },
    // ...
  ]}
/>
```

### SingleQuote
Good for customer testimonials:
```tsx
import SingleQuote from '~/components/Sections/SingleQuote'

<SingleQuote
  quote="Customer testimonial..."
  author="Name"
  role="Title, Company"
  logo="/images/customers/company.svg"
/>
```

