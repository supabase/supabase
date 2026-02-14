import { expect } from '@playwright/test'
import path from 'path'
import { env } from '../env.config.js'
import { test } from '../utils/test.js'
import { waitForApiResponse } from '../utils/wait-for-response.js'
import {
  createBucket,
  createFolder,
  deleteBucket,
  deleteItem,
  downloadFile,
  navigateToBucket,
  navigateToStorageFiles,
  renameItem,
  uploadFile,
} from '../utils/storage-helpers.js'
import {
  createBucket as createBucketViaApi,
  deleteBucket as deleteBucketViaApi,
} from '../utils/storage/index.js'

const bucketNamePrefix = 'pw_bucket'

test.describe('Storage', () => {
  test.beforeEach(async ({ page, ref }) => {
    await navigateToStorageFiles(page, ref)
  })

  test('can navigate to storage page', async ({ page, ref }) => {
    await expect(
      page.getByRole('button', { name: 'New bucket' }),
      'New bucket button should be visible'
    ).toBeVisible()

    // Verify we're on the storage files page
    await expect(page).toHaveURL(new RegExp(`/project/${ref}/storage/files`))
  })

  test('can create a private bucket', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_private`

    await deleteBucketViaApi(bucketName)
    await createBucket(page, ref, bucketName, false)

    // Verify it's marked as private (no "Public" badge should be visible)
    const bucketRow = page.getByRole('row').filter({ hasText: bucketName })
    await expect(bucketRow, 'Bucket row should be visible').toBeVisible()
    await expect(
      bucketRow.getByText('Public'),
      'Private bucket should not have Public badge'
    ).not.toBeVisible()
  })

  test('can create a public bucket', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_public`

    await deleteBucketViaApi(bucketName)
    await createBucket(page, ref, bucketName, true)

    // Verify it's marked as public - wait for the badge to appear
    const bucketRow = page.getByRole('row').filter({ hasText: bucketName })
    await expect(bucketRow, 'Bucket row should be visible').toBeVisible()

    // The Public badge should be visible within the bucket row
    await expect(
      bucketRow.getByText('Public', { exact: true }),
      'Bucket should be marked as Public'
    ).toBeVisible()
  })

  test('can edit bucket settings', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_edit`

    // Create a fresh private bucket via API
    await deleteBucketViaApi(bucketName)
    await createBucketViaApi(bucketName, false)
    await navigateToStorageFiles(page, ref)

    // Navigate to the bucket
    await navigateToBucket(page, ref, bucketName)

    // Open edit bucket dropdown
    await page.getByRole('button', { name: 'Edit bucket' }).click()
    await page.getByRole('menuitem', { name: 'Bucket settings' }).click()

    // Toggle public setting
    const publicToggle = page.getByRole('switch', { name: 'Public bucket' })
    await expect(publicToggle, 'Public toggle should be visible').toBeVisible()
    await publicToggle.click()

    // Save changes
    const apiPromise = waitForApiResponse(page, 'storage', ref, `buckets/${bucketName}`, {
      method: 'PATCH',
    })
    await page.getByRole('button', { name: 'Save' }).click()
    await apiPromise

    // Verify the bucket is now public
    await expect(
      page.getByText('Public').first(),
      'Bucket should now be marked as Public'
    ).toBeVisible()
  })

  test('can delete a bucket', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_delbkt`

    // Create a bucket via API
    await deleteBucketViaApi(bucketName)
    await createBucketViaApi(bucketName, false)
    await navigateToStorageFiles(page, ref)

    // Delete it via UI
    await deleteBucket(page, ref, bucketName)

    // Verify it's gone
    await expect(
      page.getByRole('row').filter({ hasText: bucketName }),
      'Bucket should not be visible after deletion'
    ).not.toBeVisible()
  })

  test('can search for buckets', async ({ page, ref }) => {
    const bucketName1 = `${bucketNamePrefix}_search_1`
    const bucketName2 = `${bucketNamePrefix}_search_2`

    // Create two buckets via API
    await deleteBucketViaApi(bucketName1)
    await deleteBucketViaApi(bucketName2)
    await createBucketViaApi(bucketName1, false)
    await createBucketViaApi(bucketName2, false)
    await navigateToStorageFiles(page, ref)

    // Search for first bucket
    const searchInput = page.getByPlaceholder('Search for a bucket')
    await searchInput.fill('search_1')

    // Verify only first bucket is visible
    await expect(
      page.getByRole('row').filter({ hasText: bucketName1 }),
      'First bucket should be visible in search results'
    ).toBeVisible()
    await expect(
      page.getByRole('row').filter({ hasText: bucketName2 }),
      'Second bucket should not be visible in search results'
    ).not.toBeVisible()

    // Clear search
    await searchInput.clear()

    // Verify both buckets are visible
    await expect(
      page.getByRole('row').filter({ hasText: bucketName1 }),
      'First bucket should be visible after clearing search'
    ).toBeVisible()
    await expect(
      page.getByRole('row').filter({ hasText: bucketName2 }),
      'Second bucket should be visible after clearing search'
    ).toBeVisible()
  })

  test('can upload a file', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_upload`
    const fileName = 'test-file.txt'

    // Create a bucket via API and navigate to it
    await deleteBucketViaApi(bucketName)
    await createBucketViaApi(bucketName, false)
    await navigateToStorageFiles(page, ref)
    await navigateToBucket(page, ref, bucketName)

    // Upload a file
    const filePath = path.join(import.meta.dirname, 'files', fileName)
    await uploadFile(page, filePath, fileName)
  })

  test('can create a folder', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_newfolder`
    const folderName = 'test_folder'

    // Create a bucket via API and navigate to it
    await deleteBucketViaApi(bucketName)
    await createBucketViaApi(bucketName, false)
    await navigateToStorageFiles(page, ref)
    await navigateToBucket(page, ref, bucketName)

    // Create a folder
    await createFolder(page, folderName)
  })

  test('can rename a file', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_rename_file`
    const fileName = 'test-file.txt'
    const newFileName = 'renamed-file.txt'

    // Create a bucket via API, navigate to it, and upload a file
    await deleteBucketViaApi(bucketName)
    await createBucketViaApi(bucketName, false)
    await navigateToStorageFiles(page, ref)
    await navigateToBucket(page, ref, bucketName)

    const filePath = path.join(import.meta.dirname, 'files', fileName)
    await uploadFile(page, filePath, fileName)

    // Rename the file
    await renameItem(page, fileName, newFileName)
  })

  test('can rename a folder', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_mvdir`
    const folderName = 'old_folder'
    const newFolderName = 'new_folder'

    // Create a bucket via API, navigate to it, and create a folder
    await deleteBucketViaApi(bucketName)
    await createBucketViaApi(bucketName, false)
    await navigateToStorageFiles(page, ref)
    await navigateToBucket(page, ref, bucketName)
    await createFolder(page, folderName)

    // Rename the folder
    await renameItem(page, folderName, newFolderName)
  })

  test('resets folder name when renaming with empty string', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_reset_enter`
    const folderName = 'folder_to_rename'

    // Create a bucket via API, navigate to it, and create a folder
    await deleteBucketViaApi(bucketName)
    await createBucketViaApi(bucketName, false)
    await navigateToStorageFiles(page, ref)
    await navigateToBucket(page, ref, bucketName)
    await createFolder(page, folderName)

    // Right-click on the folder to open context menu
    const folder = page.getByTitle(folderName)
    await expect(folder, `Folder ${folderName} should be visible`).toBeVisible()
    await folder.click({ button: 'right' })

    // Click rename option from context menu
    await page.getByRole('menuitem', { name: 'Rename' }).click()

    // Clear the input and press Enter with empty name
    const nameInput = page.getByRole('textbox')
    await expect(nameInput, 'Rename input should be visible').toBeVisible()
    await nameInput.clear()
    await nameInput.press('Enter')

    // Verify the input disappears (edit mode exits)
    await expect(nameInput, 'Input should disappear after pressing Enter').not.toBeVisible()

    // Verify the folder name is reset to original
    await expect(
      page.getByTitle(folderName),
      'Folder should retain its original name'
    ).toBeVisible()
  })

  test('resets folder name when clicking outside with empty string', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_reset_blur`
    const folderName = 'folder_to_blur'

    // Create a bucket via API, navigate to it, and create a folder
    await deleteBucketViaApi(bucketName)
    await createBucketViaApi(bucketName, false)
    await navigateToStorageFiles(page, ref)
    await navigateToBucket(page, ref, bucketName)
    await createFolder(page, folderName)

    // Right-click on the folder to open context menu
    const folder = page.getByTitle(folderName)
    await expect(folder, `Folder ${folderName} should be visible`).toBeVisible()
    await folder.click({ button: 'right' })

    // Click rename option from context menu
    await page.getByRole('menuitem', { name: 'Rename' }).click()

    // Clear the input and click outside to blur
    const nameInput = page.getByRole('textbox')
    await expect(nameInput, 'Rename input should be visible').toBeVisible()
    await nameInput.clear()

    // Click outside the input to trigger blur
    await page.getByRole('button', { name: 'Edit bucket' }).click()

    // Verify the folder name is reset to original
    await expect(
      page.getByTitle(folderName),
      'Folder should retain its original name after blur'
    ).toBeVisible()
  })

  test('can delete a file', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_delete_file`
    const fileName = 'test-file.txt'

    // Create a bucket via API, navigate to it, and upload a file
    await deleteBucketViaApi(bucketName)
    await createBucketViaApi(bucketName, false)
    await navigateToStorageFiles(page, ref)
    await navigateToBucket(page, ref, bucketName)

    const filePath = path.join(import.meta.dirname, 'files', fileName)
    await uploadFile(page, filePath, fileName)

    // Delete the file
    await deleteItem(page, fileName)
  })

  test('can delete a folder', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_delete_folder`
    const folderName = 'test_folder'

    // Create a bucket via API, navigate to it, and create a folder
    await deleteBucketViaApi(bucketName)
    await createBucketViaApi(bucketName, false)
    await navigateToStorageFiles(page, ref)
    await navigateToBucket(page, ref, bucketName)
    await createFolder(page, folderName)

    // Delete the folder
    await deleteItem(page, folderName)
  })

  test('can download a file', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_download`
    const fileName = 'test-file.txt'

    // Create a bucket via API, navigate to it, and upload a file
    await deleteBucketViaApi(bucketName)
    await createBucketViaApi(bucketName, false)
    await navigateToStorageFiles(page, ref)
    await navigateToBucket(page, ref, bucketName)

    const filePath = path.join(import.meta.dirname, 'files', fileName)
    await uploadFile(page, filePath, fileName)

    // Download the file
    await downloadFile(page, fileName)
  })
})

test.describe('Storage Settings - Self Hosted', () => {
  test.skip(env.IS_PLATFORM, 'Storage settings are only disabled on self-hosted')

  test('settings tab should not be visible in navigation', async ({ page, ref }) => {
    // Navigate to storage files page
    await page.goto(`/project/${ref}/storage/files`)

    // Wait for the page to load
    await expect(
      page.getByRole('button', { name: 'New bucket' }),
      'New bucket button should be visible'
    ).toBeVisible()

    // Verify Buckets and Policies tabs are visible but Settings is not
    // Use href patterns to avoid matching other "Settings" links in the sidebar
    await expect(
      page.getByRole('link', { name: 'Buckets' }).filter({ hasText: /^Buckets$/ }),
      'Buckets tab should be visible'
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Policies' }).filter({ hasText: /^Policies$/ }),
      'Policies tab should be visible'
    ).toBeVisible()
    await expect(
      page.locator(`a[href="/project/${ref}/storage/files/settings"]`),
      'Settings tab should NOT be visible for self-hosted'
    ).not.toBeVisible()
  })

  test('direct navigation to settings page should show error', async ({ page, ref }) => {
    // Navigate directly to the settings page
    await page.goto(`/project/${ref}/storage/files/settings`)

    // Should show an error message indicating settings are not available
    await expect(
      page.getByText('Storage settings are not available for self-hosted projects'),
      'Error message should be visible'
    ).toBeVisible()
  })
})
