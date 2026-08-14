import fs from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { RegistryItem } from 'shadcn/schema'

import {
  generateDbContent,
  generateListContent,
  generatePageContent,
  generateSchemasContent,
  generateSheetContent,
} from './_generators'
import { OpenAPISchema, RegistryFile } from './types'
import { safeFileSegment, toSingular, validateDefinitionNames } from './utils'

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

  // Validate Supabase project ref to prevent SSRF via crafted hostnames
  // Typical Supabase refs are lowercase alphabetic; adjust if needed.
  const refPattern = /^[a-z]{1,64}$/
  if (!refPattern.test(ref)) {
    return NextResponse.json({ error: 'Invalid project ref format.' }, { status: 400 })
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

    // Validate all table/column names before generating any code
    try {
      validateDefinitionNames(openApiSpec.definitions)
    } catch (validationError) {
      return NextResponse.json(
        {
          error: `Invalid table or column name: ${validationError instanceof Error ? validationError.message : String(validationError)}`,
        },
        { status: 400 }
      )
    }

    // Generate dynamic file contents
    const schemasContent = generateSchemasContent(openApiSpec.definitions)
    const dbContent = generateDbContent(openApiSpec.definitions)

    // Get the first table for the example CRUD page
    const tableNames = Object.keys(openApiSpec.definitions).filter((name) => !name.startsWith('_'))
    // TODO: remove this once we have a way to select the table
    const firstTableName = tableNames.length > 0 ? tableNames[0] : null
    const firstTableDefinition = firstTableName ? openApiSpec.definitions[firstTableName] : null

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
      const safeTable = safeFileSegment(firstTableName)
      const safeSingular = safeFileSegment(singularTableName)

      dynamicFiles.push(
        {
          path: `app/${safeTable}/page.tsx`,
          content: generatePageContent(firstTableName),
          type: 'registry:page',
          target: `app/${safeTable}/page.tsx`,
        },
        {
          path: `app/${safeTable}/${safeSingular}-sheet.tsx`,
          content: generateSheetContent(firstTableName, firstTableDefinition),
          type: 'registry:component',
          target: `app/${safeTable}/${safeSingular}-sheet.tsx`,
        },
        {
          path: `app/${safeTable}/${safeTable}-list.tsx`,
          content: generateListContent(firstTableName, firstTableDefinition),
          type: 'registry:component',
          target: `app/${safeTable}/${safeTable}-list.tsx`,
        }
      )
    }

    // Combine dynamic files with base registry files
    const registryResponse: RegistryItem = {
      ...baseRegistry,
      files: [...dynamicFiles, ...(baseRegistry.files || [])],
      envVars: {
        NEXT_PUBLIC_SUPABASE_URL: `https://${ref}.supabase.co`,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: anonKey,
      },
      docs: '',
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
