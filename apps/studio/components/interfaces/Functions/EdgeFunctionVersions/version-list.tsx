import { Card, CardContent, CardHeader, CardTitle } from 'ui'
import { useState } from 'react'
import { Clock } from 'lucide-react'
import { ListItem, type Version } from './list-item'

const mockVersions: Version[] = [
  {
    id: '1',
    timestamp: '2024-01-15 14:30:22',
    commitMessage: 'Add user authentication middleware',
    commitHash: 'a1b2c3d',
    isActive: true,
    content: `import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY')
  )
  
  // Authentication middleware
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const { data: user, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    return new Response('Invalid token', { status: 401 })
  }
  
  return new Response(JSON.stringify({ user: user.user }), {
    headers: { 'Content-Type': 'application/json' }
  })
}`,
    size: '1.2 KB',
  },
  {
    id: '2',
    timestamp: '2024-01-14 09:15:45',
    commitMessage: 'Fix CORS headers for production',
    commitHash: 'b2c3d4e',
    isActive: false,
    content: `import { createClient } from '@supabase/supabase-js'

export default async function handler(req) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_ANON_KEY')
  )
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  return new Response(JSON.stringify({ message: 'Hello World' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}`,
    size: '0.9 KB',
  },
  {
    id: '3',
    timestamp: '2024-01-13 16:42:18',
    commitMessage: 'Initial Edge Function setup',
    commitHash: 'c3d4e5f',
    isActive: false,
    content: `export default async function handler(req) {
  return new Response(JSON.stringify({ message: 'Hello World' }), {
    headers: { 'Content-Type': 'application/json' }
  })
}`,
    size: '0.3 KB',
  },
  {
    id: '4',
    timestamp: '2024-01-12 11:28:33',
    commitMessage: 'Add error handling and logging',
    commitHash: 'd4e5f6g',
    isActive: false,
    content: `export default async function handler(req) {
  try {
    console.log('Request received:', req.method, req.url)
    
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }
    
    const body = await req.json()
    console.log('Request body:', body)
    
    return new Response(JSON.stringify({ 
      message: 'Success',
      data: body 
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}`,
    size: '0.7 KB',
  },
]

export const EdgeFunctionVersionsList = () => {
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [isRestoring, setIsRestoring] = useState(false)

  const handleRestore = async (version: Version) => {
    setIsRestoring(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Update active status
    mockVersions.forEach((v) => {
      v.isActive = v.id === version.id
    })

    setIsRestoring(false)
    setSelectedVersion(null)
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edge Function Versions</CardTitle>
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] divide-y md:divide-y-0 md:divide-x divide-default items-stretch">
        <div className="p-8">
          <div className="flex items-center gap-2">
            <Clock size={20} />
            <h4 className="text-base text-foreground">Available Versions</h4>
          </div>
          <div className="text-sm text-foreground-light mt-1 mb-4 max-w-3xl">
            <p>Select a version to preview its content and restore if needed.</p>
          </div>

          <div className="space-y-2">
            {mockVersions.map((version) => (
              <ListItem
                key={version.id}
                version={version}
                isSelected={selectedVersion?.id === version.id}
                isRestoring={isRestoring}
                onSelect={setSelectedVersion}
                onRestore={handleRestore}
                formatTimestamp={formatTimestamp}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
