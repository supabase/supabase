import { expect, Page } from '@playwright/test'
import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

const cronJobName = 'pw_cron_test_job'

/**
 * Helper to enable the pg_cron extension if it's not already enabled.
 * Must be called when on the cron overview page.
 */
const ensurePgCronEnabled = async (page: Page) => {
  // Wait for the page content to load and the Required extensions section to appear
  await page.waitForSelector('h1:has-text("Cron")', { timeout: 30000 })
  await expect(page.getByRole('heading', { name: 'Required extensions' })).toBeVisible({
    timeout: 30000,
  })

  // Wait for the page to finish loading the extension status
  // Look for the listitem containing pg_cron - it will have either "Enable pg_cron" button or "Installed" text
  const pgCronListItem = page
    .getByRole('listitem')
    .filter({ has: page.locator('code:has-text("pg_cron")') })
  const enableButton = pgCronListItem.getByRole('button', { name: 'Enable pg_cron' })
  const installedText = pgCronListItem.getByText('Installed')
  await expect(enableButton.or(installedText)).toBeVisible({ timeout: 30000 })

  // Check if we need to enable pg_cron
  if ((await enableButton.count()) > 0) {
    await enableButton.click()

    // Wait for the extension enable modal
    await expect(page.getByRole('heading', { name: 'Enable pg_cron' })).toBeVisible({
      timeout: 5000,
    })

    await page.getByRole('button', { name: 'Enable extension' }).click()

    // Wait for success toast
    await expect(page.getByText(/Extension.*pg_cron.*is now enabled/)).toBeVisible({
      timeout: 15000,
    })
  }

  await expect(page.getByRole('link', { name: 'Jobs' })).toBeVisible({ timeout: 10000 })
}

/**
 * Helper to navigate to the cron overview page and ensure pg_cron is enabled.
 */
const navigateToCronOverviewAndEnable = async (page: Page, ref: string) => {
  await page.goto(toUrl(`/project/${ref}/integrations/cron/overview`))
  await ensurePgCronEnabled(page)
}

/**
 * Helper to navigate to the cron jobs page and wait for it to load.
 * Assumes pg_cron is already enabled.
 */
const navigateToCronJobsPage = async (page: Page, ref: string) => {
  await page.goto(toUrl(`/project/${ref}/integrations/cron/jobs`))
  await expect(page.getByRole('grid')).toBeVisible({ timeout: 30000 })
}

/**
 * Helper to delete a cron job by name.
 * The delete modal requires typing the job name for confirmation.
 * Uses right-click context menu to access the delete option.
 * Waits for the row to be removed from the grid after deletion.
 */
const deleteCronJob = async (page: Page, jobName: string) => {
  // Find the row and right-click to open context menu
  const jobRow = page.getByRole('row', { name: new RegExp(jobName) })
  await jobRow.click({ button: 'right' })

  // Click "Delete job" in the context menu
  await page.getByRole('menuitem', { name: 'Delete job' }).click()

  // The modal requires typing the job name - fill it in
  await expect(page.getByRole('heading', { name: 'Delete this cron job' })).toBeVisible()
  await page.getByPlaceholder('Type in name of cron job').fill(jobName)

  // Click the delete button
  await page.getByRole('button', { name: `Delete cron job ${jobName}` }).click()

  // Wait for success toast and for the row to be removed from the grid
  await expect(page.getByText(/Successfully removed cron job/)).toBeVisible({ timeout: 10000 })
  await expect(jobRow).not.toBeVisible({ timeout: 10000 })
}

test.describe('Cron Jobs Integration', () => {
  // Run CRUD tests serially since they share database state (pg_cron extension)
  test.describe.configure({ mode: 'serial' })

  test.describe('Cron Jobs CRUD Operations', () => {
    let page: Page

    test.beforeAll(async ({ browser, ref }) => {
      page = await browser.newPage()

      // Navigate to cron overview first to ensure extension is enabled
      await navigateToCronOverviewAndEnable(page, ref)

      // Navigate to jobs page
      await navigateToCronJobsPage(page, ref)

      // Clean up any existing test jobs
      while ((await page.getByRole('row', { name: new RegExp(cronJobName) }).count()) > 0) {
        await deleteCronJob(page, cronJobName)
      }
    })

    test.afterAll(async () => {
      // Clean up test jobs
      try {
        while ((await page.getByRole('row', { name: new RegExp(cronJobName) }).count()) > 0) {
          await deleteCronJob(page, cronJobName)
        }
      } catch {
        // Ignore cleanup errors
      }
    })

    test('can view cron jobs page', async ({ ref }) => {
      await navigateToCronJobsPage(page, ref)

      // Verify the page elements
      await expect(page.getByRole('button', { name: 'Create job' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible()
      await expect(page.getByPlaceholder('Search for a job')).toBeVisible()
    })

    test('can create a new cron job', async ({ ref }) => {
      await navigateToCronJobsPage(page, ref)

      // Click create job button
      await page.getByRole('button', { name: 'Create job' }).click()

      // Wait for the dialog to open
      await expect(page.getByRole('heading', { name: 'Create a new cron job' })).toBeVisible()

      // Fill in job name using the input name attribute
      await page.locator('input[name="name"]').fill(cronJobName)

      // Click the "Every minute" preset button to set schedule
      await page.getByRole('button', { name: 'Every minute' }).click()

      // Fill in the SQL command using the Monaco editor
      await page.getByRole('code').click()
      await page.getByRole('textbox', { name: /Editor content/ }).fill("SELECT 'test';")

      // Save the job
      await page.getByRole('button', { name: 'Create cron job' }).click()

      // Wait for success toast
      await expect(page.getByText(/Successfully created cron job/)).toBeVisible({ timeout: 10000 })

      // Verify the job appears in the list
      await expect(page.getByRole('row', { name: new RegExp(cronJobName) })).toBeVisible()
    })

    test('can search for cron jobs', async ({ ref }) => {
      await navigateToCronJobsPage(page, ref)

      // Search for the test job
      const searchInput = page.getByPlaceholder('Search for a job')
      await searchInput.fill(cronJobName)
      await searchInput.press('Enter')

      // Should find the job
      await expect(page.getByRole('row', { name: new RegExp(cronJobName) })).toBeVisible()

      // Search for non-existent job
      await searchInput.fill('nonexistent_job_xyz_12345')
      await searchInput.press('Enter')

      // Should show empty state
      await expect(page.getByText('No cron jobs found')).toBeVisible()

      // Clear search by clearing the input
      await searchInput.clear()
      await searchInput.press('Enter')
    })

    test('can edit a cron job', async ({ ref }) => {
      await navigateToCronJobsPage(page, ref)

      // Find the test job row and right-click to open context menu
      const jobRow = page.getByRole('row', { name: new RegExp(cronJobName) })
      await jobRow.click({ button: 'right' })

      // Click "Edit job" in the context menu
      await page.getByRole('menuitem', { name: 'Edit job' }).click()

      // Wait for the edit sheet to open
      await expect(page.getByRole('heading', { name: `Edit ${cronJobName}` })).toBeVisible()

      // Note: Job names cannot be changed after creation, so we'll verify we can change the schedule
      // Click a different schedule preset
      await page.getByRole('button', { name: 'Every 5 minutes' }).click()

      // Save the changes
      await page.getByRole('button', { name: 'Save cron job' }).click()

      // Wait for success toast
      await expect(page.getByText(/Successfully updated cron job/)).toBeVisible({ timeout: 10000 })
    })

    test('can view cron job run history', async ({ ref }) => {
      await navigateToCronJobsPage(page, ref)

      // Click on the job row to view history (click on the name cell, not the action button)
      const jobRow = page.getByRole('row', { name: new RegExp(cronJobName) })
      await jobRow.getByRole('gridcell', { name: cronJobName }).click()

      // Should navigate to the job detail page
      await page.waitForURL(/.*\/integrations\/cron\/jobs\/\d+/)

      // Verify we're on the job history page - should show the job name in the heading
      await expect(page.getByRole('heading', { name: cronJobName })).toBeVisible()

      // Go back to jobs list
      await page.goBack()
      await page.waitForLoadState('networkidle')
    })

    test('can delete a cron job', async ({ ref }) => {
      await navigateToCronJobsPage(page, ref)

      // Delete the test job
      await deleteCronJob(page, cronJobName)

      // Verify the job is no longer in the list
      await expect(page.getByRole('row', { name: new RegExp(cronJobName) })).not.toBeVisible()
    })
  })

  test.describe('Cron Jobs Page Features', () => {
    test('refresh button reloads cron jobs', async ({ page, ref }) => {
      await navigateToCronOverviewAndEnable(page, ref)
      await navigateToCronJobsPage(page, ref)

      // Click refresh - it should not throw an error
      await page.getByRole('button', { name: 'Refresh' }).click()

      // The grid should still be visible after refresh
      await expect(page.getByRole('grid')).toBeVisible()
    })

    test('navigation tabs work correctly', async ({ page, ref }) => {
      await navigateToCronOverviewAndEnable(page, ref)

      // Click on Jobs tab
      await page.getByRole('link', { name: 'Jobs' }).click()
      await page.waitForURL(/.*\/integrations\/cron\/jobs/)

      // Verify we're on the jobs page
      await expect(page.getByRole('button', { name: 'Create job' })).toBeVisible()

      // Click on Overview tab (use exact match to avoid ambiguity)
      await page.getByRole('link', { name: 'Overview', exact: true }).click()
      await page.waitForURL(/.*\/integrations\/cron\/overview/)

      // Verify we're on the overview page
      await expect(page.getByText('Schedule recurring Jobs in Postgres')).toBeVisible()
    })
  })
})

test.describe('High Query Cost Banner', () => {
  const testJobName = 'pw_high_cost_test_job'

  test.describe.configure({ mode: 'serial' })

  test('shows banner and still displays cron jobs when query cost exceeds threshold', async ({
    page,
    ref,
  }) => {
    // First ensure pg_cron is enabled
    await navigateToCronOverviewAndEnable(page, ref)
    await navigateToCronJobsPage(page, ref)

    // Check if test job already exists (from previous test run)
    const existingTestJob = page.getByRole('row', { name: new RegExp(testJobName) })
    const jobExists = (await existingTestJob.count()) > 0

    // Create a test cron job only if it doesn't exist
    if (!jobExists) {
      await page.getByRole('button', { name: 'Create job' }).click()
      await expect(page.getByRole('heading', { name: 'Create a new cron job' })).toBeVisible()
      await page.locator('input[name="name"]').fill(testJobName)
      await page.getByRole('button', { name: 'Every minute' }).click()
      await page.getByRole('code').click()
      await page.getByRole('textbox', { name: /Editor content/ }).fill("SELECT 'high_cost_test';")
      await page.getByRole('button', { name: 'Create cron job' }).click()
      await expect(page.getByText(/Successfully created cron job/)).toBeVisible({ timeout: 10000 })
    }

    // Now set up the mock for the EXPLAIN query (preflight check) to return high cost
    // This simulates the scenario where cron.job_run_details is too large
    await page.route('**/pg-meta/*/query**', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()

      // Intercept EXPLAIN queries for the cron jobs query (the preflight check)
      if (
        postData?.query?.toLowerCase().startsWith('explain') &&
        postData?.query?.includes('cron.job')
      ) {
        // Return a mock EXPLAIN result with very high cost (over 100,000 threshold)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { 'QUERY PLAN': 'Nested Loop Left Join  (cost=0.00..500000.00 rows=1000000 width=100)' },
          ]),
        })
      } else {
        await route.continue()
      }
    })

    // Navigate to the cron jobs page - this will trigger the mocked preflight check
    await page.goto(toUrl(`/project/${ref}/integrations/cron/jobs`))

    // Wait for the grid to load - this verifies cron jobs are still visible in minimal mode
    await expect(page.getByRole('grid')).toBeVisible({ timeout: 30000 })

    // Should show the overflow banner (minimal mode indicator)
    await expect(
      page.getByText('Last run for each cron job omitted due to high query cost')
    ).toBeVisible({
      timeout: 15000,
    })

    // The test job should still be visible in the grid (minimal mode shows jobs without last run)
    await expect(page.getByRole('row', { name: new RegExp(testJobName) })).toBeVisible()

    // The "Learn more" button should be visible
    await expect(page.getByRole('button', { name: 'Learn more' })).toBeVisible()

    // Remove the route mock for subsequent tests
    await page.unroute('**/pg-meta/*/query**')
  })

  test('Learn more dialog shows cleanup options', async ({ page, ref }) => {
    // Set up the mock again for this test
    await page.route('**/pg-meta/*/query**', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()

      if (
        postData?.query?.toLowerCase().startsWith('explain') &&
        postData?.query?.includes('cron.job')
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { 'QUERY PLAN': 'Nested Loop Left Join  (cost=0.00..500000.00 rows=1000000 width=100)' },
          ]),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto(toUrl(`/project/${ref}/integrations/cron/jobs`))

    // Wait for the banner to appear
    await expect(
      page.getByText('Last run for each cron job omitted due to high query cost')
    ).toBeVisible({
      timeout: 15000,
    })

    // Click the "Learn more" button to open the dialog
    await page.getByRole('button', { name: 'Learn more' }).click()

    // The dialog should open with the explanation
    await expect(
      page.getByRole('heading', { name: 'Last run for cron jobs omitted for overview' })
    ).toBeVisible()

    // Should explain the issue
    await expect(
      page.getByText(/the estimated query cost exceeds safety thresholds/)
    ).toBeVisible()

    // Should show Step 1 with cleanup options
    await expect(page.getByText('Step 1: Delete older entries')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Delete rows now' })).toBeVisible()

    // Should show the interval selector
    await expect(page.getByRole('combobox')).toBeVisible()

    // Should show Step 2 (disabled until step 1 is complete)
    await expect(page.getByText('Step 2: Schedule an automated cleanup')).toBeVisible()
    await expect(
      page.getByText('Complete step 1 to enable scheduling a daily cleanup job')
    ).toBeVisible()

    // Remove the route mock
    await page.unroute('**/pg-meta/*/query**')
  })

  test('cleanup workflow: delete rows and schedule cleanup job', async ({ page, ref }) => {
    // Set up the mock for the high cost scenario
    await page.route('**/pg-meta/*/query**', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()

      if (
        postData?.query?.toLowerCase().startsWith('explain') &&
        postData?.query?.includes('cron.job')
      ) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { 'QUERY PLAN': 'Nested Loop Left Join  (cost=0.00..500000.00 rows=1000000 width=100)' },
          ]),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto(toUrl(`/project/${ref}/integrations/cron/jobs`))

    // Wait for the banner and click Learn more
    await expect(
      page.getByText('Last run for each cron job omitted due to high query cost')
    ).toBeVisible({
      timeout: 15000,
    })
    await page.getByRole('button', { name: 'Learn more' }).click()

    // Wait for dialog to open
    await expect(
      page.getByRole('heading', { name: 'Last run for cron jobs omitted for overview' })
    ).toBeVisible()

    // Step 1: Click "Delete rows now" to run the cleanup
    await page.getByRole('button', { name: 'Delete rows now' }).click()

    // Wait for Step 1 to complete - should show success message
    // Note: In a fresh DB, there might be 0 rows deleted, which is still success
    await expect(page.getByText(/Successfully deleted \d+ rows/)).toBeVisible({ timeout: 30000 })

    // Step 2 should now be enabled - the "Schedule cleanup job" button should be visible
    await expect(page.getByRole('button', { name: 'Schedule cleanup job' })).toBeVisible()

    // Should show the SQL preview for the cleanup job
    await expect(page.getByText(/cron\.schedule/)).toBeVisible()

    // Click "Schedule cleanup job"
    await page.getByRole('button', { name: 'Schedule cleanup job' }).click()

    // Wait for Step 2 to complete - should show success message
    await expect(page.getByText('Daily cleanup job scheduled successfully')).toBeVisible({
      timeout: 15000,
    })

    // Clean up: remove the route mock
    await page.unroute('**/pg-meta/*/query**')

    // Note: Test jobs (pw_high_cost_test_job, delete-job-run-details) will be cleaned up
    // in the next test run by the CRUD tests' beforeAll cleanup, or manually.
    // Attempting to delete here causes pointer events issues with Radix dialogs.
  })
})
