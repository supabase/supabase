import { test as setup } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({
  path: path.resolve(__dirname, process.env.ENV === 'staging' ? '../.env.staging' : ''),
  override: true,
})
const authFile = path.join(__dirname, '../playwright/.auth/user.json')

setup('Authenticate', async ({ page }) => {
  await page.goto('./sign-in')
  await page.getByLabel('Email').fill(process.env.EMAIL ?? '')
  await page.getByLabel('Password').fill(process.env.PASSWORD ?? '')
  await page.getByRole('button', { name: 'Sign In' }).click()

  await page.pause()

  await page.waitForURL('./projects')
  await page.context().storageState({ path: authFile })
})
