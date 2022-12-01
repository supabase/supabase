import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts'

serve(async (req) => {
  try {
    // Visit browserless.io to get your free API token
    const browser = await puppeteer.connect({
      browserWSEndpoint: 'wss://chrome.browserless.io?token=YOUR_API_TOKEN',
    })
    const page = await browser.newPage()

    const url = new URL(req.url).searchParams.get('url') || 'http://www.example.com'

    await page.goto(url)
    const screenshot = await page.screenshot()

    return new Response(screenshot, { headers: { 'Content-Type': 'image/png' } })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify(`Error occurred when generating the screenshot`), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
