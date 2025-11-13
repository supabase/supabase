# Reference Sync Validation Script

This script validates that the documentation YAML files (e.g., `supabase_js_v2.yml`) are in sync with the auto-generated TypeDoc JSON files (e.g., `combined.json`).

## Purpose

The documentation system combines two sources:

- **Auto-generated API docs** from TypeDoc (`spec/enrichments/tsdoc_v2/combined.json`)
- **Human-written enrichments** in YAML files (`spec/supabase_js_v2.yml`)

This script ensures they stay in sync by detecting:

1. **Broken references**: YAML entries that reference APIs no longer in the code
2. **Missing documentation**: Public APIs that exist but aren't documented in YAML
3. **Private APIs exposed**: Internal APIs incorrectly exposed in public docs

## Key Features

✅ **Zero-maintenance**: Automatically discovers new API classes without hardcoded lists
✅ **TypeDoc extraction**: Pulls descriptions and examples directly from source code comments
✅ **Smart prioritization**: Errors for critical APIs, warnings for edge cases
✅ **Rich stubs**: Generated stubs include real descriptions and examples when available

## Usage

### Basic validation

```bash
pnpm run validate:references
```

This will:

- Validate the sync between `combined.json` and `supabase_js_v2.yml`
- Generate a report at `sync-report.json`
- Exit with code 1 if issues are found (useful for CI)

### Auto-fix mode

```bash
pnpm run validate:references:fix
```

This will:

- Run the validation
- Generate stub YAML entries for missing documentation at `sync-report-stubs.yaml`
- You can then manually add these stubs to your YAML file and fill in descriptions

### Advanced options

```bash
# Custom report path
tsx scripts/validate-reference-sync.ts --report-path my-report.json

# Strict mode (fail on warnings too)
tsx scripts/validate-reference-sync.ts --strict

# Combine options
tsx scripts/validate-reference-sync.ts --fix --strict --report-path output/report.json
```

## What gets validated

### Dynamic API Discovery

The script **automatically discovers** all classes with public methods. No hardcoded lists to maintain!

**How it works:**

1. Scans `combined.json` for all classes (kind: 128)
2. Checks each class for public methods or constructors
3. Classifies based on patterns and context

**Classification:**

**ERROR severity** (must be documented):

- Classes ending in: `Client`, `Api`, `Builder`, `Channel`, `Scope`, `Manager`
- Classes exported from top-level or `index` module
- Classes with any existing documentation (proves they're user-facing)

**WARNING severity** (review needed):

- Other classes with public methods
- Allows manual decision on whether to document

**EXCLUDED** (skipped entirely):

- Error classes (name ends with `Error`)
- Private/internal methods (starting with `_`)
- Protected methods (`isProtected: true`)
- Inherited methods (`isInherited: true`)
- Classes with `@internal` JSDoc tag

**Examples of auto-detected classes:**

- `VectorBucketApi` ✅ (ends with `Api`)
- `PostgrestFilterBuilder` ✅ (ends with `Builder`)
- `RealtimeChannel` ✅ (ends with `Channel`)
- `AuthError` ❌ (ends with `Error` - excluded)
- Any future API you add ✅ (automatically detected!)

### Example issues

**Broken reference:**

```
Reference '@supabase/auth-js.GoTrueClient.mfa.enroll' in YAML
does not exist in combined.json. This API may have been removed.
```

**Missing documentation:**

```
Public API '@supabase/supabase-js.GoTrueClient.getUser' exists
in combined.json but is not documented in YAML.
```

## TypeDoc Integration

### Automatic Description Extraction

The script extracts descriptions from TypeDoc comments in `combined.json`:

**Source (in your code):**

```typescript
/**
 * Creates a new vector bucket
 * Vector buckets are containers for vector indexes and their data
 * @returns Promise with empty response on success or error
 */
async createBucket(name: string): Promise<VectorBucketResponse>
```

**Generated stub:**

```yaml
- id: createbucket
  title: createBucket
  $ref: '@supabase/storage-js.index.VectorBucketApi.createBucket'
  description: |
    Creates a new vector bucket
    Vector buckets are containers for vector indexes and their data
```

### Automatic Example Extraction

Examples from `@example` JSDoc tags are also extracted:

**Source (in your code):**

````typescript
/**
 * Creates a new vector bucket
 * @example
 * ```typescript
 * const { data, error } = await client.createBucket('embeddings-prod')
 * if (error) {
 *   console.error('Failed:', error.message)
 * }
 * ```
 */
````

**Generated stub:**

````yaml
- id: createbucket
  title: createBucket
  $ref: '@supabase/storage-js.index.VectorBucketApi.createBucket'
  description: Creates a new vector bucket
  examples:
    - id: example-1
      name: Example 1
      code: |
        ```typescript
        const { data, error } = await client.createBucket('embeddings-prod')
        if (error) {
          console.error('Failed:', error.message)
        }
        ```
````

**Benefits:**

- 🎯 Less manual work - descriptions pulled from source
- 📝 Single source of truth - update code comments, stubs auto-update
- ✅ Consistency - same descriptions in code and docs

## Report format

The report is a JSON file with:

```json
{
  "timestamp": "2025-11-13T09:33:53.613Z",
  "summary": {
    "total_issues": 188,
    "broken_references": 6,
    "missing_documentation": 182,
    "private_apis_exposed": 0
  },
  "issues": [
    {
      "type": "broken-reference",
      "severity": "error",
      "ref": "@supabase/auth-js.GoTrueClient.mfa.enroll",
      "message": "...",
      "location": "functions[id=\"mfa-enroll\"]"
    },
    {
      "type": "missing-documentation",
      "severity": "error",
      "path": "@supabase/storage-js.index.VectorBucketApi.createBucket",
      "message": "..."
    }
  ]
}
```

**Console output** shows statistics:

```
✅ Generated 176 stub entries at sync-report-stubs.yaml
   📝 150/176 have TypeDoc descriptions
   💡 27/176 have TypeDoc examples
```

## Integration with CI

Add to your CI workflow:

```yaml
- name: Validate reference docs sync
  run: pnpm run validate:references
```

The script exits with code 1 if there are errors, which will fail the CI build.

## Workflow

### When you update the SDK

1. Update your TypeScript SDK code
2. Regenerate the TypeDoc JSON: `make -C spec download transform`
3. Run validation: `pnpm run validate:references:fix`
4. Review `sync-report.json` for broken references (APIs removed)
5. Review `sync-report-stubs.yaml` for new APIs to document
6. Update `spec/supabase_js_v2.yml`:
   - Remove entries for broken references
   - Add entries from stubs (convert JSON to YAML format)
   - Fill in descriptions and examples
7. Run validation again to confirm: `pnpm run validate:references`

### When you update documentation

1. Edit `spec/supabase_js_v2.yml`
2. Run validation: `pnpm run validate:references`
3. Fix any broken references flagged by the validator

## Files

- **Script**: `apps/docs/scripts/validate-reference-sync.ts`
- **Input**:
  - `apps/docs/spec/enrichments/tsdoc_v2/combined.json` (generated)
  - `apps/docs/spec/supabase_js_v2.yml` (manual)
- **Output**:
  - `sync-report.json` (validation report)
  - `sync-report-stubs.yaml` (generated stubs with `--fix`)

## Implementation notes

### How $ref works

YAML uses dot notation to reference TypeDoc nodes:

```yaml
$ref: '@supabase/auth-js.GoTrueClient.signUp'
      ↓              ↓                ↓
    Package      Class            Method
```

The script parses `combined.json` as a tree and builds a lookup map for these references.

### TypeDoc kinds

The script checks these TypeDoc node kinds:

- `512`: Constructor
- `2048`: Method
- `128`: Class (for context)

### Public API detection

APIs are considered public if they:

- Don't start with `_`
- Don't have `isProtected` or `isPrivate` flags
- Aren't marked with `@internal` in JSDoc
- Are on a main client class

## Troubleshooting

**New API not being detected?**

- Check if the class name matches a pattern (`Client`, `Api`, `Builder`, etc.)
- If not, it will show as a WARNING - you can still document it
- To make it an ERROR, ensure it's exported from top-level or add partial docs

**Too many warnings?**

- Warnings are for review - you can ignore non-user-facing classes
- Use `--strict` mode in CI only if you want warnings to fail builds
- Consider if the warned class should have a documented method (which promotes it to ERROR)

**Broken reference for valid API?**

- Check the exact casing and path in `combined.json`
- The structure might have changed (e.g., from method to property)
- Verify the API still exists in the source code

**TypeDoc descriptions not extracted?**

- Check that JSDoc comments are on the method/constructor signature
- Ensure comments use `/** */` format (not `//`)
- Verify `combined.json` was regenerated after adding comments

**Missing legitimate documentation?**

- Add it to the YAML file manually
- Or use `--fix` to generate a stub (with TypeDoc content) and fill in the rest
