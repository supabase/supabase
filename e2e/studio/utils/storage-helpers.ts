import { expect, Page } from '@playwright/test'
import { waitForApiResponse } from './wait-for-response.js'
import { toUrl } from './to-url.js'
import { dismissToastsIfAny } from './dismiss-toast.js'

/**
 * Navigates to a the storage home view
 * @param page - Playwright page instance
 * @param ref - Project reference
 */
export const navigateToStorageFiles = async (page: Page, ref: string) => {
  await page.goto(toUrl(`/project/${ref}/storage/files`))
  await page.waitForLoadState('networkidle')
}

/**
 * Creates a new storage bucket
 * @param page - Playwright page instance
 * @param ref - Project reference
 * @param bucketName - Name of the bucket to create
 * @param isPublic - Whether the bucket should be public (default: false)
 */
export const createBucket = async (
  page: Page,
  ref: string,
  bucketName: string,
  isPublic: boolean = false
) => {
  await navigateToStorageFiles(page, ref)
  // Check if bucket already exists
  const bucketRow = page.getByRole('row').filter({ hasText: bucketName })
  if ((await bucketRow.count()) > 0) return

  // Dismiss any toasts that might block the button
  await dismissToastsIfAny(page)

  // Click "New bucket" button
  const newBucketBtn = page.getByRole('button', { name: 'New bucket' })
  await expect(newBucketBtn, 'New bucket button should be visible').toBeVisible()
  await newBucketBtn.click()

  // Fill in bucket name
  const nameInput = page.getByRole('textbox', { name: 'Bucket name' })
  await expect(nameInput, 'Bucket name input should be visible').toBeVisible()
  await nameInput.fill(bucketName)

  // Toggle public setting if needed
  if (isPublic) {
    const publicToggle = page.getByRole('switch', { name: 'Public bucket' })
    await publicToggle.click()
  }

  // Wait for bucket creation API call and click create button
  const apiPromise = waitForApiResponse(page, 'storage', ref, 'bucket', { method: 'POST' })
  await page.getByRole('button', { name: 'Create' }).click()
  await apiPromise

  // Verify bucket was created - bucket appears in table row
  await expect(
    page.getByRole('row').filter({ hasText: bucketName }),
    `Bucket ${bucketName} should be visible after creation`
  ).toBeVisible()
}

/**
 * Deletes a storage bucket
 * @param page - Playwright page instance
 * @param ref - Project reference
 * @param bucketName - Name of the bucket to delete
 */
export const deleteBucket = async (page: Page, ref: string, bucketName: string) => {
  // Check if bucket exists
  const bucketRow = page.getByRole('row').filter({ hasText: bucketName })
  if ((await bucketRow.count()) === 0) return

  // Navigate to the bucket first
  await bucketRow.click()
  await page.waitForURL(new RegExp(`/storage/files/buckets/${bucketName}`))

  // Click "Edit bucket" dropdown
  await page.getByRole('button', { name: 'Edit bucket' }).click()

  // Click "Delete bucket" option from dropdown
  await page.getByRole('menuitem', { name: 'Delete bucket' }).click()

  // Type bucket name in the confirmation textbox (placeholder: "Type bucket name")
  const confirmInput = page.getByPlaceholder('Type bucket name')
  await expect(confirmInput, 'Confirmation input should be visible').toBeVisible({
    timeout: 15_000,
  })
  await confirmInput.fill(bucketName)

  // Wait for API call and click Delete bucket button
  const apiPromise = waitForApiResponse(page, 'storage', ref, `buckets/${bucketName}`, {
    method: 'DELETE',
  })
  await page.getByRole('button', { name: 'Delete bucket' }).click()
  await apiPromise

  // Verify bucket was deleted - should redirect to files page
  await expect(page, 'Should redirect to storage files page after deletion').toHaveURL(
    new RegExp(`/storage/files$`)
  )

  // Verify bucket is no longer in the list
  await expect(
    page.getByRole('row').filter({ hasText: bucketName }),
    `Bucket ${bucketName} should not be visible after deletion`
  ).not.toBeVisible()
}

/**
 * Navigates to a specific bucket
 * @param page - Playwright page instance
 * @param ref - Project reference
 * @param bucketName - Name of the bucket to navigate to
 */
export const navigateToBucket = async (page: Page, ref: string, bucketName: string) => {
  // Identify the bucket row to click
  const bucketRow = page.getByRole('row').filter({ hasText: bucketName })
  await expect(bucketRow, `Bucket row for ${bucketName} should be visible`).toBeVisible()

  // Wait for the objects list API request to complete
  const objectsListPromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/platform/storage/${ref}/buckets/${bucketName}/objects/list`) &&
      response.request().method() === 'POST' &&
      (response.status() === 200 || response.status() === 201)
  )

  await bucketRow.click()

  // Wait for the API response
  await objectsListPromise

  // Verify we're in the bucket by checking the breadcrumb or "Edit bucket" button
  await expect(
    page.getByRole('button', { name: 'Edit bucket' }),
    `Should be in bucket ${bucketName}`
  ).toBeVisible()
}

/**
 * Creates a new folder in the current bucket
 * @param page - Playwright page instance
 * @param folderName - Name of the folder to create
 */
export const createFolder = async (page: Page, folderName: string) => {
  // Click "Create folder" button
  const createFolderBtn = page.getByRole('button', { name: 'Create folder' })
  await expect(createFolderBtn, 'Create folder button should be visible').toBeVisible()
  await createFolderBtn.click()

  // A textbox with "Untitled folder" appears - type the new name
  const nameInput = page.getByRole('textbox')
  await expect(nameInput, 'Folder name input should be visible').toBeVisible()
  await nameInput.fill(folderName)
  await nameInput.press('Enter')

  // Wait for folder to appear in the list
  await expect(
    page.getByTitle(folderName),
    `Folder ${folderName} should be visible after creation`
  ).toBeVisible()
}

/**
 * Uploads a file to the current folder
 * @param page - Playwright page instance
 * @param filePath - Absolute path to the file to upload
 * @param fileName - Expected file name (for verification)
 */
export const uploadFile = async (page: Page, filePath: string, fileName: string) => {
  // Find the hidden file input and upload the file
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(filePath)

  // Wait for upload to complete - file should appear in the explorer
  await page.waitForTimeout(15_000) // Allow time for upload to process

  // Verify file appears in the explorer by title
  await expect(
    page.getByTitle(fileName),
    `File ${fileName} should be visible in explorer after upload`
  ).toBeVisible()
}

/**
 * Deletes a file or folder from the current location
 * @param page - Playwright page instance
 * @param itemName - Name of the file or folder to delete
 */
export const deleteItem = async (page: Page, itemName: string) => {
  // Right-click on the item to open context menu
  const item = page.getByTitle(itemName)
  await expect(item, `Item ${itemName} should be visible`).toBeVisible()
  await item.click({ button: 'right' })

  // Click delete option from context menu
  await page.getByRole('menuitem', { name: 'Delete' }).click()

  // Confirm deletion in the modal
  await page.getByRole('button', { name: 'Submit' }).click()

  // Wait for deletion to complete
  await page.waitForTimeout(1000)
  await expect(
    page.getByTitle(itemName),
    `Item ${itemName} should not be visible after deletion`
  ).not.toBeVisible()
}

/**
 * Renames a file or folder
 * @param page - Playwright page instance
 * @param oldName - Current name of the item
 * @param newName - New name for the item
 */
export const renameItem = async (page: Page, oldName: string, newName: string) => {
  // Right-click on the item to open context menu
  const item = page.getByTitle(oldName)
  await expect(item, `Item ${oldName} should be visible`).toBeVisible()
  await item.click({ button: 'right' })

  // Click rename option from context menu
  await page.getByRole('menuitem', { name: 'Rename' }).click()

  // A textbox appears - clear and type new name
  const nameInput = page.getByRole('textbox')
  await nameInput.fill(newName)
  await nameInput.press('Enter')

  // Wait for rename to complete
  await page.waitForTimeout(1000)

  // Verify item was renamed
  await expect(page.getByTitle(newName), `Item should be renamed to ${newName}`).toBeVisible({
    timeout: 30_000,
  })
  await expect(
    page.getByTitle(oldName),
    `Old name ${oldName} should not be visible after rename`
  ).not.toBeVisible()
}

/**
 * Downloads a file and returns the download object
 * @param page - Playwright page instance
 * @param fileName - Name of the file to download
 */
export const downloadFile = async (page: Page, fileName: string) => {
  // Right-click on the file to open context menu
  const file = page.getByTitle(fileName)
  await expect(file, `File ${fileName} should be visible`).toBeVisible()
  await file.click({ button: 'right' })

  // Click download option from context menu
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('menuitem', { name: 'Download' }).click()

  // Wait for and return the download
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain(fileName)
}

export const deleteAllBuckets = async (page: Page, ref: string) => {
  await navigateToStorageFiles(page, ref)

  // Find all bucket rows and collect their IDs
  const bucketRows = await page.locator('[data-bucket-id]').all()
  const bucketIds = await Promise.all(bucketRows.map((row) => row.getAttribute('data-bucket-id')))

  // Delete each bucket
  for (const bucketId of bucketIds) {
    if (bucketId) {
      await deleteBucket(page, ref, bucketId)
    }
  }
}
