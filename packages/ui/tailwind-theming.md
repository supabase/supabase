# Tailwind theming

Supabase is migrating to use tailwind classes that use CSS properties.
This is to support the concept of theming, so that:

1. It is easy for the team to update the theme without changing 100s of files.
2. We could offer custom or additional themes in future.

## Primitives

We (the Supabase Design team ✨) define primitive color values using Figma Variables.

- `foreground`
- `background`
- `border`
- `brand` (could become primary)
- `destructive`
- `warning`

These values are exported from Figma as a .json file and transformed into tailwind utilities through some scripts under `packages/ui/internals/tokens`.

Primitives work the same way as any other color. They should follow some basic usage patterns such as _foreground_ on text and _background_ on surfaces, but they can also be combined with any tailwind utility to achieve more advanced layouts.

For example, `foreground-light` can also be applied on borders and backgrounds as `border-foreground-light` and `bg-foreground-light`, if needed.

Similarly, background and border primitives can be used on other tailwind utilities.

```
border-surface-100
bg-border-overlay
text-background-surface-100
```

## Usage

The following tailwind classes are a combination of tailwind utilities and our primitives. They're under development and are likely to change but most are now in use and will probably be permanent fixtures.

### Foreground (Text)

| Value                  | Usage                                  |
| ---------------------- | -------------------------------------- |
| `foreground-{DEFAULT}` | Default text (**DEFAULT** is optional) |
| `foreground-light`     | Light text                             |
| `foreground-lighter`   | Lighter text                           |
| `foreground-muted`     | Muted text                             |

Examples:

```
text-foreground
text-foreground-light
text-foreground-lighter
text-foreground-muted
bg-foreground-light
```

---

### Background

| Value                           | Usage                                                        |
| ------------------------------- | ------------------------------------------------------------ |
| `{background}-{DEFAULT}`        | Main body background (**DEFAULT** is optional)               |
| `{background}-surface-100`      | Panels and surfaces on the same level of the main background |
| `{background}-surface-200`      | Surfaces that overlap the main content (ex. dropdowns)        |
| `{background}-surface-300`      | Surfaces that are stacked above {background}-surface-200     |
| `{background}-alternative`      | Alternative background (inverted)                             |
| `{background}-overlay`          | Overlays, Dropdowns, Popovers                                |
| `{background}-control`          | Inputs, Radios, Checkboxes                                   |
| `{background}-button-{DEFAULT}` | Button default                                               |

The `background` part can be omitted when used on the `bg` tailwind utility.

Examples:

```
bg-surface-100
bg-overlay
bg-alternative
text-background-surface-100
```

---

### Border

| Value                     | Usage                                    |
| ------------------------- | ---------------------------------------- |
| `border-{DEFAULT}`        | Default border (**DEFAULT** is optional) |
| `border-secondary`        | Secondary border                         |
| `border-alternative`      | Alternative border (inverted)             |
| `border-overlay`          | Overlays, Dropdowns, Popovers            |
| `border-control`          | Inputs, Radios, Checkboxes               |
| `border-strong`           | Hover, Focus                             |
| `border-stronger`         | Highlighted border                       |
| `border-button-{DEFAULT}` | Button default border                    |
| `border-button-hover`     | Button default border hover              |

Examples:

```
border-overlay
border-alternative
text-border-control
```

### Brand

| Value     |
| --------- |
| `200`     |
| `300`     |
| `400`     |
| `500`     |
| `DEFAULT` |
| `600`     |
| `button`  |

### Destructive

| Value     |
| --------- |
| `200`     |
| `300`     |
| `400`     |
| `500`     |
| `DEFAULT` |
| `600`     |

### Warning

| Value     |
| --------- |
| `200`     |
| `300`     |
| `400`     |
| `500`     |
| `DEFAULT` |
| `600`     |

## Storybook

The current colors are also auto documented in Storybook

[Storybook Colors](https://ui-storybook-pre-release.vercel.app/)
