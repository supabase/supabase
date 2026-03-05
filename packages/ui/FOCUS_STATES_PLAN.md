# Focus States Consolidation Plan

Related: [DEPR-354](https://linear.app/supabase/issue/DEPR-354/consolidate-focus-states-across-studio-and-ui-libraries)

## Goal

Standardize all focus states in `packages/ui` to use a single, consistent pattern for better UX and accessibility.

---

## Target Pattern

```css
/* Standard focus ring */
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
focus-visible:ring-offset-background
```

This is the shadcn default pattern. All components should converge to this.

---

## Phase 1: Define Focus Utilities

**Files to modify:**
- `packages/ui/src/lib/commonCva.ts`
- `packages/ui/tailwind.config.js` (if needed for CSS variable)

**Tasks:**

- [ ] 1.1 Create standardized focus class utilities in `commonCva.ts`:
  ```ts
  export const focusRing = `
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-ring
    focus-visible:ring-offset-2
  `

  export const focusRingInset = `
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-ring
    focus-visible:ring-inset
  `
  ```

- [ ] 1.2 Update `defaults.focus` and `defaults['focus-visible']` in both:
  - `src/lib/commonCva.ts`
  - `src/lib/theme/defaultTheme.ts`

### ✓ Verification Checkpoint 1
- [ ] `packages/ui/src/lib/commonCva.ts` exports `focusRing` utility
- [ ] No TypeScript errors when importing from commonCva

---

## Phase 2: Update Shadcn Components

**Goal:** Ensure all shadcn components use `focus-visible:` (not `focus:`) with consistent `ring-ring` color.

**Files to update:**

- [ ] 2.1 `src/components/shadcn/ui/select.tsx`
  - Change `focus:outline-none focus:ring-2 focus:ring-ring` → `focus-visible:...`

- [ ] 2.2 `src/components/shadcn/ui/dialog.tsx`
  - Change close button `focus:outline-none focus:ring-2` → `focus-visible:...`

- [ ] 2.3 `src/components/shadcn/ui/sheet.tsx`
  - Change close button `focus:outline-none focus:ring-2` → `focus-visible:...`

- [ ] 2.4 `src/components/shadcn/ui/input.tsx`
  - Change `ring-background-control` → `ring-ring` for consistency

- [ ] 2.5 `src/components/shadcn/ui/text-area.tsx`
  - Verify uses `ring-ring` (currently uses `ring-background-control`)

- [ ] 2.6 `src/components/shadcn/ui/radio-group.tsx`
  - Remove `focus:outline-none` (keep only `focus-visible:`)

- [ ] 2.7 `src/components/shadcn/ui/button.tsx`
  - Change `ring-foreground-muted` → `ring-ring`

### ✓ Verification Checkpoint 2
Check in **Storybook** or design system:
- [ ] **Select** - Tab to select, verify ring appears only on keyboard focus (not click)
- [ ] **Dialog** - Tab to close button, verify consistent ring
- [ ] **Sheet** - Tab to close button, verify consistent ring
- [ ] **Input** - Tab to input field, verify ring color matches other components
- [ ] **TextArea** - Tab to textarea, verify ring color matches Input
- [ ] **Button (shadcn)** - Tab through buttons, verify consistent ring
- [ ] **RadioGroup** - Tab to radio, verify no double focus indicators

---

## Phase 3: Update Custom Button Component

**File:** `src/components/Button/Button.tsx`

**Current pattern:**
```tsx
focus-visible:outline-4
focus-visible:outline-offset-1
focus-visible:outline-brand-600  // varies by button type
```

**Target pattern:**
```tsx
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

**Tasks:**

- [ ] 3.1 Replace outline-based focus with ring-based focus in `buttonVariants`

- [ ] 3.2 Remove per-variant focus colors (brand-600, border-strong, amber-700)
  - All variants should use `ring-ring` for consistency

- [ ] 3.3 Update `data-[state=open]:outline-*` to `data-[state=open]:ring-*` if needed

### ✓ Verification Checkpoint 3
Check in **Storybook**:
- [ ] **Button (primary)** - Ring instead of outline
- [ ] **Button (default)** - Same ring as primary
- [ ] **Button (secondary)** - Same ring color
- [ ] **Button (outline)** - Same ring color
- [ ] **Button (danger)** - Same ring color (no more amber)
- [ ] **Button (warning)** - Same ring color (no more amber)
- [ ] All button types have identical focus ring appearance

---

## Phase 4: Update defaultTheme.ts

**File:** `src/lib/theme/defaultTheme.ts`

This file contains the most focus patterns. Update each section:

- [ ] 4.1 Update `defaults.focus` (line ~25):
  ```ts
  focus: `outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
  ```

- [ ] 4.2 Update `defaults['focus-visible']` (line ~29)

- [ ] 4.3 Update accordion triggers (lines ~133, ~171)
  - Change `ring-foreground-light` → `ring-ring`

- [ ] 4.4 Update tabs (lines ~344-401)
  - Change `ring-foreground-muted` → `ring-ring`

- [ ] 4.5 Update input/select/inputNumber (lines ~437, ~481, ~527)
  - Standardize to `ring-ring`

- [ ] 4.6 Update checkbox (line ~581)
  - Change `ring-border-muted` → `ring-ring`

- [ ] 4.7 Update radio (line ~640)
  - Change `ring-brand-400` → `ring-ring`

- [ ] 4.8 Update toggle (line ~943)
  - Change `!ring-border` → `ring-ring`

- [ ] 4.9 Update popover trigger (lines ~1086-1087)
  - Change outline to ring

- [ ] 4.10 Update menu items (line ~1143)
  - Change `ring-foreground-muted` → `ring-ring`

- [ ] 4.11 Update listbox (lines ~1298-1321)
  - Standardize to `ring-ring`

### ✓ Verification Checkpoint 4
Check in **Storybook**:
- [ ] **Accordion** - Tab through triggers
- [ ] **Tabs** (underlined, pills, rounded-pills) - Tab through each variant
- [ ] **Input** (legacy) - Tab to input
- [ ] **Select** (legacy) - Tab to select
- [ ] **InputNumber** - Tab to input
- [ ] **Checkbox** (legacy) - Tab to checkbox
- [ ] **Radio** (legacy) - Tab through radio options
- [ ] **Toggle** - Tab to toggle
- [ ] **Popover** - Tab to trigger
- [ ] **Menu** - Tab through menu items
- [ ] **Listbox** - Tab to listbox

---

## Phase 5: Remove Legacy CSS Module Focus Styles & sbui Classes

> **Note:** `sbui-*` classes are legacy styling. Remove any encountered during this work.

**Files to update:**

- [ ] 5.1 `src/components/Listbox/SelectStyled.module.css`
  - Remove `.sbui-listbox:focus { box-shadow: ... }` (line ~27)

- [ ] 5.2 `src/components/InputNumber/InputNumber.module.css`
  - Remove `.sbui-inputnumber:focus { ... }` (line ~26)
  - Remove `.sbui-inputnumber:focus + .sbui-inputnumber-nav` (line ~47)

- [ ] 5.3 `src/components/Select/Select.module.css`
  - Remove `.sbui-select:focus { ... }` (line ~32)

- [ ] 5.4 Verify Input.module.css (mostly commented out, confirm safe)

- [ ] 5.5 Verify Checkbox.module.css (mostly commented out, confirm safe)

- [ ] 5.6 Verify Radio.module.css (mostly commented out, confirm safe)

**Also remove any unused `sbui-*` classes in:**
- `SelectStyled.module.css` - `.sbui-listbox`, `.sbui-listbox-*`
- `InputNumber.module.css` - `.sbui-inputnumber`, `.sbui-inputnumber-*`
- `Select.module.css` - `.sbui-select`, `.sbui-select-*`
- `Input.module.css` - `.sbui-input`, `.sbui-input-*`
- `Checkbox.module.css` - `.sbui-checkbox`, `.sbui-checkbox-*`
- `Radio.module.css` - `.sbui-radio`, `.sbui-radio-*`

### ✓ Verification Checkpoint 5
- [ ] **Listbox** - No green focus ring (was `rgba(62, 207, 142, 0.1)`)
- [ ] **InputNumber** - No green focus ring
- [ ] **Select (legacy)** - No green focus ring
- [ ] Grep for `box-shadow.*62.*207.*142` returns no results
- [ ] Grep for `sbui-` in modified CSS files returns minimal/no results

---

## Phase 6: Update Remaining Components

- [ ] 6.1 `src/components/TextLink/TextLink.tsx`
  - Change `ring-foreground-lighter` → `ring-ring`

- [ ] 6.2 `src/components/radio-group-stacked.tsx`
  - Verify uses `ring-ring`

- [ ] 6.3 `src/components/radio-group-card.tsx`
  - Verify uses `ring-ring`

- [ ] 6.4 `src/components/NavMenu/index.tsx`
  - Verify uses `ring-ring`

### ✓ Verification Checkpoint 6
- [ ] **TextLink** - Tab to link, verify ring color
- [ ] **RadioGroupStacked** - Tab through items
- [ ] **RadioGroupCard** - Tab through cards
- [ ] **NavMenu** - Tab through nav items

---

## Final Verification

### Visual Consistency Test
Open Storybook and tab through this sequence - ALL should have identical ring:
1. Button → Input → Select → Checkbox → Radio → Switch → Tabs → Accordion

### Grep Verification
Run these to confirm no inconsistent patterns remain:
```bash
# Should return 0 results (no legacy green focus)
grep -r "62, 207, 142" packages/ui/src

# Should return 0 results (no outline-based focus on buttons)
grep -r "focus-visible:outline-brand" packages/ui/src

# Should return 0 results (no focus: without focus-visible:)
grep -r "focus:ring-" packages/ui/src --include="*.tsx" | grep -v "focus-visible"

# Should return minimal results (legacy sbui classes removed)
grep -r "sbui-" packages/ui/src --include="*.css"
```

### Browser Test
Test keyboard navigation in Chrome, Firefox, Safari:
- [ ] Focus ring appears on Tab (keyboard)
- [ ] Focus ring does NOT appear on click (mouse)
- [ ] Ring color is consistent across all components

---

## Estimated Effort

| Phase | Files | Estimated Time |
|-------|-------|----------------|
| Phase 1 | 2 | 30 min |
| Phase 2 | 7 | 1 hour |
| Phase 3 | 1 | 30 min |
| Phase 4 | 1 (large) | 2 hours |
| Phase 5 | 6 | 1 hour |
| Phase 6 | 4 | 30 min |
| Final | - | 2 hours |
| **Total** | ~21 files | **~7-8 hours** |

---

## Risk Mitigation

1. **Visual regression**: Take screenshots before/after for comparison
2. **Safari tabIndex**: Some elements may need explicit `tabIndex={0}` for Safari keyboard focus
3. **Downstream impact**: Studio and other apps consume these components - coordinate release

---

## Success Criteria

- [ ] All focus states use `focus-visible:` (not `focus:`)
- [ ] All focus states use `ring-ring` color token
- [ ] All focus states use `ring-2` size
- [ ] All focus states use `ring-offset-2` (or `ring-inset` for specific cases)
- [ ] No hardcoded colors (green box-shadows removed)
- [ ] No unused `sbui-*` legacy classes
- [ ] Visual consistency when tabbing through any page

---

*Plan created: February 2026*
*Related audit: FOCUS_STATES_AUDIT.md*
