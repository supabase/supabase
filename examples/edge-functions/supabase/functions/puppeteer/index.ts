import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts'

Deno.serve(async (req) => {
  try {
    console.log(`wss://chrome.browserless.io?token=${Deno.env.get('PUPPETEER_BROWSERLESS_IO_KEY')}`)
    // Visit browserless.io to get your free API token
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${Deno.env.get(
        'PUPPETEER_BROWSERLESS_IO_KEY'
      )}`,
    })
    const page = await browser.newPage()

    const url = new URL(req.url).searchParams.get('url') || 'http://www.example.com'

    await page.goto(url)
    const screenshot = await page.screenshot()

    return new Response(screenshot, {
      headers: { 'Content-Type': 'image/png' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
