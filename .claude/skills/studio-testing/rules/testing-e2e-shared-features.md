---
title: E2E Tests for Self-Hosted and Platform Features
impact: HIGH
impactDescription: ensures critical shared features work across deployment targets
tags: testing, e2e, playwright, self-hosted, platform
---

## E2E Tests for Self-Hosted and Platform Features

If a feature exists in both self-hosted and the Supabase platform, create an
E2E test to cover it. E2E tests live in `e2e/studio/features/*.spec.ts`.

**What to cover in E2E tests:**

- Mouse/click interactions AND keyboard shortcuts (Tab, Enter, Escape, Arrow keys)
- Full user flows end-to-end
- Both adding and removing/clearing state
- Setup and teardown (create resources in `try`, clean up in `finally`)

**Incorrect (only tests mouse clicks):**

```ts
test('can add a filter', async ({ page }) => {
  await page.getByRole('button', { name: 'Add filter' }).click()
  await page.getByRole('option', { name: 'id' }).click()
  // ... only click-based interactions
})
```

**Correct (covers clicks AND keyboard shortcuts):**

```ts
test.describe('Basic Filter Operations', () => {
  test('can add a filter by clicking', async ({ page }) => {
    await addFilter(page, ref, 'id', 'equals', '1')
    await expect(page.getByTestId('filter-condition')).toBeVisible()
  })
})

test.describe('Keyboard Navigation - Freeform Input', () => {
  test('Enter selects column from suggestions', async ({ page }) => {
    await getFilterBarInput(page).press('Enter')
    await expect(page.getByTestId('operator-input')).toBeFocused()
  })

  test('Backspace on empty input highlights last condition', async ({ page }) => {
    await addFilter(page, ref, 'id', 'equals', '1')
    await getFilterBarInput(page).press('Backspace')
    await expect(page.getByTestId('filter-condition')).toHaveAttribute('data-highlighted', 'true')
  })

  test('Escape clears highlight', async ({ page }) => {
    // ...
    await getFilterBarInput(page).press('Escape')
    await expect(page.getByTestId('filter-condition')).toHaveAttribute('data-highlighted', 'false')
  })
})
```

**E2E helper pattern:** Extract reusable interactions into helper files at
`e2e/studio/utils/*-helpers.ts`:

```ts
// e2e/studio/utils/filter-bar-helpers.ts
export async function addFilter(page, ref, column, operator, value) {
  await selectColumnFilter(page, column)
  await selectOperator(page, column, operator)
  // ... fill value, wait for API response
}

export async function setupFilterBarPage(page, ref, editorUrl) {
  await page.goto(editorUrl)
  await enableFilterBar(page)
  await page.reload()
}
```

This keeps spec files focused on assertions while helpers handle the
interaction mechanics.

**Always use try/finally for resource cleanup:**

```ts
test('filters the table', async ({ page, ref }) => {
  const tableName = await createTable(page, ref)
  try {
    await setupFilterBarPage(page, ref, editorUrl)
    await navigateToTable(page, ref, tableName)
    await addFilter(page, ref, 'id', 'equals', '1')
    // assertions...
  } finally {
    await dropTable(page, ref, tableName)
  }
})
```

For E2E execution details (running tests, selectors, debugging), use the
`e2e-studio-tests` skill.
