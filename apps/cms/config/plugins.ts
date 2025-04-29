export default ({ env }) => ({
  upload: {
    config: {
      provider: 'strapi-provider-upload-supabase',
      providerOptions: {
        apiUrl: env('SUPABASE_API_URL'),
        apiKey: env('SUPABASE_API_KEY'),
        bucket: env('SUPABASE_BUCKET'),
        directory: env('SUPABASE_DIRECTORY'),
        options: {
          cacheControl: 'public, max-age=31536000',
        },
      },
    },
  },
  'strapi-provider-upload-supabase': {
    // enabled: true,
    config: {
      baseUrl: `${env('SUPABASE_URL')}/storage/v1/object/public/${env('SUPABASE_BUCKET')}`,
      prefix: '',
    },
  },
})
