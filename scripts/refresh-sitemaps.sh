#!/bin/bash
set -euo pipefail

# Downloads the public sitemaps for the monthly "Refresh Sitemaps" workflow and
# writes each one's URLs to sitemaps/json_output/ as a sorted JSON array with
# duplicates removed. Each download is validated before its array replaces the
# committed snapshot, and each URL is written on its own line so Git diffs show
# individual URL changes.

cd "$(dirname "$0")/.."

OUTPUT_DIR="sitemaps/json_output"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# Fetch one sitemap, reject anything that is not a sitemap, such as an error
# page or an empty urlset, then write its unique, sorted URLs to dest
fetch() {
  local url="$1" dest="$2"
  local xml="$TMP_DIR/sitemap.xml"
  mkdir -p "$(dirname "$dest")"
  curl -sSfL --retry 3 --max-time 120 -o "$xml" "$url"
  python3 - "$xml" "$dest" <<'EOF'
import json
import sys
import xml.etree.ElementTree as ET

NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
root = ET.parse(sys.argv[1]).getroot()
if root.tag != NS + 'urlset':
    sys.exit(f'unexpected root element: {root.tag}')
entries = root.findall(NS + 'url')
if not entries:
    sys.exit('no <url> entries found')

# A set drops duplicate URLs and sorted() keeps the output order stable
urls = set()
for entry in entries:
    loc = entry.find(NS + 'loc')
    if loc is None or not (loc.text or '').strip():
        sys.exit('<url> entry without a non-empty <loc>')
    urls.add(loc.text.strip())

with open(sys.argv[2], 'w') as f:
    json.dump(sorted(urls), f, indent=2)
    f.write('\n')
EOF
  echo "Fetched $url -> $dest"
}

fetch "https://supabase.com/sitemap_www.xml" "$OUTPUT_DIR/sitemap_www.json"
fetch "https://supabase.com/docs/sitemap.xml" "$OUTPUT_DIR/sitemap_docs.json"
fetch "https://supabase.com/kb/sitemap-0.xml" "$OUTPUT_DIR/sitemap_kb.json"
