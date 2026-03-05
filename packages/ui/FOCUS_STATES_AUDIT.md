# Focus States Audit - packages/ui

Related: [DEPR-354](https://linear.app/supabase/issue/DEPR-354/consolidate-focus-states-across-studio-and-ui-libraries)

## Executive Summary

This audit identifies **significant inconsistencies** in focus state styling across the `packages/ui` library. There are at least **8 different focus ring patterns** and **5+ different focus colors** in use, creating an inconsistent user experience and accessibility concerns.

---

## Focus State Patterns Found

### 1. Ring-based Focus (`focus-visible:ring-*`)

The majority of shadcn components use ring-based focus with varying colors:

| Pattern | Components Using It |
|---------|-------------------|
| `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` | Checkbox, Switch, Tabs, Dialog close, Sheet close, RadioGroup, Slider |
| `focus-visible:ring-2 focus-visible:ring-foreground-muted focus-visible:ring-offset-2` | shadcn/Button |
| `focus-visible:ring-2 focus-visible:ring-background-control focus-visible:ring-offset-2 focus-visible:ring-offset-foreground-muted` | shadcn/Input, shadcn/TextArea |
| `focus-visible:ring-1 ring-foreground-muted` | Menu items, Accordion triggers |
| `focus-visible:ring-1 ring-foreground-light` | Accordion (bordered variant) |

### 2. Outline-based Focus (`focus-visible:outline-*`)

The custom Button component uses outline-based focus instead of rings:

| Pattern | Components Using It |
|---------|-------------------|
| `focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-brand-600` | Button (primary, default, alternative) |
| `focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-border-strong` | Button (secondary, outline, dashed, link, text) |
| `focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-amber-700` | Button (danger, warning) |
| `focus:outline-4 focus:outline-border-control` | Popover trigger |

### 3. Legacy CSS Module Focus (`:focus`)

Several older components use legacy `:focus` pseudo-class with box-shadow:

```css
/* SelectStyled.module.css */
.sbui-listbox:focus {
  box-shadow: 0 0 0 2px rgba(62, 207, 142, 0.1);  /* Green tint */
}

/* InputNumber.module.css */
.sbui-inputnumber:focus {
  /* Similar green-tinted box-shadow */
}
```

### 4. Mixed focus/focus-visible States

Some components mix `focus:` and `focus-visible:` inconsistently:

```tsx
// Select.tsx - uses both
'focus:outline-none ring-border-control focus:ring-2 focus:ring-ring focus:ring-offset-2'

// Dialog close button - uses focus:
'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
```

---

## Color Inconsistencies

### Focus Ring Colors Found:

| Color | Token/Value | Usage |
|-------|-------------|-------|
| **ring** | `ring-ring` | Most shadcn components (generic token) |
| **foreground-muted** | `ring-foreground-muted` | shadcn/Button, some menu items |
| **foreground-light** | `ring-foreground-light` | Accordion triggers |
| **foreground-lighter** | `ring-foreground-lighter` | TextLink |
| **background-control** | `ring-background-control` | Input, TextArea |
| **brand-300** | `ring-brand-300` | Legacy Checkbox, Radio (CSS modules) |
| **brand-400** | `ring-brand-400` | Radio (defaultTheme.ts) |
| **brand-600** | `ring-brand-600` | Legacy Listbox |
| **border-muted** | `ring-border-muted` | Checkbox (defaultTheme.ts) |
| **border** | `ring-border` | Toggle (defaultTheme.ts) |
| **destructive-400** | `ring-destructive-400` | Error states in Input, Select, InputNumber |

### Focus Outline Colors Found:

| Color | Usage |
|-------|-------|
| **brand-600** | Button (primary, default, alternative) |
| **border-strong** | Button (secondary, outline, dashed, link, text) |
| **border-control** | Popover trigger |
| **amber-700** | Button (danger, warning) |

---

## Component-by-Component Analysis

### Shadcn Components (Modern)

| Component | Focus Pattern | Color | Notes |
|-----------|--------------|-------|-------|
| `shadcn/button.tsx` | ring-2 + offset-2 | `foreground-muted` | ✅ Consistent internally |
| `shadcn/checkbox.tsx` | ring-2 + offset-2 | `ring` | ✅ Uses generic token |
| `shadcn/switch.tsx` | ring-2 + offset-2 | `ring` | ✅ Uses generic token |
| `shadcn/input.tsx` | ring-2 + offset-2 | `background-control` | ⚠️ Different color than others |
| `shadcn/textarea.tsx` | ring-2 + offset-2 | `ring` | ⚠️ Different from input.tsx |
| `shadcn/select.tsx` | ring-2 + offset-2 | `ring` | ⚠️ Uses `focus:` not `focus-visible:` |
| `shadcn/tabs.tsx` | ring-2 + offset-2 | `ring` | ✅ Consistent |
| `shadcn/dialog.tsx` | ring-2 + offset-2 | `ring` | ⚠️ Uses `focus:` not `focus-visible:` |
| `shadcn/sheet.tsx` | ring-2 + offset-2 | `ring` | ⚠️ Uses `focus:` not `focus-visible:` |
| `shadcn/radio-group.tsx` | ring-2 + offset-2 | `ring` | ⚠️ Uses both `focus:` and `focus-visible:` |

### Custom UI Components (Legacy)

| Component | Focus Pattern | Color | Notes |
|-----------|--------------|-------|-------|
| `Button/Button.tsx` | outline-4 + offset-1 | varies by type | ❌ Different system than shadcn |
| `Input (defaultTheme)` | ring-current + ring-2 | `current` | ❌ Different from shadcn/input |
| `Checkbox (defaultTheme)` | ring-current + ring-2 | `border-muted` | ❌ Different from shadcn/checkbox |
| `Radio (defaultTheme)` | ring-current + ring-2 | `brand-400` | ❌ Different color |
| `Listbox (defaultTheme)` | ring-current + ring-2 | `border-muted` | ❌ Legacy pattern |
| `Toggle (defaultTheme)` | ring-current + ring-2 | `border` | ❌ Uses `!ring-border` |
| `Tabs (defaultTheme)` | ring + ring-foreground-muted | `foreground-muted` | ❌ Different size |

### CSS Module Components (Legacy)

| Component | Focus Pattern | Color | Notes |
|-----------|--------------|-------|-------|
| `SelectStyled.module.css` | box-shadow | green (#3ECF8E) | ❌ Legacy green focus |
| `Listbox (CSS)` | box-shadow | green (#3ECF8E) | ❌ Legacy green focus |
| `InputNumber.module.css` | box-shadow | green | ❌ Legacy green focus |

---

## Key Issues

### 1. **Two Competing Systems**
- **Shadcn pattern**: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Custom Button pattern**: `focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-{color}`

### 2. **Inconsistent Color Tokens**
- At least 10+ different color tokens used for focus states
- No single source of truth for "focus color"

### 3. **Mixed focus vs focus-visible**
- Some components use `focus:` (triggers on click in some browsers)
- Others use `focus-visible:` (better for keyboard-only focus)
- This causes visual inconsistency

### 4. **Legacy Green Focus Rings**
- CSS modules still have hardcoded green (`#3ECF8E`, `rgba(62, 207, 142, 0.1)`)
- These are the "green focus states" mentioned in the Slack thread

### 5. **Ring Size Inconsistencies**
- `ring-1` in Menu items
- `ring-2` in most shadcn components
- `ring-current ring-2` in defaultTheme
- `outline-4` in Button

### 6. **Offset Inconsistencies**
- `ring-offset-2` in shadcn components
- `outline-offset-1` in Button
- No offset in some defaultTheme components

---

## Recommendations

### Immediate Actions

1. **Define a single focus token system** in Tailwind config:
   ```js
   // tailwind.config.js
   theme: {
     extend: {
       ringColor: {
         focus: 'var(--focus-ring-color)', // single source of truth
       }
     }
   }
   ```

2. **Create focus utility classes** (as Danny started in PR #41575):
   ```css
   .focus-ring {
     @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2;
   }

   .focus-ring-inset {
     @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset;
   }
   ```

3. **Standardize on `focus-visible:`** instead of `focus:` for keyboard accessibility

### Migration Path

1. **Phase 1**: Update shadcn components to use consistent `ring-ring` token
2. **Phase 2**: Migrate custom Button to use ring-based focus (matching shadcn)
3. **Phase 3**: Update defaultTheme.ts to use standardized focus classes
4. **Phase 4**: Remove legacy CSS module focus styles

### Files Requiring Updates

**High Priority** (user-facing interactive elements):
- `src/components/Button/Button.tsx` - Change outline to ring
- `src/components/shadcn/ui/input.tsx` - Align color with other inputs
- `src/components/shadcn/ui/select.tsx` - Use focus-visible
- `src/components/shadcn/ui/dialog.tsx` - Use focus-visible
- `src/components/shadcn/ui/sheet.tsx` - Use focus-visible

**Medium Priority**:
- `src/lib/theme/defaultTheme.ts` - Multiple focus patterns
- `src/lib/commonCva.ts` - Define standardized focus utilities
- All CSS modules with legacy focus styles

**Low Priority**:
- Menu items and other non-primary interactive elements

---

## Appendix: All Focus Patterns Found

### Ring Patterns
```
focus:ring-current focus:ring-2
focus:ring-brand-300
focus:ring-brand-400
focus:ring-brand-600
focus:ring-border-muted
focus:ring-destructive-400
focus:ring-ring
focus:ring-0
focus:!ring-border
focus-visible:ring-1
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-foreground-muted
focus-visible:ring-foreground-lighter
focus-visible:ring-background-control
ring-foreground-muted
ring-foreground-light
```

### Outline Patterns
```
focus:outline-none
focus:outline-4
focus:outline-border-control
focus-visible:outline-none
focus-visible:outline-4
focus-visible:outline-offset-1
focus-visible:outline-brand-600
focus-visible:outline-border-strong
focus-visible:outline-amber-700
```

### Legacy CSS
```css
box-shadow: 0 0 0 2px rgba(62, 207, 142, 0.1);  /* Green */
```

---

*Audit completed: February 2026*
*Related Slack thread: https://supabase.slack.com/archives/C0429V78ACX/p1770736762300219*
