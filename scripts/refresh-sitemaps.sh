#!/bin/bash
set -euo pipefail

# Downloads the public sitemaps into sitemaps/raw_output/ for the monthly
# "Refresh Sitemaps" workflow. Each download is validated before it replaces
# the committed snapshot, and each <url> entry is written on its own line so
# Git diffs show individual URL changes.

cd "$(dirname "$0")/.."

OUTPUT_DIR="sitemaps/raw_output"

# Fetch one sitemap and reject anything that is not a sitemap, such as an error
# page or an empty urlset, before it can replace the committed snapshot
fetch() {
  local url="$1" dest="$2"
  mkdir -p "$(dirname "$dest")"
  curl -sSfL --retry 3 --max-time 120 -o "$dest" "$url"
  python3 - "$dest" <<'EOF'
import sys
import xml.etree.ElementTree as ET

NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
root = ET.parse(sys.argv[1]).getroot()
if root.tag != NS + 'urlset':
    sys.exit(f'unexpected root element: {root.tag}')
urls = root.findall(NS + 'url')
if not urls:
    sys.exit('no <url> entries found')
for url in urls:
    loc = url.find(NS + 'loc')
    if loc is None or not (loc.text or '').strip():
        sys.exit('<url> entry without a non-empty <loc>')
EOF
  echo "Fetched $url -> $dest ($(wc -c < "$dest") bytes)"
}

fetch "https://supabase.com/sitemap_www.xml" "$OUTPUT_DIR/sitemap_www.xml"
fetch "https://supabase.com/docs/sitemap.xml" "$OUTPUT_DIR/sitemap_docs.xml"
fetch "https://supabase.com/kb/sitemap-0.xml" "$OUTPUT_DIR/sitemap_kb.xml"

# Start each <url> entry on its own line
python3 - "$OUTPUT_DIR" <<'EOF'
import pathlib
import re
import sys

for path in pathlib.Path(sys.argv[1]).glob('*.xml'):
    text = path.read_text()
    text = re.sub(r'\?>\s*<urlset', '?>\n<urlset', text)
    text = re.sub(r'\s*<url>', '\n  <url>', text)
    text = re.sub(r'\s*</urlset>', '\n</urlset>', text)
    path.write_text(text.rstrip('\n') + '\n')
EOF
