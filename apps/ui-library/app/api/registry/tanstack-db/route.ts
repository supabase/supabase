import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { RegistryItem } from 'shadcn/schema'

import {
  generateDbContent,
  generateListContent,
  generatePageContent,
  generateSchemasContent,
  generateSheetContent,
} from './_generators'
import { OpenAPISchema, RegistryFile } from './types'
import { toSingular } from './utils'
import fs from 'fs/promises'

// Read the base registry JSON
async function readBaseRegistry(): Promise<RegistryItem> {
  const fullPath = path.join(process.cwd(), 'public/r/tanstack-db-nextjs.json')
  const content = await fs.readFile(fullPath, 'utf-8')
  return JSON.parse(content) as RegistryItem
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ref = searchParams.get('ref')
  const anonKey = searchParams.get('anonKey')

  if (!ref || !anonKey) {
    return NextResponse.json(
      { error: 'Missing required parameters: ref and anonKey' },
      { status: 400 }
    )
  }

  try {
    // Fetch OpenAPI spec from Supabase
    const openApiUrl = `https://${ref}.supabase.co/rest/v1/`
    const response = await fetch(openApiUrl, {
      headers: {
        apikey: anonKey,
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch OpenAPI spec: ${response.statusText}` },
        { status: response.status }
      )
    }

    const openApiSpec: OpenAPISchema = await response.json()

    if (!openApiSpec.definitions) {
      return NextResponse.json(
        { error: 'No table definitions found in OpenAPI spec' },
        { status: 400 }
      )
    }

    // Generate dynamic file contents
    const schemasContent = generateSchemasContent(openApiSpec.definitions)
    const dbContent = generateDbContent(openApiSpec.definitions)

    // Get the first table for the example CRUD page
    const tableNames = Object.keys(openApiSpec.definitions).filter((name) => !name.startsWith('_'))
    const firstTableName = tableNames[0]
    // TODO: Remove the hardcoded table name
    const firstTableDefinition = firstTableName ? openApiSpec.definitions['persons'] : null

    // Read the base registry JSON
    const baseRegistry = await readBaseRegistry()

    // Create dynamic files
    const dynamicFiles: RegistryFile[] = [
      {
        path: 'lib/schemas.ts',
        content: schemasContent,
        type: 'registry:lib',
      },
      {
        path: 'lib/db.ts',
        content: dbContent,
        type: 'registry:lib',
      },
    ]

    // Add example CRUD pages for the first table
    if (firstTableName && firstTableDefinition) {
      const singularTableName = toSingular(firstTableName)

      dynamicFiles.push(
        {
          path: `app/${firstTableName}/page.tsx`,
          content: generatePageContent(firstTableName),
          type: 'registry:page',
          target: `app/${firstTableName}/page.tsx`,
        },
        {
          path: `app/${firstTableName}/${singularTableName}-sheet.tsx`,
          content: generateSheetContent(firstTableName, firstTableDefinition),
          type: 'registry:component',
          target: `app/${firstTableName}/${singularTableName}-sheet.tsx`,
        },
        {
          path: `app/${firstTableName}/${firstTableName}-list.tsx`,
          content: generateListContent(firstTableName, firstTableDefinition),
          type: 'registry:component',
          target: `app/${firstTableName}/${firstTableName}-list.tsx`,
        }
      )
    }

    // Combine dynamic files with base registry files
    const registryResponse: RegistryItem = {
      ...baseRegistry,
      files: [...dynamicFiles, ...(baseRegistry.files || [])],
      envVars: {
        NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: anonKey,
      },
    }

    return NextResponse.json(registryResponse)
  } catch (error) {
    console.error('Error generating tanstack-db block:', error)
    return NextResponse.json(
      { error: 'Failed to generate block. Please check your project ref and anon key.' },
      { status: 500 }
    )
  }
}
