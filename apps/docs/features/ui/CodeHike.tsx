'use client'

import { CH } from '@code-hike/mdx/components'

/**
 * [Charis 2024-04-20]
 *
 * Annotations are broken and I can't find a way around it.
 *
 * Problem seems to be related to CH.annotations being a map of components and
 * not a component itself. It's not bundled by the RSC bundler, and you get the
 * error `Could not find the module .../CodeHike.tsx#annotations#mark in the
 * React Client Manifest`.
 */

export const Code = CH.Code
export const Section = CH.Section
export const SectionLink = CH.SectionLink
export const SectionCode = CH.SectionCode
export const Spotlight = CH.Spotlight
export const Scrollycoding = CH.Scrollycoding
export const Preview = CH.Preview
export const Annotation = CH.Annotation
export const Slideshow = CH.Slideshow
export const InlineCode = CH.InlineCode
export const CodeSlot = CH.CodeSlot
export const PreviewSlot = CH.PreviewSlot
export const StaticToggle = CH.StaticToggle
