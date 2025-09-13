import { useState } from 'react'
import { Database, Loader2, Sparkles } from 'lucide-react'
import {
  Button_Shadcn_,
  CardDescription,
  Input_Shadcn_,
} from 'ui'
import type { TableSuggestion } from './types'

interface AiPromptInputProps {
  onGenerate: (tables: TableSuggestion[]) => void
  isLoading?: boolean
}

export const AiPromptInput = ({ onGenerate, isLoading = false }: AiPromptInputProps) => {
  const [prompt, setPrompt] = useState('')
  const [localLoading, setLocalLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim() && !isLoading && !localLoading) {
      setLocalLoading(true)
      
      // Simulate AI generation - in production this would call an API
      // For now, generate mock tables based on the prompt
      setTimeout(() => {
        const mockTables: TableSuggestion[] = generateMockTables(prompt.trim())
        onGenerate(mockTables)
        setLocalLoading(false)
      }, 1500)
    }
  }

  // Mock function to generate tables based on prompt
  const generateMockTables = (userPrompt: string): TableSuggestion[] => {
    const lowerPrompt = userPrompt.toLowerCase()
    
    if (lowerPrompt.includes('social') || lowerPrompt.includes('post')) {
      return [
        {
          tableName: 'posts',
          fields: [
            { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
            { name: 'user_id', type: 'uuid', nullable: false },
            { name: 'content', type: 'text', nullable: false },
            { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
            { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'now()' },
            { name: 'likes_count', type: 'integer', nullable: false, default: 0 },
          ],
          rationale: 'Core table for storing user posts with timestamps and engagement metrics',
          source: 'ai'
        },
        {
          tableName: 'comments',
          fields: [
            { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
            { name: 'post_id', type: 'uuid', nullable: false },
            { name: 'user_id', type: 'uuid', nullable: false },
            { name: 'content', type: 'text', nullable: false },
            { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
          ],
          rationale: 'Store comments on posts with user and post relationships',
          source: 'ai'
        },
        {
          tableName: 'users',
          fields: [
            { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
            { name: 'username', type: 'varchar(50)', nullable: false },
            { name: 'email', type: 'varchar(255)', nullable: false },
            { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
          ],
          rationale: 'User profiles with authentication details',
          source: 'ai'
        }
      ]
    }
    
    // Default response for any other prompt
    return [
      {
        tableName: userPrompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30),
        fields: [
          { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar(255)', nullable: false },
          { name: 'description', type: 'text', nullable: true },
          { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'now()' },
        ],
        rationale: 'A flexible table structure based on your requirements',
        source: 'ai'
      }
    ]
  }

  const examplePrompts = [
    'recipe sharing app with ratings',
    'gym workout tracking with exercises',
    'event booking system with tickets',
    'book library with authors and genres',
  ]

  const currentLoading = isLoading || localLoading

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Database className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
            Generate your first table now
          </h3>
          <CardDescription>
            Tell us what you're building and we'll generate the perfect table schema
          </CardDescription>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 items-center">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input_Shadcn_
            placeholder="e.g., social media app with posts and comments"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={currentLoading}
            className="flex-1 items-center h-8"
          />
          <Button_Shadcn_
            disabled={!prompt.trim() || currentLoading}
            className="sm:w-auto sm:flex-shrink-0 items-center h-8"
            variant="outline"
            type="submit"
          >
            {currentLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Generating schema...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Table Schema
              </>
            )}
          </Button_Shadcn_>
        </div>
      </form>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPrompt(example)}
              disabled={currentLoading}
              className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}