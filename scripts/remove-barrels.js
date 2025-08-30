#!/usr/bin/env node
/*
  remove-barrels.js
  - Finds directory-local barrel index files that only contain lines like:
      export * from './SomeFile'
  - Rewrites relative imports that point to that directory to point directly
    to the re-exported file (e.g., './Dir' -> './Dir/SomeFile')
  - Deletes the barrel index files if no imports remain pointing at them
  Notes:
  - This script intentionally only handles single-target star-reexport barrels.
    It skips barrels that re-export multiple files or use named re-exports.
*/

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.resolve(__dirname, '..');

const VALID_CODE_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']);
const INDEX_BASENAMES = new Set(['index.ts', 'index.tsx', 'index.js', 'index.jsx', 'index.mjs', 'index.cjs', 'index.mts', 'index.cts']);

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.turbo',
  'dist',
  'build',
  '.next',
  'out',
  'coverage',
  '.vercel',
  '.cache',
  '.pnpm-store',
]);

/** Recursively list files under dir, honoring ignore list */
async function listFiles(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    // Skip dotfiles directories we don't know
    if (entry.isDirectory() && IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await listFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function isCodeFile(file) {
  return VALID_CODE_EXTS.has(path.extname(file));
}

function isIndexFile(file) {
  return INDEX_BASENAMES.has(path.basename(file));
}

function parseSingleStarReexportTargets(fileContent) {
  // Capture lines like: export * from './Something'; optional semicolon/whitespace
  const lines = fileContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const targets = [];
  for (const line of lines) {
    const m = line.match(/^export\s*\*\s*from\s*['"](\.\/[^'"]+)['"];?\s*$/);
    if (!m) return null; // Not exclusively a single star re-export per-line barrel
    targets.push(m[1]);
  }
  if (targets.length !== 1) return null; // Skip multi-target barrels
  // Normalize './X' -> 'X'
  const targetRel = targets[0].replace(/^\.\//, '');
  return targetRel;
}

async function main() {
  let allFiles = (await listFiles(WORKSPACE_ROOT)).filter(isCodeFile);

  // 1) Discover simple barrels
  const barrels = new Map(); // key: dirAbs -> { indexFile, targetBaseName }
  for (const file of allFiles) {
    if (!isIndexFile(file)) continue;
    const content = await fs.promises.readFile(file, 'utf8');
    const targetBaseName = parseSingleStarReexportTargets(content);
    if (!targetBaseName) continue; // skip non-simple barrels
    barrels.set(path.dirname(file), { indexFile: file, targetBaseName });
  }

  if (barrels.size === 0) {
    console.log('No simple barrels found. Nothing to do.');
    return;
  }

  console.log(`Found ${barrels.size} simple barrel(s).`);

  // 2) Rewrite imports in all code files
  let filesRewritten = 0;
  for (const file of allFiles) {
    let src;
    try {
      src = await fs.promises.readFile(file, 'utf8');
    } catch (e) {
      // Skip files that disappeared during rewrites
      continue;
    }
    let changed = false;
    // Match import ... from '...'; and dynamic import('...') and export ... from '...'
    src = src.replace(/(from\s*['"]([^'"]+)['"];?|import\(\s*['"]([^'"]+)['"]\s*\)|export\s*\*\s*from\s*['"]([^'"]+)['"];?)/g, (full, _a, from1, from2, from3) => {
      const spec = from1 || from2 || from3;
      if (!spec) return full;
      // Only rewrite relative imports
      if (!(spec.startsWith('./') || spec.startsWith('../'))) return full;
      const importerDir = path.dirname(file);
      const resolved = path.resolve(importerDir, spec);
      // If spec points to an index directly, adjust to dir
      let resolvedDir = resolved;
      const base = path.basename(resolved);
      if (INDEX_BASENAMES.has(base)) {
        resolvedDir = path.dirname(resolved);
      }
      // If resolvedDir is a barrel directory we discovered, rewrite to target
      const barrel = barrels.get(resolvedDir);
      if (!barrel) return full;
      // Build new spec by appending '/<targetBaseName>' to original spec without trailing '/index'
      let newSpec = spec;
      if (spec.endsWith('/index')) newSpec = spec.slice(0, -('/index'.length));
      newSpec = newSpec.replace(/\/$/, '');
      newSpec = `${newSpec}/${barrel.targetBaseName}`;
      changed = true;
      // Reconstruct the original matched form preserving surrounding tokens
      return full.replace(spec, newSpec);
    });

    if (changed) {
      await fs.promises.writeFile(file, src, 'utf8');
      filesRewritten++;
    }
  }

  console.log(`Rewritten ${filesRewritten} file(s).`);

  // Refresh file list after rewrites in case files moved/deleted
  allFiles = (await listFiles(WORKSPACE_ROOT)).filter(isCodeFile);

  // 3) Delete any barrels no longer referenced
  let barrelsDeleted = 0;
  for (const [dirAbs, info] of barrels.entries()) {
    const idx = info.indexFile;
    // Scan all files again to see if any import still targets the dir or '/index'
    let stillReferenced = false;
    for (const file of allFiles) {
      if (file === idx) continue;
      let src;
      try {
        src = await fs.promises.readFile(file, 'utf8');
      } catch (e) {
        // Skip files that disappeared
        continue;
      }
      // Build possible relative specs from this file to the barrel dir
      const relToDir = path.relative(path.dirname(file), dirAbs) || '';
      // Normalize to posix-like for import strings
      const relNorm = relToDir.split(path.sep).join('/');
      const candidates = new Set();
      if (relNorm === '') {
        candidates.add('./');
      } else if (!relNorm.startsWith('.')) {
        candidates.add('./' + relNorm);
      } else {
        candidates.add(relNorm);
      }
      // Both direct dir and '/index'
      const specs = [];
      for (const c of candidates) {
        specs.push(c);
        specs.push(c.replace(/\/$/, '') + '/index');
      }
      // Check if src references any of these specs
      for (const s of specs) {
        const re = new RegExp(`['\"]${s}['\"]`);
        if (re.test(src)) {
          stillReferenced = true;
          break;
        }
      }
      if (stillReferenced) break;
    }
    if (!stillReferenced) {
      try {
        await fs.promises.unlink(idx);
        barrelsDeleted++;
        console.log('Deleted barrel:', path.relative(WORKSPACE_ROOT, idx));
      } catch (e) {
        console.warn('Failed to delete barrel', idx, e.message);
      }
    }
  }

  console.log(`Deleted ${barrelsDeleted} barrel(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

