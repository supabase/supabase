import { expect } from '@playwright/test'
import path from 'path'
import { test } from '../utils/test'
import { toUrl } from '../utils/to-url'
import { waitForApiResponse } from '../utils/wait-for-response'
import {
  createBucket,
  createFolder,
  deleteBucket,
  deleteItem,
  dismissToastsIfAny,
  downloadFile,
  moveItem,
  navigateToBucket,
  navigateToFolder,
  navigateToStorageFiles,
  renameItem,
  uploadFile,
} from '../utils/storage-helpers'

const bucketNamePrefix = 'pw_bucket'

test.describe.serial('Storage', () => {
  test.beforeAll(async ({ browser, ref }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    await navigateToStorageFiles(page, ref)

    // Clean up any existing test buckets
    const bucketLinks = page.getByRole('link').filter({ hasText: bucketNamePrefix })
    const count = await bucketLinks.count()

    for (let i = 0; i < count; i++) {
      const bucketName = await bucketLinks.nth(0).textContent()
      if (bucketName && bucketName.startsWith(bucketNamePrefix)) {
        await deleteBucket(page, ref, bucketName)
      }
    }

    await ctx.close()
  })

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

    await createBucket(page, ref, bucketName, false)

    // Verify it's marked as private (no "Public" badge should be visible)
    const bucketRow = page.getByRole('row').filter({ hasText: bucketName })
    await expect(bucketRow, 'Bucket row should be visible').toBeVisible()
    await expect(
      bucketRow.getByText('Public'),
      'Private bucket should not have Public badge'
    ).not.toBeVisible()

    // Clean up
    await deleteBucket(page, ref, bucketName)
  })

  test('can create a public bucket', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_public`

    await createBucket(page, ref, bucketName, true)

    // Verify it's marked as public - wait for the badge to appear
    const bucketRow = page.getByRole('row').filter({ hasText: bucketName })
    await expect(bucketRow, 'Bucket row should be visible').toBeVisible()

    // The Public badge should be visible within the bucket row
    await expect(
      bucketRow.getByText('Public', { exact: true }),
      'Bucket should be marked as Public'
    ).toBeVisible({ timeout: 10000 })

    // Clean up
    await deleteBucket(page, ref, bucketName)
  })

  test('can edit bucket settings', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_edit`

    // Create a private bucket
    await createBucket(page, ref, bucketName, false)

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
    ).toBeVisible({ timeout: 10_000 })

    // Clean up
    await deleteBucket(page, ref, bucketName)
  })

  test('can delete a bucket', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_delete`

    // Create a bucket
    await createBucket(page, ref, bucketName, false)

    // Delete it
    await deleteBucket(page, ref, bucketName)

    // Verify it's gone
    await expect(
      page.getByRole('link', { name: bucketName, exact: true }),
      'Bucket should not be visible after deletion'
    ).not.toBeVisible()
  })

  test('can search for buckets', async ({ page, ref }) => {
    const bucketName1 = `${bucketNamePrefix}_search_1`
    const bucketName2 = `${bucketNamePrefix}_search_2`

    // Create two buckets
    await createBucket(page, ref, bucketName1, false)
    await dismissToastsIfAny(page)
    await createBucket(page, ref, bucketName2, false)

    // Search for first bucket
    const searchInput = page.getByPlaceholder('Search for a bucket')
    await searchInput.fill('search_1')

    // Verify only first bucket is visible
    await expect(
      page.getByRole('link', { name: bucketName1, exact: true }),
      'First bucket should be visible in search results'
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: bucketName2, exact: true }),
      'Second bucket should not be visible in search results'
    ).not.toBeVisible()

    // Clear search
    await searchInput.clear()

    // Verify both buckets are visible
    await expect(
      page.getByRole('link', { name: bucketName1, exact: true }),
      'First bucket should be visible after clearing search'
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: bucketName2, exact: true }),
      'Second bucket should be visible after clearing search'
    ).toBeVisible()

    // Clean up
    await deleteBucket(page, ref, bucketName1)
    await deleteBucket(page, ref, bucketName2)
  })

  test('can upload a file', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_upload`
    const fileName = 'test-file.txt'

    // Create a bucket and navigate to it
    await createBucket(page, ref, bucketName, false)
    await navigateToBucket(page, ref, bucketName)

    // Upload a file
    const filePath = path.join(__dirname, 'files', fileName)
    await uploadFile(page, filePath, fileName)

    // Verify file is visible
    await expect(
      page.getByRole('button', { name: fileName }),
      'Uploaded file should be visible in explorer'
    ).toBeVisible()

    // Clean up
    await deleteBucket(page, ref, bucketName)
  })

  test('can create a folder', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_folder`
    const folderName = 'test_folder'

    // Create a bucket and navigate to it
    await createBucket(page, ref, bucketName, false)
    await navigateToBucket(page, ref, bucketName)

    // Create a folder
    await createFolder(page, folderName)

    // Verify folder is visible
    await expect(
      page.getByRole('button', { name: folderName }),
      'Folder should be visible in explorer'
    ).toBeVisible()

    // Clean up
    await deleteBucket(page, ref, bucketName)
  })

  test('can navigate folder structure', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_navigate`
    const folderName = 'parent_folder'
    const subFolderName = 'child_folder'

    // Create a bucket and navigate to it
    await createBucket(page, ref, bucketName, false)
    await navigateToBucket(page, ref, bucketName)

    // Create parent folder
    await createFolder(page, folderName)

    // Navigate into parent folder
    await navigateToFolder(page, folderName)

    // Verify we're in the folder (breadcrumb or URL should change)
    await expect(page).toHaveURL(new RegExp(`${folderName}`))

    // Create subfolder
    await createFolder(page, subFolderName)

    // Navigate into subfolder
    await navigateToFolder(page, subFolderName)

    // Verify we're in the subfolder
    await expect(page).toHaveURL(new RegExp(`${subFolderName}`))

    // Clean up
    await deleteBucket(page, ref, bucketName)
  })

  test('can rename a file', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_rename_file`
    const fileName = 'test-file.txt'
    const newFileName = 'renamed-file.txt'

    // Create a bucket, navigate to it, and upload a file
    await createBucket(page, ref, bucketName, false)
    await navigateToBucket(page, ref, bucketName)

    const filePath = path.join(__dirname, 'files', fileName)
    await uploadFile(page, filePath, fileName)

    // Rename the file
    await renameItem(page, fileName, newFileName)

    // Verify file was renamed
    await expect(
      page.getByRole('button', { name: newFileName }),
      'File should have new name'
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: fileName, exact: true }),
      'Old file name should not be visible'
    ).not.toBeVisible()

    // Clean up
    await deleteBucket(page, ref, bucketName)
  })

  test('can rename a folder', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_rename_folder`
    const folderName = 'old_folder'
    const newFolderName = 'new_folder'

    // Create a bucket, navigate to it, and create a folder
    await createBucket(page, ref, bucketName, false)
    await navigateToBucket(page, ref, bucketName)
    await createFolder(page, folderName)

    // Rename the folder
    await renameItem(page, folderName, newFolderName)

    // Verify folder was renamed
    await expect(
      page.getByRole('button', { name: newFolderName }),
      'Folder should have new name'
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: folderName, exact: true }),
      'Old folder name should not be visible'
    ).not.toBeVisible()

    // Clean up
    await deleteBucket(page, ref, bucketName)
  })

  test('can delete a file', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_delete_file`
    const fileName = 'test-file.txt'

    // Create a bucket, navigate to it, and upload a file
    await createBucket(page, ref, bucketName, false)
    await navigateToBucket(page, ref, bucketName)

    const filePath = path.join(__dirname, 'files', fileName)
    await uploadFile(page, filePath, fileName)

    // Delete the file
    await deleteItem(page, fileName)

    // Verify file was deleted
    await expect(
      page.getByRole('button', { name: fileName, exact: true }),
      'File should not be visible after deletion'
    ).not.toBeVisible()

    // Clean up
    await deleteBucket(page, ref, bucketName)
  })

  test('can delete a folder', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_delete_folder`
    const folderName = 'test_folder'

    // Create a bucket, navigate to it, and create a folder
    await createBucket(page, ref, bucketName, false)
    await navigateToBucket(page, ref, bucketName)
    await createFolder(page, folderName)

    // Delete the folder
    await deleteItem(page, folderName)

    // Verify folder was deleted
    await expect(
      page.getByRole('button', { name: folderName, exact: true }),
      'Folder should not be visible after deletion'
    ).not.toBeVisible()

    // Clean up
    await deleteBucket(page, ref, bucketName)
  })

  test.skip('can move a file to a folder', async ({ page, ref }) => {
    // This test is skipped because moveItem function needs to be fully tested and updated
    const bucketName = `${bucketNamePrefix}_move_file`
    const fileName = 'test-file.txt'
    const folderName = 'destination_folder'

    // Create a bucket, navigate to it
    await createBucket(page, ref, bucketName, false)
    await navigateToBucket(page, ref, bucketName)

    // Upload a file and create a folder
    const filePath = path.join(__dirname, 'files', fileName)
    await uploadFile(page, filePath, fileName)
    await createFolder(page, folderName)

    // Move file to folder
    await moveItem(page, fileName, folderName)

    // Navigate into folder
    await navigateToFolder(page, folderName)

    // Verify file is in the folder
    await expect(
      page.getByTitle(fileName),
      'File should be visible in destination folder'
    ).toBeVisible()

    // Clean up
    await deleteBucket(page, ref, bucketName)
  })

  test('can download a file', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_download`
    const fileName = 'test-file.txt'

    // Create a bucket, navigate to it, and upload a file
    await createBucket(page, ref, bucketName, false)
    await navigateToBucket(page, ref, bucketName)

    const filePath = path.join(__dirname, 'files', fileName)
    await uploadFile(page, filePath, fileName)

    // Download the file
    const download = await downloadFile(page, fileName)

    // Verify download occurred
    expect(download.suggestedFilename()).toBe(fileName)

    // Clean up
    await deleteBucket(page, ref, bucketName)
  })
})
