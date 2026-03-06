---
description: "Studio: form patterns (page layouts + side panels) and react-hook-form conventions"
globs:
  - apps/studio/**/*.{ts,tsx}
alwaysApply: false
---

# Studio forms

Use the Design System UI pattern docs as the source of truth:

- Documentation: `apps/design-system/content/docs/ui-patterns/forms.mdx`
- Demos:
  - `apps/design-system/registry/default/example/form-patterns-pagelayout.tsx`
  - `apps/design-system/registry/default/example/form-patterns-sidepanel.tsx`

## Requirements

- Build forms with `react-hook-form` + `zod`.
- Use `FormItemLayout` instead of manually composing `FormItem`/`FormLabel`/`FormMessage`/`FormDescription`.
- Wrap inputs with `FormControl_Shadcn_`.
- Use `_Shadcn_` imports from `ui` for form primitives where available.

## Layout selection

- Page layouts: `FormItemLayout layout="flex-row-reverse"` inside `Card` (`CardContent` per field; `CardFooter` for actions).
- Side panels (wide): `FormItemLayout layout="horizontal"` inside `SheetSection`.
- Side panels (narrow, `size="sm"` or below): `FormItemLayout layout="vertical"`.

## Actions and state

- Handle dirty state (`form.formState.isDirty`) to show Cancel and to disable Save.
- Show loading on submit buttons via `loading`.
- When submit button is outside the `<form>`, set a stable `formId` and use the button’s `form` prop.

