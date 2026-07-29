---
name: react-hook-form
description: Correct React Hook Form usage anywhere in the monorepo — data flow, subscriptions,
  reset, dirty state, number inputs, and controlled-input rules. Load this BEFORE
  writing or modifying ANY form code, adding a field to an existing form, touching
  watch/useWatch/formState/getValues/setValue/reset, wiring a form into a dialog or
  sheet, or building a submit/cancel footer — even when the change looks trivial.
  The codebase contains widespread RHF anti-patterns; without this skill you will
  copy them. For form layout and which components to use, also load
  studio-ui-patterns.
---

# React Hook Form

How to write forms that stay correct as they grow. The existing codebase is **not**
a safe reference: `form.watch()` off prop-drilled form objects, subscription-only
watches, unguarded `valueAsNumber`, and `?? undefined` controlled values are all
common in older code and all wrong. Follow this skill, not the neighboring file.

**Policy — fix what you touch.** New code must follow these rules. When you modify
existing form code, upgrade the specific fields/hooks/components you're editing to
match (e.g. a component you touch that calls `form.watch` gets converted to
`useWatch`). Leave untouched code alone, but tell the user about anti-patterns you
noticed and didn't fix. Never add new violations: `react-hook-form/no-use-watch`
is ratcheted in Studio CI — any increase in the warning count fails the build.

## Mental model: subscriptions decide who re-renders

RHF is uncontrolled at heart. Values live in refs; nothing re-renders unless a
subscription says so. Every read API is a subscription decision:

| API                           | Subscribes | Re-renders                 | Use for                                        |
| ----------------------------- | ---------- | -------------------------- | ---------------------------------------------- |
| `useWatch({ control, name })` | yes        | only the calling component | reactive value reads, anywhere                 |
| `useFormState({ control })`   | yes        | only the calling component | `isDirty`/`errors`/etc. outside the form owner |
| `formState` (destructured)    | yes        | the `useForm` owner        | form state **in the owner component only**     |
| `form.watch(name)`            | yes        | the **entire form tree**   | avoid — lint-flagged, see below                |
| `getValues()`                 | no         | never                      | event handlers and `onSubmit` only             |
| `subscribe()`                 | callback   | none                       | side effects outside render                    |

Two facts explain most of the bugs we've shipped:

1. **`form.watch()` and `form.formState` hoist their subscription to the `useForm`
   owner**, no matter which component calls them. A child that reads
   `form.watch('x')` off a prop works today only because the whole tree re-renders
   on every change — it silently goes stale the moment anyone adds `React.memo`
   between owner and child, and until then it re-renders every sibling on every
   keystroke. A no-arg `form.watch()` sets `watchAll` and re-renders the tree on
   every field change for the life of the form.
2. **`formState` is a Proxy** — reading a property is what arms the subscription.
   Destructure it (`const { isDirty } = form.formState`), never pass the object
   around or read it conditionally (`a && formState.isValid` may never subscribe).
   Enforced by `react-hook-form/destructuring-formstate` (error).

### Reading values, by location

- **In the component that owns `useForm`:** destructure `formState`; prefer
  `useWatch` over `form.watch` even here (the `no-use-watch` rule flags every
  `watch`, and `useWatch` scopes the re-render if the JSX is later extracted).
- **In any child component or custom hook:** accept `control` (not the whole
  `form`) and use `useWatch({ control, name })` / `useFormState({ control })`.
  Inside `<Form {...form}>` (which _is_ `FormProvider`), `useFormContext()` +
  `useWatch({ name })` also works and avoids prop-drilling entirely.
- **Consume the return value.** Never call a watch for its subscription side
  effect and then read via `getValues()` — the watch list and the read list will
  drift apart (it has already happened; fields silently lost reactivity). The
  value you render must _be_ the value you subscribed to.
- **One read path per value per render.** Mixing `useWatch('x')` on one line and
  `getValues('x')` a few lines later lets the two disagree within a single render.
- **Name what you watch.** `useWatch({ control })` with no `name` re-renders on
  every keystroke in every field. Subscribe to the specific names you use.
- `watch(callback)` is deprecated — use `subscribe()` for render-free listeners,
  and always return its cleanup from `useEffect`.

```tsx
// ❌ common in the codebase — all three subscriptions hoist to the form owner
function Fields({ form }: { form: UseFormReturn<FormValues> }) {
  form.watch(['storageType', 'totalSize'])        // return value discarded
  const { errors } = form.formState               // prop-form formState
  const size = form.getValues('totalSize')        // non-reactive read in render
  ...
}

// ✅ child subscribes for itself and consumes what it watches
function Fields({ control }: { control: Control<FormValues> }) {
  const [storageType, totalSize] = useWatch({ control, name: ['storageType', 'totalSize'] })
  const { errors } = useFormState({ control })
  ...
}
```

## The canonical form

zod schema → `z.infer` type → `useForm` with `zodResolver` and **complete**
`defaultValues` → `<Form {...form}>` → `FormField` render-prop per field →
`FormItemLayout` → `FormControl` → primitive from `ui`. Layout/container choices
(Card vs Sheet, `layout=` variants) are covered by the `studio-ui-patterns` skill
and the demos in `apps/design-system/registry/default/example/`
(`form-patterns-pagelayout.tsx`, `form-patterns-sidepanel.tsx`) — check them
before inventing structure.

```tsx
const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  maxConnections: z
    .union([z.literal(''), z.coerce.number().gte(1, 'Must be at least 1')])
    .refine((v) => v !== '', 'Max connections is required'),
})
type FormValues = z.infer<typeof FormSchema>

const form = useForm<FormValues>({
  resolver: zodResolver(FormSchema),
  defaultValues: { name: '', maxConnections: '' },
})

<Form {...form}>
  <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItemLayout layout="horizontal" label="Name">
          <FormControl>
            <Input {...field} />
          </FormControl>
        </FormItemLayout>
      )}
    />
  </form>
</Form>
```

Submit buttons living outside the `<form>` (sheet/dialog footers) use a stable
`formId` and `form={formId}` on the button.

## defaultValues, server data, and reset

- **Provide a complete `defaultValues` object — every field, no `undefined`.**
  `isDirty`, `dirtyFields`, and Cancel-reset all compare against it; a missing or
  `undefined` default breaks all three, and `undefined` also makes React treat the
  input as uncontrolled (see below).
- **Form populated from an API? Use the `values` option, not a hand-rolled
  effect.** `values` reacts to the query resolving and resets the form for you;
  computing `defaultValues` from a query that may not have loaded freezes whatever
  happened to be in cache at mount. Add
  `resetOptions: { keepDirtyValues: true }` when a background refetch must not
  clobber the user's in-progress edits. (Good examples:
  `components/interfaces/Settings/Database/ConnectionLogging.tsx`,
  `components/interfaces/Storage/EditBucketModal.tsx`.)
- **After a successful mutation, `reset(submittedValues)`** in `onSuccess` so the
  saved state becomes the new baseline (`isDirty` returns to false, Cancel now
  reverts to the saved values). A bare `reset()` reverts to the _previous_
  defaults — wrong after a save. If the form uses `values` and the mutation
  invalidates the query, the refetch handles this for you.
- Cancel buttons call `form.reset()`. This only visually restores fields whose
  values round-trip through defined, controlled values — which is why the null
  rules below matter.

## Controlled inputs: never let `value` flip to `undefined`

React decides controlled vs uncontrolled per render from whether `value` is
defined. A field whose value can be `undefined` (or becomes `undefined` on reset)
flips modes: console warnings, and — worse — `reset()` stops clearing the visible
text because React abandoned the DOM value. `value={field.value ?? undefined}` is
a bug, not a fix.

- Text fields: default to `''`, never `null`/`undefined`.
- **Normalize `null` from the API at the form boundary** (`growthPercent ?? ''`
  when building defaults) and convert back on submit (`'' → null`). Do not paper
  over a `null` default with a `placeholder` that looks like a value: the user
  sees "50", the form holds `null`, and every downstream comparison
  (`defaultValues.growthPercent !== watched` → `null !== 50`) reports a permanent
  phantom change while Cancel silently fails to reset the field.
- Selects/radios: default to `''` or a real option value; checkboxes/switches to
  `false`.

## Number inputs

The blessed pattern keeps `''` as the "empty" sentinel so the input stays
controlled, and lets zod coerce on validation (see `maxConnections` above):
`z.union([z.literal(''), z.coerce.number()...]).refine((v) => v !== '', '…')`
with a plain `<Input {...field} type="number" />`.

If you instead wire `onChange` through `e.target.valueAsNumber` (or
`valueAsNumber: true`), an emptied input produces `NaN`, which lands in form
state and propagates into every calculation, price preview, and
`value` attribute downstream. Guard it:
`field.onChange(e.target.value === '' ? null : e.target.valueAsNumber)` — and
then handle the `null` per the rules above. Never let `NaN` into form state.

## Dirty state and change detection

- Gate Save on `isDirty`; show Cancel only when dirty. In the owner, destructure
  from `form.formState`; anywhere else, `useFormState({ control })`.
- To show _which_ fields changed (review/summary dialogs), read `dirtyFields`
  from the same subscription instead of hand-comparing
  `defaultValues.x !== watchedX`. RHF already does that comparison correctly;
  hand-rolled versions break on the null-vs-placeholder mismatch and must be
  kept in sync with the watch list by hand.
- `setValue` outside user input needs explicit flags:
  `setValue('x', v, { shouldDirty: true, shouldValidate: true })` — otherwise the
  change is invisible to `isDirty` and validation.

## Disabling and gating

If a field must not be edited (plan tier, permissions, cooldown), disable the
field itself — a notice next to an editable input gates nothing. Wire the same
condition into both the notice and the control. Permission checks come from
`useAsyncCheckPermissions`; disabled buttons that need an explanation use
`ButtonTooltip`.

Caution: `register`/`useController` `disabled: true` removes the field's value
from submission data. For "visible but locked" fields whose value must survive
submit, use the input's own `disabled`/`readOnly` prop (as `FormField` +
primitive props do) rather than RHF-level disabling, or the form-level
`disabled` option to freeze everything during async work.

## Submit and mutations

`onSubmit` receives validated, typed data — trust it; don't re-read via
`getValues()`. Mutations follow Studio conventions: `onSuccess` → `toast.success`

- `reset(values)` (or query invalidation when using `values:`), `onError` →
  `toast.error`; pass the mutation's `isPending` to the button's `loading` prop.
  Default validation `mode: 'onSubmit'` is right for most forms — pick another mode
  deliberately, not by copying.

## Lint rules in force (Studio)

| Rule                                        | Level            | Meaning                                          |
| ------------------------------------------- | ---------------- | ------------------------------------------------ |
| `react-hook-form/destructuring-formstate`   | error            | destructure `formState`, never hold the object   |
| `react-hook-form/no-access-control`         | error            | don't reach into `control` internals             |
| `react-hook-form/no-nested-object-setvalue` | error            | `setValue('a.b', v)`, not `setValue('a', {b:v})` |
| `react-hook-form/no-use-watch`              | warn (ratcheted) | use `useWatch`, not `watch`                      |
