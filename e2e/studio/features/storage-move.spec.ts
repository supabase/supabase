import { expect, type Page } from '@playwright/test'

import {
  confirmMove,
  navigateToBucket,
  navigateToStorageFiles,
  openMoveDialog,
} from '../utils/storage-helpers.js'
import { deleteBucket as deleteBucketViaApi, seedBucket } from '../utils/storage/index.js'
import { test } from '../utils/test.js'

const bucketNamePrefix = 'pw_move'

/**
 * Seeds a bucket from scratch and lands the explorer inside it. Each test uses its own bucket so
 * the file can run in parallel with the rest of the suite.
 */
const setUpBucket = async (page: Page, ref: string, bucketName: string, objectPaths: string[]) => {
  await deleteBucketViaApi(bucketName)
  await seedBucket(bucketName, objectPaths)
  await navigateToStorageFiles(page, ref)
  await navigateToBucket(page, ref, bucketName)
}

test.describe('Storage move file', () => {
  test('moves a file into a folder picked from the explorer', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_basic`
    const fileName = 'move-me.txt'

    await setUpBucket(page, ref, bucketName, [fileName, 'docs/seed.txt'])

    const dialog = await openMoveDialog(page, fileName)
    const folderList = dialog.getByTestId('folder-picker-list')

    // The destination starts at the bucket root, so the file is already there
    await expect(
      dialog.getByText(`Moving to ${bucketName}`, { exact: true }),
      'Destination should start at the bucket root'
    ).toBeVisible()

    await folderList.getByRole('button', { name: 'docs' }).click()

    await expect(
      dialog.getByText(`Moving to ${bucketName}/docs`, { exact: true }),
      'Destination should follow the folder that was opened'
    ).toBeVisible()

    await confirmMove(page, ref, 'docs')

    await expect(
      page.getByText(/Successfully moved/),
      'A success toast should confirm the move'
    ).toBeVisible()
    await expect(
      page.getByTitle(fileName),
      'File should no longer sit at the bucket root'
    ).not.toBeVisible()

    // Open the destination folder and confirm the file landed there
    await page.getByTitle('docs').click()
    await expect(
      page.getByTitle(fileName),
      'File should be inside the destination folder'
    ).toBeVisible()
  })

  test('offers folders only, never files, as destinations', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_folders_only`
    const fileName = 'picker-source.txt'
    const siblingFileName = 'sibling.txt'

    await setUpBucket(page, ref, bucketName, [fileName, siblingFileName, 'docs/seed.txt'])

    const dialog = await openMoveDialog(page, fileName)
    const folderList = dialog.getByTestId('folder-picker-list')

    await expect(
      folderList.getByRole('button', { name: 'docs' }),
      'Folders should be listed as destinations'
    ).toBeVisible()
    await expect(
      folderList.getByText(siblingFileName),
      'Files should not be listed in the picker at all'
    ).not.toBeVisible()
    await expect(
      folderList.getByText(fileName, { exact: true }),
      'The file being moved should not be listed either'
    ).not.toBeVisible()
  })

  test('blocks confirming a move into the folder the file already sits in', async ({
    page,
    ref,
  }) => {
    const bucketName = `${bucketNamePrefix}_same_folder`
    const fileName = 'already-here.txt'

    await setUpBucket(page, ref, bucketName, [fileName, 'docs/seed.txt'])

    await openMoveDialog(page, fileName)

    // The picker opens at the bucket root, which is where the file already is
    await expect(
      page.getByRole('button', { name: `Move to ${bucketName}` }),
      'Confirm button should be disabled while the destination matches the source'
    ).toHaveAttribute('aria-disabled', 'true')
  })

  test('finds a nested folder by search and moves into it', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_search`
    const fileName = 'needs-filing.txt'

    await setUpBucket(page, ref, bucketName, [fileName, 'reports/2024/q1/seed.txt'])

    const dialog = await openMoveDialog(page, fileName)
    const folderList = dialog.getByTestId('folder-picker-list')

    await dialog.getByPlaceholder(`Search folders in ${bucketName}...`).fill('q1')

    // Search results name the folder and where it lives, since they span the whole bucket
    const searchResult = folderList.getByRole('button', { name: 'q1 in reports/2024' })
    await expect(searchResult, 'Search should surface the deeply nested folder').toBeVisible()
    await searchResult.click()

    await expect(
      dialog.getByText(`Moving to ${bucketName}/reports/2024/q1`, { exact: true }),
      'Picking a search result should set it as the destination'
    ).toBeVisible()

    await confirmMove(page, ref, 'q1')

    await expect(
      page.getByText(/Successfully moved/),
      'A success toast should confirm the move'
    ).toBeVisible()
    await expect(
      page.getByTitle(fileName),
      'File should no longer sit at the bucket root'
    ).not.toBeVisible()
  })

  test('reports when a search matches no folders', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_no_results`
    const fileName = 'stays-put.txt'

    await setUpBucket(page, ref, bucketName, [fileName, 'docs/seed.txt'])

    const dialog = await openMoveDialog(page, fileName)
    const folderList = dialog.getByTestId('folder-picker-list')

    await dialog.getByPlaceholder(`Search folders in ${bucketName}...`).fill('nothing-matches-this')

    await expect(
      folderList.getByText('No folders match "nothing-matches-this"'),
      'An empty search should say so rather than showing a blank list'
    ).toBeVisible()
  })

  test('collapses the middle of a deep path into a breadcrumb dropdown', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_breadcrumb`
    const fileName = 'deep-move.txt'

    await setUpBucket(page, ref, bucketName, [fileName, 'alpha/beta/gamma/seed.txt'])

    const dialog = await openMoveDialog(page, fileName)
    const folderList = dialog.getByTestId('folder-picker-list')

    await folderList.getByRole('button', { name: 'alpha' }).click()
    await folderList.getByRole('button', { name: 'beta' }).click()
    await folderList.getByRole('button', { name: 'gamma' }).click()

    await expect(
      dialog.getByText(`Moving to ${bucketName}/alpha/beta/gamma`, { exact: true }),
      'Destination should track the folders that were opened'
    ).toBeVisible()

    // The bucket and the two deepest folders stay inline; "alpha" collapses
    const breadcrumb = dialog.getByRole('navigation', { name: 'breadcrumb' })
    await expect(
      breadcrumb.getByText('beta', { exact: true }),
      'The second-to-last folder should stay visible'
    ).toBeVisible()
    await expect(
      breadcrumb.getByText('gamma', { exact: true }),
      'The current folder should stay visible'
    ).toBeVisible()
    await expect(
      breadcrumb.getByText('alpha', { exact: true }),
      'The middle of the path should collapse out of the breadcrumb'
    ).not.toBeVisible()

    await breadcrumb.getByRole('button', { name: 'Show the folders in between' }).click()
    await page.getByRole('menuitem', { name: 'alpha' }).click()

    await expect(
      dialog.getByText(`Moving to ${bucketName}/alpha`, { exact: true }),
      'Choosing a collapsed folder should navigate to it'
    ).toBeVisible()
    await expect(
      folderList.getByRole('button', { name: 'beta' }),
      'Navigating back up should list the folder below it again'
    ).toBeVisible()
  })

  test('walks back up the path with the up-one-level button', async ({ page, ref }) => {
    const bucketName = `${bucketNamePrefix}_up_level`
    const fileName = 'up-level.txt'

    await setUpBucket(page, ref, bucketName, [fileName, 'outer/inner/seed.txt'])

    const dialog = await openMoveDialog(page, fileName)
    const folderList = dialog.getByTestId('folder-picker-list')

    const upOneLevel = dialog.getByRole('button', { name: 'Go up one level' })
    await expect(upOneLevel, 'Up-one-level should be disabled at the bucket root').toBeDisabled()

    await folderList.getByRole('button', { name: 'outer' }).click()
    await folderList.getByRole('button', { name: 'inner' }).click()
    await expect(
      dialog.getByText(`Moving to ${bucketName}/outer/inner`, { exact: true })
    ).toBeVisible()

    await upOneLevel.click()
    await expect(
      dialog.getByText(`Moving to ${bucketName}/outer`, { exact: true }),
      'Going up one level should drop the deepest folder'
    ).toBeVisible()
  })
})
