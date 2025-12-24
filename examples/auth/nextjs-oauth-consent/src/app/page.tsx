export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">OAuth Consent Page</h1>
        <p className="text-gray-600">
          This page handles OAuth consent flows. Redirect users to{' '}
          <code className="bg-gray-100 px-1 rounded">/oauth/consent</code> with an{' '}
          <code className="bg-gray-100 px-1 rounded">authorization_id</code> parameter.
        </p>
      </div>
    </div>
  )
}
