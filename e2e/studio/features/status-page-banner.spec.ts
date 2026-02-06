import { expect } from '@playwright/test'

import { test } from '../utils/test.js'
import { toUrl } from '../utils/to-url.js'

// Mock incident data - impact is "major" (not "none" or "maintenance")
const mockIncident = {
  id: 'incident-123',
  name: 'Test Incident',
  status: 'investigating',
  impact: 'major',
  active_since: new Date().toISOString(),
}

// Mock incident with "none" impact - should NOT trigger the incident banner
const mockIncidentNoneImpact = {
  id: 'incident-none-456',
  name: 'No Impact Incident',
  status: 'investigating',
  impact: 'none',
  active_since: new Date().toISOString(),
}

// Mock maintenance event - impact is "maintenance"
const mockMaintenance = {
  id: 'maintenance-789',
  name: 'Scheduled Maintenance',
  status: 'in_progress',
  impact: 'maintenance',
  active_since: new Date().toISOString(),
}

test.describe('StatusPageBanner', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    // Clear any dismissed banner state from localStorage before each test
    await page.addInitScript(() => {
      // Clear all incident/maintenance banner dismissals and test overrides
      for (const key of Object.keys(localStorage)) {
        if (
          key.startsWith('incident-banner-dismissed-') ||
          key.startsWith('maintenance-banner-dismissed-')
        ) {
          localStorage.removeItem(key)
        }
      }
    })
  })

  test('incident banner shows for incidents with impact not equal to "none"', async ({
    page,
    ref,
  }) => {
    // Mock the incident status API to return an incident with major impact
    await page.route('**/api/incident-status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockIncident]),
      })
    })

    await page.goto(toUrl(`/project/${ref}`))

    // Wait for the incident banner to be visible
    const incidentBanner = page.getByText('We are investigating a technical issue')
    await expect(incidentBanner).toBeVisible({ timeout: 15000 })

    // Verify the dismiss button IS present for real incidents
    const dismissButton = page.getByRole('button', { name: 'Dismiss banner' })
    await expect(dismissButton).toBeVisible()
  })

  test('incident banner does NOT show for incidents with impact "none"', async ({ page, ref }) => {
    // Mock the incident status API to return an incident with "none" impact
    await page.route('**/api/incident-status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockIncidentNoneImpact]),
      })
    })

    await page.goto(toUrl(`/project/${ref}`))

    // Wait for page to load
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 })

    // Verify the incident banner is NOT visible
    const incidentBanner = page.getByText('We are investigating a technical issue')
    await expect(incidentBanner).not.toBeVisible()
  })

  test('incident banner takes precedence over maintenance banner', async ({ page, ref }) => {
    // Mock the incident status API to return both an incident and a maintenance event
    await page.route('**/api/incident-status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockIncident, mockMaintenance]),
      })
    })

    await page.goto(toUrl(`/project/${ref}`))

    // Wait for the incident banner to be visible
    const incidentBanner = page.getByText('We are investigating a technical issue')
    await expect(incidentBanner).toBeVisible({ timeout: 15000 })

    // Verify the maintenance banner is NOT visible (incident takes precedence)
    const maintenanceBanner = page.getByText('Scheduled maintenance is in progress')
    await expect(maintenanceBanner).not.toBeVisible()
  })

  test('maintenance banner shows after dismissing incident banner when both exist', async ({
    page,
    ref,
  }) => {
    // Mock the incident status API to return both an incident and a maintenance event
    await page.route('**/api/incident-status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockIncident, mockMaintenance]),
      })
    })

    await page.goto(toUrl(`/project/${ref}`))

    // Wait for the incident banner to be visible
    const incidentBanner = page.getByText('We are investigating a technical issue')
    await expect(incidentBanner).toBeVisible({ timeout: 15000 })

    // Click the dismiss button to dismiss the incident banner
    const dismissButton = page.getByRole('button', { name: 'Dismiss banner' })
    await expect(dismissButton).toBeVisible()
    await dismissButton.click()

    // Wait for the incident banner to disappear
    await expect(incidentBanner).not.toBeVisible({ timeout: 5000 })

    // Verify the maintenance banner is now visible
    const maintenanceBanner = page.getByText('Scheduled maintenance is in progress')
    await expect(maintenanceBanner).toBeVisible({ timeout: 5000 })
  })

  test('maintenance banner is dismissible', async ({ page, ref }) => {
    // Mock the incident status API to return only a maintenance event
    await page.route('**/api/incident-status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockMaintenance]),
      })
    })

    await page.goto(toUrl(`/project/${ref}`))

    // Wait for the maintenance banner to be visible
    const maintenanceBanner = page.getByText('Scheduled maintenance is in progress')
    await expect(maintenanceBanner).toBeVisible({ timeout: 15000 })

    // Verify the dismiss button is present
    const dismissButton = page.getByRole('button', { name: 'Dismiss banner' })
    await expect(dismissButton).toBeVisible()

    // Dismiss the maintenance banner
    await dismissButton.click()

    // Verify the maintenance banner is no longer visible
    await expect(maintenanceBanner).not.toBeVisible({ timeout: 5000 })
  })
})
