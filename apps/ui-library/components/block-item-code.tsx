'use client'

import { RegistryNode } from '@/lib/process-registry'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/components/shadcn/ui/tabs'
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock'
import { useState } from 'react'
import supabaseTheme from '../lib/themes/supabase-2.json' assert { type: 'json' }
import { BlockItemPreview } from './block-item'
import { File, Folder } from './files'

interface BlockItemCodeProps {
  files: RegistryNode[]
}

const demoUrls: Record<string, string> = {
  'src/registry/blocks/password-based-auth-nextjs/app/login/page.tsx':
    '/blocks/password-based-auth-nextjs/login',
  'src/registry/blocks/password-based-auth-nextjs/app/sign-up/page.tsx':
    '/blocks/password-based-auth-nextjs/sign-up',
  'src/registry/blocks/password-based-auth-nextjs/app/sign-up-success/page.tsx':
    '/blocks/password-based-auth-nextjs/sign-up-success',
  'src/registry/blocks/password-based-auth-nextjs/app/forgot-password/page.tsx':
    '/blocks/password-based-auth-nextjs/forgot-password',
  'src/registry/blocks/password-based-auth-nextjs/app/update-password/page.tsx':
    '/blocks/password-based-auth-nextjs/update-password',
}

function FileTree({
  items,
  onFileSelect,
}: {
  items: RegistryNode[]
  onFileSelect: (file: RegistryNode) => void
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <>
      {items.map((item, index) => {
        if (item.type === 'directory') {
          return (
            <Folder key={index} name={item.name} defaultOpen>
              <FileTree onFileSelect={onFileSelect} items={item.children ?? []} />
            </Folder>
          )
        }
        return (
          <File
            key={index}
            name={item.name}
            onClick={() => onFileSelect(item)}
            className="cursor-pointer"
          />
        )
      })}
    </>
  )
}

export function BlockItemCode({ files }: BlockItemCodeProps) {
  const initialFile = files.find((file) => file.type === 'file') || null
  const [selectedFile, setSelectedFile] = useState(initialFile)

  const selectedFilePath = selectedFile?.path.startsWith('/')
    ? selectedFile?.path.slice(1)
    : selectedFile?.path
  const selectedFileExtension = (selectedFile?.name.split('.').pop() ?? 'ts') as 'ts' | 'tsx'

  const selectedFileDemoUrl = selectedFile?.originalPath
    ? demoUrls[selectedFile?.originalPath]
    : null

  return (
    <div className="flex border rounded-lg overflow-hidden h-[652px] not-prose mt-4">
      {/* File browser sidebar */}
      <div className="w-64 border-r bg-muted/30 overflow-y-auto">
        <div className="border-b bg-muted/50 h-12 items-center flex px-2">
          <h3 className="font-medium text-sm">Files</h3>
        </div>
        <div className="p-2">
          <FileTree items={files} onFileSelect={setSelectedFile} />
        </div>
      </div>

      {/* Code display area */}
      <div className="flex-1 overflow-auto bg-muted/10" key={selectedFile?.path}>
        {selectedFile?.content ? (
          <div className="h-full">
            <Tabs defaultValue="code" className="h-full gap-0">
              <div className="h-12 flex items-center justify-between px-2">
                <span>{selectedFilePath}</span>
                {selectedFileDemoUrl && (
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="code">Code</TabsTrigger>
                  </TabsList>
                )}
              </div>
              <TabsContent
                value="code"
                className="rounded-none [&_figure]:rounded-none [&_figure]:h-full [&_div[data-radix-scroll-area-viewport]]:min-h-[600px]"
              >
                <DynamicCodeBlock
                  lang={selectedFileExtension}
                  code={selectedFile?.content}
                  /* the component supports a theme prop, but it's typed badly */
                  options={{ theme: supabaseTheme } as any}
                />
              </TabsContent>
              <TabsContent value="preview" className="h-full flex-1">
                {selectedFileDemoUrl && <BlockItemPreview title="" src={selectedFileDemoUrl} />}
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No file selected or file content unavailable
          </div>
        )}
      </div>
    </div>
  )
}
