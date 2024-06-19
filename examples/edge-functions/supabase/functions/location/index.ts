// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

function ips(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(/\s*,\s*/)
}

Deno.serve(async (req) => {
  const clientIps = ips(req) || ['']
  const res = await fetch(
    `https://ipinfo.io/${clientIps[0]}?token=${Deno.env.get('IPINFO_TOKEN')}`,
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
  if (res.ok) {
    const { city, country } = await res.json()

    return new Response(JSON.stringify(`You're accessing from ${city}, ${country}`), {
      headers: { 'Content-Type': 'application/json' },
    })
  } else {
    return new Response(await res.text(), {
      status: 400,
    })
  }
})
