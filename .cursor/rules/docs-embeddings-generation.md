# Documentation Embeddings Generation System

## Overview

The documentation embeddings generation system processes various documentation sources and uploads their metadata to a database for semantic search functionality. The system is located in `apps/docs/scripts/search/` and works by:

1. **Discovering content sources** from multiple types of documentation
2. **Processing content** into structured sections with checksums
3. **Generating embeddings** using OpenAI's text-embedding-ada-002 model
4. **Storing in database** with vector embeddings for semantic search

## Architecture

### Main Entry Point
- `generate-embeddings.ts` - Main script that orchestrates the entire process
- Supports `--refresh` flag to force regeneration of all content

### Content Sources (`sources/` directory)

#### Base Classes
- `BaseLoader` - Abstract class for loading content from different sources
- `BaseSource` - Abstract class for processing and formatting content

#### Source Types
1. **Markdown Sources** (`markdown.ts`)
   - Processes `.mdx` files from guides and documentation
   - Extracts frontmatter metadata and content sections

2. **Reference Documentation** (`reference-doc.ts`)
   - **OpenAPI References** - Management API documentation from OpenAPI specs
   - **Client Library References** - JavaScript, Dart, Python, C#, Swift, Kotlin SDKs
   - **CLI References** - Command-line interface documentation
   - Processes YAML/JSON specs and matches with common sections

3. **GitHub Discussions** (`github-discussion.ts`)
   - Fetches troubleshooting discussions from GitHub using GraphQL API
   - Uses GitHub App authentication for access

4. **Partner Integrations** (`partner-integrations.ts`)
   - Fetches approved partner integration documentation from Supabase database
   - Technology integrations only (excludes agencies)

### Processing Flow

1. **Content Discovery**: Each source loader discovers and loads content files/data
2. **Content Processing**: Each source processes content into:
   - Checksum for change detection
   - Metadata (title, subtitle, etc.)
   - Sections with headings and content
3. **Change Detection**: Compares checksums against existing database records
4. **Embedding Generation**: Uses OpenAI to generate embeddings for new/changed content
5. **Database Storage**: Stores in `page` and `page_section` tables with embeddings
6. **Cleanup**: Removes outdated pages using version tracking

### Database Schema

- **`page`** table: Stores page metadata, content, checksum, version
- **`page_section`** table: Stores individual sections with embeddings, token counts

