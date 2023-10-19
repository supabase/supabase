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

Primitives work the same way as any other color. They should follow some basic usage patterns such as _foreground_ on text and _background_, but they can also be combined with any tailwind utility to achieve more advanced layouts.

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

|                        |                                      |
| ---------------------- | ------------------------------------ |
| `foreground-(default)` | Default text (_default_ is optional) |
| `foreground-light`     | Light text                           |
| `foreground-lighter`   | Lighter text                         |
| `foreground-muted`     | Muted text                           |

Examples:

```
text-foreground (or text or text-foreground-default)
text-foreground-light
text-foreground-lighter
text-foreground-muted
bg-foreground-light
```

---

### Background

|                                               |                                                              |
| --------------------------------------------- | ------------------------------------------------------------ |
| `{background}` or `{background}-(background)` | Main body background (background is optional)                |
| `{background}-surface-100`                    | Panels and surfaces on the same level of the main background |
| `{background}-surface-200`                    | Surfaces that overlap the main content (ex. drodowns)        |
| `{background}-surface-300`                    | Surfaces that are stacked above {background}-surface-200     |
| `{background}-alternative`                    | Alernative background (inverted)                             |
| `{background}-overlay`                        | Overlays, Dropdowns, Popovers                                |
| `{background}-control`                        | Inputs, Radios, Checkboxes                                   |

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

|                                  |                                      |
| -------------------------------- | ------------------------------------ |
| `{border}` or `{border}-default` | Default border (default is optional) |
| `{border}-secondary`             | Secondary border                     |
| `{border}-alternative`           | Alernative border (inverted)         |
| `{border}-overlay`               | Overlays, Dropdowns, Popovers        |
| `{border}-control`               | Inputs, Radios, Checkboxes           |
| `{border}-strong`                | Hover, Focus                         |
| `{border}-stronger`              | Highlighted border                   |

Examples:

```
border-overlay
border-alternative
text-border-control
```

### Brand

|           |     |
| --------- | --- |
| `200`     |     |
| `300`     |     |
| `400`     |     |
| `500`     |     |
| `DEFAULT` |     |
| `600`     |     |

### Destructive

|           |     |
| --------- | --- |
| `200`     |     |
| `300`     |     |
| `400`     |     |
| `500`     |     |
| `DEFAULT` |     |
| `600`     |     |

### Warning

|           |     |
| --------- | --- |
| `200`     |     |
| `300`     |     |
| `400`     |     |
| `500`     |     |
| `DEFAULT` |     |
| `600`     |     |

## Storybook

The current colors are also auto documented in Storybook

[Storybook Colors](https://ui-storybook-pre-release.vercel.app/)
