import { LucideIcon } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>
type IconType = LucideIcon | HeroIcon

interface Metadata {
  metaTitle: string
  metaDescription: string
}

export interface HeroSection {
  id: string
  title: string
  h1: JSX.Element
  subheader: JSX.Element[]
  image: JSX.Element
  className?: string
  sectionContainerClassName?: string
  icon?: string
  ctas: {
    label: string
    href: string
    type: 'primary' | 'default'
  }[]
  logos: {
    name: string
    image: string
  }[]
  footer?: React.ReactNode
  footerPosition?: 'left' | 'right'
}

export interface Quote {
  icon?: string
  author: string
  authorTitle?: string
  quote: JSX.Element
  avatar: string
}

export interface Quotes {
  id: string
  items: Quote[]
}

export interface Highlight {
  icon?: IconType
  heading: string | JSX.Element
  subheading: string | JSX.Element
  url?: string
}

export interface Feature {
  icon?: IconType
  heading: string | JSX.Element
  subheading: string | JSX.Element
  img?: JSX.Element
}

export interface WhySection {
  id: string
  label: string
  heading: JSX.Element
  features: Feature[]
}

interface FeaturesSection {
  id: string
  heading: JSX.Element
  subheading: string
  features: {
    [key: string]: {
      id: string
      icon?: IconType
      heading: JSX.Element
      subheading: JSX.Element
      img?: JSX.Element
    }
  }
}

export interface Testimonials {
  id: string
  label: string
  heading: JSX.Element
  videos: {
    [key: string]: {
      url: string
    }
  }
}

interface CTASection {
  id: string
  label: string
  heading: JSX.Element
  subheading: string
  cta: {
    label: string
    href: string
    type: string
  }
}

export interface AIData {
  metadata: Metadata
  heroSection: HeroSection
  quotes: Quotes
  why: WhySection
  features: FeaturesSection
  testimonials: Testimonials
  'cta-section': CTASection
}
