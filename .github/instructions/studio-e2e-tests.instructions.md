---
applyTo: 'e2e/studio/**,apps/studio/**'
---

# Studio E2E Test Review Rules

All comments are **advisory**.

## Selector Priority (best to worst)

1. **`getByRole` with accessible name** — most robust, tests accessibility

   ```typescript
   page.getByRole('button', { name: 'Save' })
   ```

2. **`getByTestId`** — stable, explicit test hooks

   ```typescript
   page.getByTestId('table-editor-side-panel')
   ```

3. **`getByText` with exact match** — good for unique text

   ```typescript
   page.getByText('Data API Access', { exact: true })
   ```

4. **`locator` with CSS** — use sparingly, more fragile
   ```typescript
   page.locator('[data-state="open"]')
   ```

## Patterns to Flag

- **XPath selectors** — fragile to DOM changes

  ```typescript
  // BAD
  locator('xpath=ancestor::div[contains(@class, "space-y")]')
  ```

- **Parent traversal with `locator('..')`** — breaks when structure changes

  ```typescript
  // BAD
  element.locator('..').getByRole('button')
  ```

- **`waitForTimeout`** — never use; wait for something specific instead

  ```typescript
  // BAD
  await page.waitForTimeout(1000)

  // GOOD — wait for UI element
  await expect(page.getByText('Success')).toBeVisible()

  // GOOD — wait for API response
  const apiPromise = waitForApiResponse(page, 'pg-meta', ref, 'query?key=table-create')
  await saveButton.click()
  await apiPromise
  ```

- **`force: true` on clicks** — make elements visible first instead

  ```typescript
  // BAD
  await menuButton.click({ force: true })

  // GOOD — hover to reveal, then click
  await tableRow.hover()
  await expect(menuButton).toBeVisible()
  await menuButton.click()
  ```

- **Broad `filter({ hasText })` on generic elements** — may match multiple elements; scope to specific containers instead

## Good Practices to Encourage

- Scope selectors to containers: `page.getByTestId('side-panel').getByRole('switch')`
- Add `aria-label` to icon-only buttons in source code for better test selectors
- Use `test.describe.configure({ mode: 'serial' })` for tests sharing database state
- Add messages to expects: `await expect(locator, 'why').toBeVisible({ timeout: 30000 })`

Canonical standard: `.claude/skills/studio-e2e-tests/SKILL.md`
