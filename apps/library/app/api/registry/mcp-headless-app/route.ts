import fs from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import type { RegistryItem } from 'shadcn/schema'

async function readRegistryItem(): Promise<RegistryItem> {
  const filePath = path.join(process.cwd(), 'public/r/mcp-headless-app.json')
  const content = await fs.readFile(filePath, 'utf-8')

  return JSON.parse(content) as RegistryItem
}

export async function GET(request: NextRequest) {
  try {
    const registryItem = await readRegistryItem()
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
    const registryItemUrl = (name: string) =>
      new URL(`${basePath}/r/${name}.json`, request.nextUrl.origin).toString()

    return NextResponse.json({
      ...registryItem,
      registryDependencies: [
        registryItemUrl('mcp-auth-html'),
        registryItemUrl('mcp-server'),
        registryItemUrl('mcp-tools-postgrest'),
      ],
    } satisfies RegistryItem)
  } catch (error) {
    console.error('Failed to load the Headless MCP App registry item:', error)

    return NextResponse.json({ error: 'Failed to load registry item.' }, { status: 500 })
  }
}
