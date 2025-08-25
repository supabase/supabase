import {
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogAction,
  AlertDialogFooter,
  AlertDialogContent,
  AlertDialog,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  AlertDialogCancel,
  AlertDialogTitle,
  Badge,
  Button,
  AlertDialogTrigger,
} from 'ui'
import { useState } from 'react'
import { Clock, CheckCircle2, GitCommit, Eye, RotateCcw } from 'lucide-react'

type Version = {
  id: string
  timestamp: string
  commitMessage?: string
  commitHash?: string
  isActive: boolean
  content: string
  size: string
}

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
              <div
                key={version.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-accent/50 ${
                  selectedVersion?.id === version.id
                    ? 'border-primary bg-accent/30'
                    : 'border-border'
                }`}
                onClick={() => setSelectedVersion(version)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {formatTimestamp(version.timestamp)}
                      </span>
                      {version.isActive && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>

                    {version.commitMessage && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GitCommit className="h-3 w-3" />
                        <span>{version.commitMessage}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {version.commitHash && (
                        <span className="font-mono">#{version.commitHash}</span>
                      )}
                      <span>{version.size}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="default"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedVersion(version)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {!version.isActive && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="default"
                            icon={<RotateCcw />}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Restore
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Restore Version</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to restore this version? This will replace the
                              currently active version and cannot be undone.
                              <div className="mt-3 p-3 bg-muted rounded-md">
                                <div className="text-sm font-medium">Version Details:</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {formatTimestamp(version.timestamp)}
                                </div>
                                {version.commitMessage && (
                                  <div className="text-sm text-muted-foreground">
                                    {version.commitMessage}
                                  </div>
                                )}
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRestore(version)}
                              disabled={isRestoring}
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                              {isRestoring ? 'Restoring...' : 'Restore Version'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
