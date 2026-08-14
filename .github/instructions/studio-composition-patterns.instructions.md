---
applyTo: "apps/studio/**"
---

# React Composition Patterns Review Rules

All comments are **advisory**.

## Core Principle

Avoid boolean prop proliferation. Use composition (compound components, explicit variants, children) instead of boolean flags to customize behavior.

## When to Flag

### 1. Boolean Prop Proliferation (HIGH)

Flag components accumulating boolean props like `isThread`, `isEditing`, `showAttachments`. Each boolean doubles the state space.

```tsx
// BAD — unclear intent, combinatorial explosion
<Composer isThread isDMThread isEditing isForwarding={false} />

// GOOD — self-documenting variants
<ThreadComposer channelId="abc" />
<EditMessageComposer messageId="xyz" />
```

### 2. Render Props Instead of Children (MEDIUM)

Flag `renderX` callback props when `children` composition would work.

```tsx
// BAD — render prop for structure
<Composer renderFooter={() => <F />} />

// GOOD — compound component
<Composer.Footer>
  <Composer.Formatting />
  <Composer.Emojis />
</Composer.Footer>
```

### 3. UI Coupled to State Implementation (MEDIUM)

Flag UI components calling specific state hooks like `useGlobalChannelState()` directly. The provider should own the state implementation; UI should only use a generic context interface.

```tsx
// BAD — UI knows HOW state is managed
const state = useGlobalChannelState(channelId)

// GOOD — provider owns implementation, UI uses context
<ChannelProvider channelId={channelId}>
  <Composer /> {/* reads from context */}
</ChannelProvider>
```

### 4. State Trapped in Child Components (MEDIUM)

Flag state that siblings or dialogs need but can't access without prop drilling or refs. Lift it into a provider.

```tsx
// BAD — sibling can't access state
function ForwardComposer() {
  const [state, setState] = useState(init)
}
// ForwardButton is a sibling and can't reach state

// GOOD — provider at shared ancestor
<ForwardMessageProvider>
  <Composer />      {/* can access state */}
  <ForwardButton /> {/* can also access state */}
</ForwardMessageProvider>
```

### 5. React 19 API Updates

Flag `forwardRef` and `useContext` in new code — use `ref` as a regular prop and `use()` instead.

```tsx
// BAD
const Input = forwardRef((props, ref) => <input ref={ref} />)
const value = useContext(MyContext)

// GOOD
function Input({ ref, ...props }) { return <input ref={ref} /> }
const value = use(MyContext)
```

## Key Principle

Lift state → Compose UI → Inject via generic context → No boolean prop proliferation.

Canonical standard: `.claude/skills/vercel-composition-patterns/SKILL.md`
