# OpenRef-Based LLM Documentation Generator

Generates LLM-optimized documentation from Supabase OpenRef YAML specifications.

## Overview

This tool reads canonical OpenRef specifications from `apps/docs/spec/*.yml` and generates structured, token-efficient documentation optimized for Large Language Models (LLMs), RAG pipelines, and embedding systems.

## Key Features

- Source of Truth: Reads directly from OpenRef YAML specs (single source of truth)
- Rich Context: Embeds SQL table schemas and JSON responses inline with code examples
- Hierarchical Numbering: Uses 1.1, 1.2, 2.1... format for clear LLM navigation
- Semantic Tags: Includes SYSTEM prompts for contextual understanding
- Token-Optimized: Minimal decorative text, maximum information density
- Modular Output: Separate files per category (database, auth, storage, etc.) plus full combined docs

## Supported SDKs

All official Supabase client libraries:

- JavaScript/TypeScript (v1, v2)
- Kotlin (v1, v2, v3)
- Dart/Flutter (v1, v2)
- C# (v0, v1)
- Python (v2)
- Swift (v1, v2)

Total: 12 specification files

## Quick Start

Get running in 30 seconds:

```bash
# From apps/docs directory
cd scripts/llms-openref

# Install dependencies (first time only)
npm install

# Generate docs for one SDK
npx tsx src/cli.ts generate --sdk swift

# View output
ls -la ../../public/llms-openref/swift/v2/llm-docs/
```

Or from the workspace root:

```bash
cd apps/docs
pnpm run build:llms-openref
```

## Installation

Dependencies are managed through the workspace. From the `apps/docs` directory:

```bash
cd scripts/llms-openref
npm install
```

## Usage

All commands should be run from the `apps/docs/scripts/llms-openref` directory.

### Generate Documentation

```bash
# Generate specific SDK (uses latest version by default)
npx tsx src/cli.ts generate --sdk swift

# Generate all SDKs
npx tsx src/cli.ts generate --sdk all

# List available SDKs
npx tsx src/cli.ts list-sdks

# Validate a specification
npx tsx src/cli.ts validate --sdk swift

# Enable verbose logging
npx tsx src/cli.ts generate --sdk swift --verbose

# Generate specific SDK version and category (for testing)
npx tsx src/cli.ts generate --sdk javascript --sdk-version v2

# Quick smoke test: generate single category
npx tsx src/cli.ts generate --sdk dart --sdk-version v2
```

### Configuration

The tool uses two configuration files in the `config/` directory:

config/sdks.json - Defines available SDKs and their versions:

```json
{
  "sdks": {
    "swift": {
      "name": "Swift",
      "language": "swift",
      "versions": {
        "v2": {
          "displayName": "Supabase Swift SDK v2",
          "spec": {
            "localPath": "../../spec/supabase_swift_v2.yml"
          }
        }
      }
    }
  }
}
```

config/categories.json - Defines documentation categories:

```json
{
  "categories": {
    "database": {
      "title": "Database Operations",
      "systemPrompt": "This is the developer documentation for Supabase {sdk_name} - Database Operations.",
      "operations": ["select", "insert", "update", "delete", ...],
      "order": 4
    }
  }
}
```

## Output

### Output Structure

Generated files are not committed to the repository. They are created at build/deploy time and placed in `public/llms-openref/` (which is gitignored).

To generate documentation locally:
```bash
# From apps/docs directory
pnpm run build:llms-openref

# Or from this directory
npx tsx src/cli.ts generate --sdk all
```

Generated structure:
```
public/llms-openref/
├── swift/
│   ├── v2/
│   │   ├── llm-docs/
│   │   │   ├── supabase-swift-v2-full-llms.txt       # Complete documentation
│   │   │   ├── supabase-swift-v2-database-llms.txt   # Database operations
│   │   │   ├── supabase-swift-v2-auth-llms.txt       # Authentication
│   │   │   └── ...
│   │   └── parsed/
│   │       └── swift-v2-spec.json                     # Parsed spec (for debugging)
│   └── v1/
│       └── llm-docs/
│           └── ...
├── javascript/
│   ├── v2/
│   └── v1/
└── ...
```

### Output Format Example

```
<SYSTEM>This is the developer documentation for Supabase Swift SDK v2 - Database Operations.</SYSTEM>

# Supabase Swift SDK v2 Database Operations Documentation

Query and manipulate data using PostgREST

# 1. Fetch data: select()

## 1.1. Getting your data

\`\`\`swift
let instruments: [Instrument] = try await supabase
  .from("instruments")
  .select()
  .execute()
  .value

// Data Source
/*
create table instruments (
  id int8 primary key,
  name text
);
*/

// Response
/*
{
  "data": [{"id": 1, "name": "violin"}],
  "status": 200
}
*/
\`\`\`

## 1.2. Select specific columns

# 2. Insert data: insert()
```

Format Highlights:

- SYSTEM Tags: Provide semantic context for LLMs
- Hierarchical Numbering: Clear structure (1.1, 1.2, 2.1, 2.2)
- Inline SQL Schemas: Table structures embedded in comments
- Inline JSON Responses: Expected outputs shown in comments
- Token-Efficient: No decorative elements, pure technical content

### Why Modular Files

The generator produces both full and category-specific documentation to accommodate LLM context window constraints.

Context Window Management:
- Full documentation files may consume more context tokens than users need for their specific task
- Users often only need specific categories (database, auth, storage) rather than the entire SDK
- Category-specific files allow precise control over token usage
- Multiple categories can be combined as needed while staying within context limits

Use Cases:
- Database-only: Use supabase-swift-v2-database-llms.txt
- Auth + Storage: Combine two category files
- Complete reference: Use supabase-swift-v2-full-llms.txt when context allows
- RAG systems: Index categories separately for targeted retrieval

This modular approach gives users flexibility to optimize their token budget based on task requirements.

## Architecture

### Data Flow

spec YAML → Parser → Models → Formatter → Output files

- `parser.ts`: Reads and validates OpenRef YAML specs
- `models.ts`: Zod schemas for type-safe data structures
- `formatter.ts`: Converts parsed data to hierarchical text
- `cli.ts`: User interface and command routing

Key Design Decisions:
- Map-based lookups for O(1) performance
- Streaming writes for memory efficiency
- Immutable data structures throughout pipeline

### Performance Optimizations

- O(1) Lookups: Map-based caching for SDK and operation lookups
- O(n) Parsing: Single-pass YAML parsing
- Streaming Writes: Large files (>10MB) use streaming to conserve memory
- Efficient Strings: Array join (O(n)) instead of concatenation (O(n²))
- Lazy Loading: Configurations loaded only when needed

### Directory Structure

```
llms-openref/
├── src/
│   ├── cli.ts                 # CLI entry point
│   ├── core/
│   │   ├── models.ts          # Zod schemas and data models
│   │   ├── parser.ts          # OpenRef YAML parser
│   │   └── formatter.ts       # LLM formatter with hierarchical numbering
│   ├── config/
│   │   ├── loader.ts          # Configuration loader with caching
│   │   └── schemas.ts         # Zod validation schemas
│   └── utils/
│       ├── fetcher.ts         # HTTP client (uses local files in monorepo)
│       └── logger.ts          # Lightweight logger
├── config/
│   ├── sdks.json              # SDK definitions
│   └── categories.json        # Category definitions
├── tests/
│   └── unit/
│       └── models.test.ts     # Unit tests
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Quick Start

First time working on this tool?

```bash
# Install dependencies
cd apps/docs/scripts/llms-openref
npm install

# Generate docs for one SDK
npx tsx src/cli.ts generate --sdk swift

# View output
ls -la ../../public/llms-openref/swift/v2/llm-docs/
```

### Architecture Overview

Data flows through four stages:

1. Parser: Reads OpenRef YAML specs, validates structure
2. Models: Type-safe data structures using Zod schemas
3. Formatter: Converts to hierarchical markdown with numbering
4. Output: Writes per-category and full documentation files

The pipeline uses immutable data structures and streaming writes for efficiency.

### Running Tests

```bash
npm test
npm run test:watch
npm run test:coverage
```

### Code Quality

```bash
npm run lint
npm run lint:fix
npm run format
npm run type-check
```

### Adding a New SDK

1. Add the SDK configuration to `config/sdks.json`:

```json
{
  "sdks": {
    "your_sdk": {
      "name": "Your SDK",
      "language": "yourlang",
      "versions": {
        "v1": {
          "displayName": "Your SDK v1",
          "spec": {
            "url": "https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/spec/your_sdk_v1.yml",
            "localPath": "../../spec/your_sdk_v1.yml",
            "format": "openref-0.1"
          },
          "output": {
            "baseDir": "your_sdk",
            "filenamePrefix": "your-sdk-v1"
          }
        }
      }
    }
  }
}
```

2. Ensure the OpenRef YAML file exists at `../../spec/your_sdk_v1.yml`

3. Run generation:

```bash
npx tsx src/cli.ts generate --sdk your_sdk
```

### Adding a New Category

Edit `config/categories.json`:

```json
{
  "categories": {
    "your_category": {
      "title": "Your Category",
      "description": "Category description",
      "systemPrompt": "This is the developer documentation for Supabase {sdk_name} - Your Category.",
      "operations": ["operation1", "operation2"],
      "order": 10
    }
  }
}
```

The `operations` array should contain operation IDs from the OpenRef spec.

### Debugging Generation Issues

```bash
# Enable verbose logging
npx tsx src/cli.ts generate --sdk swift --verbose

# Validate spec file
npx tsx src/cli.ts validate --sdk swift

# Check for uncategorized operations
npx tsx src/cli.ts generate --sdk dart
# Look for warnings like: "11 uncategorized operations: ..."
```

### Error Handling

The tool handles various failure modes:

- Malformed YAML: Generation fails immediately with parse error details
- Missing operations: Logged as warnings, operation skipped, generation continues
- Invalid category config: Error thrown, generation stops before writing files
- Missing spec files: Clear error message with expected file path

All errors include actionable messages pointing to the configuration or spec file that needs attention.

## Troubleshooting

### "Configuration not loaded" Error

Make sure to run commands from the `apps/docs/scripts/llms-openref` directory, or provide the correct `--config-dir` path.

### "SDK not found" Error

Run `npx tsx src/cli.ts list-sdks` to see available SDKs. Ensure the SDK name matches exactly (case-sensitive).

### "Spec file not found" Error

Verify the OpenRef YAML file exists at the path specified in `config/sdks.json`. Local paths are relative to the script directory.

### Command Only Prints Version

The `--version` flag conflicts with SDK version specification. Use `--sdk swift` without the `--version` flag to use the latest version, or modify the CLI option names if needed.

## Advanced Usage

### Consuming Programmatically

Files are served at predictable URLs following the pattern:
```
/llms-openref/{sdk}/{version}/llm-docs/{filename}.txt
```

Examples:
```bash
# Full documentation
curl https://supabase.com/llms-openref/dart/v2/llm-docs/supabase-dart-v2-full-llms.txt

# Category-specific docs
curl https://supabase.com/llms-openref/swift/v2/llm-docs/supabase-swift-v2-database-llms.txt
curl https://supabase.com/llms-openref/javascript/v2/llm-docs/supabase-js-v2-auth-llms.txt
```

### Loading into Embedding Pipelines

```python
import requests

# Fetch full documentation
url = 'https://supabase.com/llms-openref/dart/v2/llm-docs/supabase-dart-v2-full-llms.txt'
response = requests.get(url)
docs = response.text

# Split by H2 category headers for chunking
chunks = docs.split('\n## ')

# Process each chunk
for chunk in chunks:
    # Extract metadata from headers
    if chunk.startswith('<!--'):
        # Parse SDK, version, generation date from metadata comments
        pass

    # Send to embedding API
    # embedding = openai.Embedding.create(input=chunk, ...)
```

### Parsing with Hierarchical Structure

The consistent numbering scheme (1.1.1, 2.1.3, etc.) allows precise chunking:

```javascript
const response = await fetch('https://supabase.com/llms-openref/swift/v2/llm-docs/supabase-swift-v2-full-llms.txt');
const docs = await response.text();

// Split by operations (H3: ###)
const operations = docs.split(/\n### \d+\.\d+\./);

// Each operation contains examples (H4: ####)
operations.forEach(op => {
  const examples = op.split(/\n#### \d+\.\d+\.\d+\./);
  // Process examples individually for fine-grained retrieval
});
```

### Metadata Headers

Each generated file includes metadata in HTML comments:

```html
<!-- Generated from: spec/supabase_dart_v2.yml -->
<!-- SDK: dart, Version: v2, Generated: October 13, 2025 -->
```

This enables:
- Cache invalidation based on generation date
- Version tracking for embeddings
- Source traceability back to spec files

## Integration Opportunities

### Documentation UI

These generated files could be integrated into the Supabase documentation interface:
- Add download links on SDK reference pages (e.g., https://supabase.com/docs/reference/javascript)
- Provide category-specific downloads for developers using AI coding assistants

### Developer Tooling

- IDE extensions could fetch category-specific docs on-demand
- CI/CD pipelines could validate against generated documentation
- AI coding assistants could use targeted documentation based on import statements

### Community Tools

- Third-party tools can build on the predictable URL structure
- RAG systems can index documentation with stable metadata
- Documentation search tools can leverage hierarchical numbering

## Reference

- OpenRef Specifications: https://github.com/supabase/supabase/tree/master/apps/docs/spec

## Potential Future Development

Enhancements being considered for future versions:

**Manifest Files**
- JSON manifest listing all generated artifacts with hashes and metadata
- Enables downstream RAG pipelines to discover and diff chunks without globbing
- Useful for CI validation and cache invalidation

**Alternative Output Formats**
- JSONL export option for automatic embedding pipelines
- Structured data format for vector database ingestion
- Machine-readable format for downstream processing

**CI Integration**
- Smoke tests that validate generation for each SDK version
- Automated checks on spec file changes
- Regression detection before docs deployment

**Deterministic Chunk IDs**
- Stable anchors in headings for precise retrieval
- Deep-linking support even if filenames change
- Format: sdk:js:v2:database:insert:ex1
