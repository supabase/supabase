// Prerequisites:
// - `generated-images` bucket already created.
// - `OPENAI_API_KEY` environment variable set.

import OpenAI, { toFile } from 'jsr:@openai/openai@^6'
import { withSupabase } from 'npm:@supabase/server@^1'

// Deploy with verify_jwt = false.
export default {
  fetch: withSupabase({ auth: 'secret' }, async (req, ctx) => {
    try {
      const { prompt, imageUrls }: { prompt: string; imageUrls: string[] } = await req.json()

      if (!prompt || !imageUrls || imageUrls.length === 0) {
        return Response.json(
          {
            error: 'Prompt and at least one image URL are required',
          },
          { status: 400 }
        )
      }

      // Create OpenAI client
      const openai = new OpenAI({
        apiKey: Deno.env.get('OPENAI_API_KEY'),
      })

      // Get the images from the provided URLs
      const imagePromises = imageUrls.map(async (url: string) => {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch image from ${url}`)
        }
        return await response.blob()
      })

      const imageBlobs = await Promise.all(imagePromises)

      const images = await Promise.all(
        imageBlobs.map(
          async (blob, index) =>
            await toFile(blob, `image-${index}.png`, {
              type: blob.type || 'image/png',
            })
        )
      )

      // Call OpenAI API using the client
      console.log('Calling OpenAI API with prompt:', prompt)
      const response = await openai.images.edit({
        model: 'gpt-image-1',
        image: images,
        prompt: prompt,
      })

      if (!response.data || response.data.length === 0) {
        throw new Error('No image data received from OpenAI API')
      }

      // Convert base64 to blob
      const base64Data = response.data[0].b64_json!
      const binaryData = atob(base64Data)
      const uint8Array = new Uint8Array(binaryData.length)
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i)
      }
      const generatedImageBlob = new Blob([uint8Array], { type: 'image/png' })

      // Create a unique identifier for this generation
      const timestamp = new Date().toISOString()
      const randomId = crypto.randomUUID()
      const outputImageName = `generated-${timestamp}-${randomId}.png`

      // Upload the generated image to Supabase Storage
      const { error: uploadError } = await ctx.supabaseAdmin.storage
        .from('generated-images')
        .upload(outputImageName, generatedImageBlob, {
          contentType: 'image/png',
          upsert: true,
        })

      if (uploadError) {
        console.error('Supabase Storage upload error:', uploadError)
        return Response.json(
          {
            error: 'Failed to upload generated image to storage',
          },
          { status: 500 }
        )
      }

      // Get the public URL for the uploaded image
      const {
        data: { publicUrl },
      } = ctx.supabaseAdmin.storage.from('generated-images').getPublicUrl(outputImageName)

      return Response.json({
        success: true,
        generatedImageUrl: publicUrl,
        message: 'Image processed and stored successfully',
      })
    } catch (error) {
      console.error('Error processing image:', error)
      return Response.json(
        {
          error: (error as Error)?.message || 'Unknown error occurred',
        },
        { status: 500 }
      )
    }
  }),
}
