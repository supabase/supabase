// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

console.log('Hello from Functions!')

Deno.serve((_req) => {
  const data = {
    message: `I was deployed via GitHub Actions!`,
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})

// To invoke: http://localhost:54321/functions/v1/github-action-deploy
