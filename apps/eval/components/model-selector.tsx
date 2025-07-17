'use client'

import { useState } from 'react'
import { Button } from 'ui'
import { Badge } from 'ui'
import { Plus, Minus } from 'lucide-react'
import { Input } from 'ui'
import { Label_Shadcn_ as Label } from 'ui'
import {
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
} from 'ui'
import {
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
} from 'ui'

export interface ModelConfig {
  id: string
  provider: 'openai' | 'bedrock'
  name: string
}

interface ModelSelectorProps {
  selectedModels: ModelConfig[]
  onModelsChange: (models: ModelConfig[]) => void
}

export function ModelSelector({ selectedModels, onModelsChange }: ModelSelectorProps) {
  const [newModelName, setNewModelName] = useState('')
  const [newModelProvider, setNewModelProvider] = useState<'openai' | 'bedrock'>('openai')
  const [isAddModelOpen, setIsAddModelOpen] = useState(false)

  const addModel = () => {
    if (!newModelName.trim()) return

    const modelConfig: ModelConfig = {
      id: `${newModelProvider}-${newModelName.trim()}`,
      provider: newModelProvider,
      name: newModelName.trim(),
    }

    if (!selectedModels.find((m) => m.id === modelConfig.id)) {
      onModelsChange([...selectedModels, modelConfig])
    }

    setNewModelName('')
    setNewModelProvider('openai')
    setIsAddModelOpen(false)
  }

  const removeModel = (modelId: string) => {
    onModelsChange(selectedModels.filter((model) => model.id !== modelId))
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover open={isAddModelOpen} onOpenChange={setIsAddModelOpen}>
        <PopoverTrigger asChild>
          <Button icon={<Plus />} size="small" type="outline">
            Add Model
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 text-foreground">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Add Model</h4>
              <p className="text-sm text-foreground-light">Enter a Bedrock model name</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-name">Model Name</Label>
              <Input
                id="model-name"
                placeholder="e.g., claude-3-sonnet"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addModel()
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                size="tiny"
                type="outline"
                onClick={() => {
                  setNewModelName('')
                  setNewModelProvider('openai')
                  setIsAddModelOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button size="tiny" onClick={addModel} disabled={!newModelName.trim()}>
                Add Model
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
