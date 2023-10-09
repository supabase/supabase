# Tailwind theming

Supabase is migrating to use tailwind classes that use CSS properties.

This is to support the concept of theming, so that:

1. It is easy for the team to update the theme without changing 100s of files.
2. We could offer custom or additional themes in future.

## Classes

The classes are a work in progress but some are now in use and will probably be permanent fixtures.

The following are some of the most used classes.

It is still a work in progress and class names are likely to change.

### Text

Default text

`text-foreground`

Light text

`text-foreground-light`

Lighter text

`text-foreground-lighter`

---

### Background

App background
(considering changing this to "bg-body")
`bg`

Panels

`bg-surface-100`

`bg-surface-200`

`bg-surface-300`

Alernative background (inverted)
`bg-alternative`

Overlays, Dropdowns, Popovers

`bg-overlay`

Inputs, Radios, Checkboxes

`bg-control`

---

### Border

Default border

`border`

Secondary border

`border-secondary`

Alernative border (inverted)
`border-alternative`

Overlays, Dropdowns, Popovers

`border-overlay`

Inputs, Radios, Checkboxes

`border-control`

## Storybook

The current colors are also auto documented in Storybook

[Storybook Colors](https://ui-storybook-pre-release.vercel.app/)
