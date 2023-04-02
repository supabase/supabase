import ButtonCard from 'components/ButtonCard'

const examples = [
  {
    name: 'With supabase-js',
    description: 'Use the Supabase client inside your Edge Function.',
    href: 'https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/select-from-table-with-auth-rls/index.ts',
  },
  {
    name: 'With CORS headers',
    description: 'Send CORS headers for invoking from the browser.',
    href: 'https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/browser-with-cors/index.ts',
  },
  {
    name: 'React Native with Stripe',
    description: 'Full example for using Supabase and Stripe, with Expo.',
    href: 'https://github.com/supabase-community/expo-stripe-payments-with-supabase-functions',
  },
  {
    name: 'Flutter with Stripe',
    description: 'Full example for using Supabase and Stripe, with Flutter.',
    href: 'https://github.com/supabase-community/flutter-stripe-payments-with-supabase-functions',
  },
  {
    name: 'Building a RESTful Service API',
    description:
      'Learn how to use HTTP methods and paths to build a RESTful service for managing tasks.',
    href: 'https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/restful-tasks/index.ts',
  },
  {
    name: 'Working with Supabase Storage',
    description: 'An example on reading a file from Supabase Storage.',
    href: 'https://github.com/supabase/supabase/blob/master/examples/edge-functions/supabase/functions/read-storage/index.ts',
  },
  {
    name: 'Open Graph Image Generation',
    description: 'Generate Open Graph images with Deno and Supabase Edge Functions.',
    href: '/guides/functions/examples/og-image',
  },
  {
    name: 'OG Image Generation & Storage CDN Caching',
    description: 'Cache generated images with Supabase Storage CDN.',
    href: 'https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/og-image-with-storage-cdn',
  },
  {
    name: 'Get User Location',
    description: `Get user location data from user's IP address.`,
    href: 'https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/location',
  },
]

const FunctionsExamples = () => {
  return (
    <div className="grid md:grid-cols-12 gap-4">
      {examples.map((x) => (
        <div className="col-span-6">
          <ButtonCard to={x.href} title={x.name} description={x.description} />
        </div>
      ))}
    </div>
  )
}

export default FunctionsExamples
