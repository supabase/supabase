import puppeteer from 'npm:puppeteer@^25'
import { withSupabase } from 'npm:@supabase/server@^1'

// Authenticated endpoint, so deploy with verify_jwt = true.
export default {
  fetch: withSupabase({ auth: 'user' }, async (req) => {
    try {
      const browserWSEndpoint = `wss://chrome.browserless.io?token=${Deno.env.get(
        'PUPPETEER_BROWSERLESS_IO_KEY'
      )}`
      // Visit browserless.io to get your free API token
      const browser = await puppeteer.connect({
        browserWSEndpoint,
      })
      const page = await browser.newPage()

      const url = new URL(req.url).searchParams.get('url') || 'http://www.example.com'

      await page.goto(url)
      const screenshot = await page.screenshot()

      return new Response(screenshot as BodyInit, {
        headers: { 'Content-Type': 'image/png' },
      })
    } catch (e) {
      console.error(e)
      return Response.json({ error: e.message }, { status: 500 })
    }
  }),
}
