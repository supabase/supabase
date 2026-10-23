// This is an example showing how to use Magick WASM to do image manipulations in Edge Functions.
//
import { ImageMagick, initializeImageMagick, MagickFormat } from 'npm:@imagemagick/magick-wasm@^0'
import { withSupabase } from 'npm:@supabase/server@^1'

const wasmBytes = await Deno.readFile(
  new URL('magick.wasm', import.meta.resolve('npm:@imagemagick/magick-wasm@^0'))
)
await initializeImageMagick(wasmBytes)

// Authenticated endpoint, so deploy with verify_jwt = true.
export default {
  fetch: withSupabase({ auth: 'user' }, async (req, _ctx) => {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof Blob)) {
      return Response.json({ error: 'file is required' }, { status: 400 })
    }
    const content = await file.bytes()

    let result = ImageMagick.read(content, (img): Uint8Array => {
      // resize the image
      img.resize(500, 300)
      // add a blur of 60x5
      img.blur(60, 5)

      return img.write((data) => data)
    })

    return new Response(Uint8Array.from(result), {
      headers: { 'Content-Type': 'image/png' },
    })
  }),
}
