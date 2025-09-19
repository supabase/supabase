import { useState } from 'react'
import { AiIconAnimation, Button_Shadcn_, Input_Shadcn_ } from 'ui'

interface AiPromptInputProps {
  onGenerate: (prompt: string) => void
  isLoading?: boolean
}

export const AiPromptInput = ({ onGenerate, isLoading = false }: AiPromptInputProps) => {
  const [prompt, setPrompt] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt.trim())
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3 items-center">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input_Shadcn_
            placeholder="e.g., social media app with posts and comments"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            className="flex-1 items-center h-8"
          />
          <Button_Shadcn_
            disabled={!prompt.trim() || isLoading}
            className="sm:w-auto sm:flex-shrink-0 items-center h-8"
            variant="outline"
            type="submit"
          >
            {isLoading ? (
              <>
                <AiIconAnimation size={16} className="mr-2" loading={true} />
                Generating...
              </>
            ) : (
              <>
                <AiIconAnimation size={16} className="mr-2" />
                Generate
              </>
            )}
          </Button_Shadcn_>
        </div>
      </form>
    </div>
  )
}
