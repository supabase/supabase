# CI Integration: Reference Sync Validation

## Overview

The reference sync validation is integrated into the `docs-js-libs-update.yml` workflow, which runs automatically when a new stable version of supabase-js is released.

## Workflow

### 1. Trigger (from supabase-js repo)
```
supabase-js stable release → triggers docs-js-libs-update.yml
```

### 2. Steps in CI

1. **Regenerate TypeDoc files**
   ```bash
   cd apps/docs/spec
   make  # Downloads & transforms latest specs
   ```

2. **Run validation**
   ```bash
   cd apps/docs
   pnpm run validate:references:fix
   ```
   - Generates `sync-report.json` with all issues
   - Generates `sync-report-stubs.yaml` with documentation stubs
   - Exits with error if validation fails (non-blocking)

3. **Generate PR comment**
   ```bash
   pnpm run validate:references:comment
   ```
   - Reads `sync-report.json` and `sync-report-stubs.yaml`
   - Formats as markdown with GitHub suggestions
   - Outputs to temp file for PR comment

4. **Create PR**
   - PR is created with regenerated TypeDoc files
   - Validation comment is posted automatically

5. **Post validation results**
   - Comment includes:
     - Summary of issues
     - List of broken references
     - **GitHub suggestions** for new APIs
     - Full JSON report (collapsed)

### 3. Example PR Comment

```markdown
## 📊 Reference Documentation Sync Report

### Summary

- ❌ **6 broken references** (APIs removed)
- 📝 **12 new undocumented APIs** (auto-detected)
- ✅ 10/12 stubs have TypeDoc descriptions
- 💡 3/12 stubs have examples

---

### 🔴 Broken References (Action Required)

<details>
<summary>View broken references (6)</summary>

- `@supabase/auth-js.GoTrueClient.mfa.enroll`
...

**Action:** Remove these entries from `spec/supabase_js_v2.yml`
</details>

---

### ✨ New APIs to Document

Click **"Commit suggestion"** on each block below.

#### VectorBucketApi

```suggestion
  - id: createbucket
    title: createBucket
    $ref: '@supabase/storage-js.index.VectorBucketApi.createBucket'
    description: |
      Creates a new vector bucket
      Vector buckets are containers for vector indexes and their data
    examples:
      - id: example-1
        name: Basic usage
        code: |
          ```typescript
          const { data, error } = await client.createBucket('embeddings')
          ```
```

🤖 Auto-generated via `validate-reference-sync.ts`
```

## Developer Workflow

### When you receive the PR:

1. **Review broken references**
   - Open `spec/supabase_js_v2.yml`
   - Remove entries for APIs that no longer exist
   - Commit: `docs: remove broken reference entries`

2. **Apply suggestions for new APIs**
   - Click "Commit suggestion" on each code block you want to add
   - GitHub will create a commit for each suggestion
   - OR batch commit multiple suggestions at once

3. **Enrich the documentation**
   - Review auto-generated stubs
   - Add more detailed descriptions if needed
   - Add more examples
   - Add notes, warnings, etc.

4. **Merge the PR**
   - All documentation is now in sync!

## Benefits

✅ **No manual file commits**
- Validation reports are ephemeral (in PR comments only)
- No `sync-report.json` committed to repo

✅ **One-click documentation**
- GitHub's "Commit suggestion" button
- Each suggestion is properly formatted YAML
- Includes TypeDoc descriptions and examples

✅ **Comprehensive coverage**
- Automatically detects new APIs
- Flags removed APIs
- No hardcoded lists to maintain

✅ **Rich stubs**
- 85% have real descriptions from TypeDoc
- 15% have working code examples
- Ready to use with minimal editing

## Scripts

### `validate:references`
Basic validation without stub generation.

```bash
pnpm run validate:references
```

### `validate:references:fix`
Validation + generate documentation stubs.

```bash
pnpm run validate:references:fix
```

### `validate:references:comment`
Generate GitHub PR comment from validation results.

```bash
pnpm run validate:references:comment
```

## Files

- **Workflow**: `.github/workflows/docs-js-libs-update.yml`
- **Validation script**: `apps/docs/scripts/validate-reference-sync.ts`
- **Comment generator**: `apps/docs/scripts/generate-yaml-suggestions.ts`
- **Documentation**: `apps/docs/scripts/validate-reference-sync.README.md`

## Troubleshooting

**PR comment not appearing?**
- Check workflow logs for "Generate PR comment" step
- Ensure `sync-report.json` exists after validation
- Verify PR was created successfully

**Suggestions not formatting correctly?**
- GitHub requires exact YAML indentation (2 spaces)
- Check suggestion blocks start with proper indent
- Verify no trailing whitespace

**Too many suggestions overwhelming?**
- Suggestions are grouped by class
- You can apply them selectively
- Or use the stub file directly and copy what you need

**Validation failing incorrectly?**
- Check if new API matches naming patterns (`*Client`, `*Api`, etc.)
- Warnings won't block CI, only errors
- Review classification logic in validation script

## Future Enhancements

Potential improvements:
- Auto-remove broken references (optional flag)
- Interactive mode for reviewing suggestions
- Batch apply all suggestions at once
- Integration with docs preview/staging
