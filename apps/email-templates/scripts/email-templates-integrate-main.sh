#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/opt/supabase}"
APP_DIR="$REPO_ROOT/apps/email-templates"
COMPOSE_DIR="$REPO_ROOT/docker"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.yml"
LOGO_URL="https://alazab.com/w.gif"

[[ -d "$APP_DIR/templates" ]] || { echo "STOP: templates directory not found: $APP_DIR/templates" >&2; exit 1; }
[[ -f "$APP_DIR/src/render.ts" ]] || { echo "STOP: render.ts not found" >&2; exit 1; }
[[ -f "$COMPOSE_FILE" ]] || { echo "STOP: main compose not found: $COMPOSE_FILE" >&2; exit 1; }

cd "$APP_DIR"

python3 - "$LOGO_URL" <<'PY'
from pathlib import Path
import json
import re
import sys

logo_url = sys.argv[1]
root = Path('.')

old = '''                    {{#logo_url}}<img src="{{logo_url}}" width="150" alt="{{brand_name}}" style="display:block;max-width:150px;height:auto;border:0;">{{/logo_url}}
                    {{^logo_url}}<div style="font-size:24px;line-height:30px;font-weight:700;color:#ffffff;">{{brand_name}}</div>{{/logo_url}}'''
new = '''                    <img src="{{logo_url}}" width="150" alt="{{brand_name}}" style="display:block;max-width:150px;height:auto;border:0;">'''

html_files = sorted((root / 'templates').rglob('*.html'))
if len(html_files) != 144:
    raise SystemExit(f'STOP: expected 144 HTML templates, found {len(html_files)}')

changed = 0
for path in html_files:
    text = path.read_text(encoding='utf-8')
    if old in text:
        path.write_text(text.replace(old, new, 1), encoding='utf-8')
        changed += 1
    elif '{{^logo_url}}' in text:
        raise SystemExit(f'STOP: unexpected logo fallback format in {path}')
    elif '<img src="{{logo_url}}"' not in text:
        raise SystemExit(f'STOP: logo image block missing in {path}')

# Approved runtime default. Explicit logo_url remains an image override, never text fallback.
render = root / 'src/render.ts'
text = render.read_text(encoding='utf-8')
anchor = 'const TONE_COLORS: Record<TemplateTone, { background: string; border: string; color: string }> = {'
if 'const DEFAULT_LOGO_URL' not in text:
    if anchor not in text:
        raise SystemExit('STOP: render.ts anchor not found')
    text = text.replace(anchor, f'const DEFAULT_LOGO_URL = "{logo_url}";\n\n' + anchor, 1)
else:
    text = re.sub(r'const DEFAULT_LOGO_URL\s*=\s*"[^"]+";', f'const DEFAULT_LOGO_URL = "{logo_url}";', text, count=1)
text = text.replace(
    '    logo_url: data.logo_url ?? options.logoUrl,',
    '    logo_url: data.logo_url ?? options.logoUrl ?? DEFAULT_LOGO_URL,',
)
render.write_text(text, encoding='utf-8')

# Update visual preview files.
preview_dir = root / 'preview'
if preview_dir.exists():
    for path in sorted(preview_dir.glob('*.html')):
        if path.name == 'index.html':
            continue
        text = path.read_text(encoding='utf-8')
        text = re.sub(
            r'<div style="font-size:24px;line-height:30px;font-weight:700;color:#ffffff;">[^<]+</div>',
            f'<img src="{logo_url}" width="150" alt="Alazab" style="display:block;max-width:150px;height:auto;border:0;">',
            text,
            count=1,
        )
        path.write_text(text, encoding='utf-8')

visual = root / 'templates.html'
if visual.exists():
    text = visual.read_text(encoding='utf-8')
    text = text.replace('/* Header with brand: UberFix white + yellow */', '/* Header with approved Alazab logo */')
    text = text.replace('''    .brand-name {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.4px;
    }
    .brand-white {
      color: #FFFFFF;
    }
    .brand-yellow {
      color: #FFB900;
    }
''', '''    .brand-logo {
      display: block;
      width: 150px;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
      border: 0;
    }
''')
    text = text.replace('      .brand-name { font-size: 24px; }', '      .brand-logo { width: 132px; }')
    text = text.replace(
        '<div class="brand-name"><span class="brand-white">Uber</span><span class="brand-yellow">Fix</span></div>',
        f'<img class="brand-logo" src="{logo_url}" width="150" alt="Alazab">',
    )
    visual.write_text(text, encoding='utf-8')

# Environment defaults.
env_example = root / '.env.container.example'
if env_example.exists():
    text = env_example.read_text(encoding='utf-8')
    text = re.sub(r'^EMAIL_LOGO_URL=.*$', f'EMAIL_LOGO_URL={logo_url}', text, flags=re.M)
    env_example.write_text(text, encoding='utf-8')

standalone = root / 'docker-compose.yml'
if standalone.exists():
    text = standalone.read_text(encoding='utf-8')
    text = text.replace('EMAIL_LOGO_URL: ${EMAIL_LOGO_URL:-}', f'EMAIL_LOGO_URL: ${{EMAIL_LOGO_URL:-{logo_url}}}')
    standalone.write_text(text, encoding='utf-8')

# Regenerate the checked-in runtime catalog exactly from source templates.
entries = json.loads((root / 'catalog.json').read_text(encoding='utf-8'))
out = [
    '/* AUTO-GENERATED FILE. Run `deno task build` after editing source templates. */',
    'import type { TemplateMetadata } from "./types.ts";',
    '',
    'export const TEMPLATE_CATALOG: readonly TemplateMetadata[] = [',
]
for entry in entries:
    system = str(entry['system'])
    event = str(entry['event'])
    html = (root / f'templates/{system}/{event}.html').read_text(encoding='utf-8')
    plain = (root / f'templates/{system}/{event}.txt').read_text(encoding='utf-8')
    out.append('  ' + json.dumps({**entry, 'html': html, 'text': plain}, ensure_ascii=False, separators=(',', ':')) + ',')
out.extend([
    '] as const;',
    '',
    'export const TEMPLATE_IDS = TEMPLATE_CATALOG.map((template) => template.id);',
    'export const TEMPLATE_BY_ID = new Map(TEMPLATE_CATALOG.map((template) => [template.id, template]));',
    '',
])
(root / 'src/catalog.generated.ts').write_text('\n'.join(out), encoding='utf-8')

for path in html_files:
    content = path.read_text(encoding='utf-8')
    if '{{^logo_url}}' in content or '<img src="{{logo_url}}"' not in content:
        raise SystemExit(f'STOP: branding validation failed: {path}')

print(f'Logo applied to {len(html_files)} templates; source files changed this run: {changed}.')
PY

# Create files consumed by the main compose service.
install -d -m 700 "$APP_DIR/secrets"
umask 077
[[ -s "$APP_DIR/secrets/templates_api_token" ]] || openssl rand -hex 32 > "$APP_DIR/secrets/templates_api_token"
[[ -e "$APP_DIR/secrets/resend_api_key" ]] || : > "$APP_DIR/secrets/resend_api_key"
[[ -e "$APP_DIR/secrets/email_webhook_secret" ]] || : > "$APP_DIR/secrets/email_webhook_secret"
chmod 400 \
  "$APP_DIR/secrets/templates_api_token" \
  "$APP_DIR/secrets/resend_api_key" \
  "$APP_DIR/secrets/email_webhook_secret"

python3 - "$COMPOSE_FILE" <<'PY'
from pathlib import Path
import sys

compose = Path(sys.argv[1])
text = compose.read_text(encoding='utf-8')
service_key = '\n  email-templates:\n'

service = r'''
  email-templates:
    container_name: supabase-email-templates
    build:
      context: ../apps/email-templates
      dockerfile: Dockerfile
      args:
        DENO_VERSION: ${DENO_VERSION:-2.4.3}
    image: ${EMAIL_TEMPLATES_IMAGE:-ghcr.io/alazabdev/email-templates}:${EMAIL_TEMPLATES_IMAGE_TAG:-local}
    restart: unless-stopped
    init: true
    read_only: true
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:size=16m,mode=1777
    environment:
      TEMPLATES_BIND: 0.0.0.0
      TEMPLATES_PORT: 8080
      TEMPLATES_API_TOKEN_FILE: /run/secrets/templates_api_token
      MAX_BODY_BYTES: ${EMAIL_TEMPLATES_MAX_BODY_BYTES:-262144}
      ALLOWED_ORIGINS: ${EMAIL_TEMPLATES_ALLOWED_ORIGINS:-}
      ENABLE_SEND: ${EMAIL_TEMPLATES_ENABLE_SEND:-false}
      ALLOW_HTTP_LOCALHOST: "false"
      EMAIL_PROVIDER: ${EMAIL_TEMPLATES_PROVIDER:-resend}
      RESEND_API_KEY_FILE: /run/secrets/resend_api_key
      RESEND_API_URL: ${RESEND_API_URL:-}
      EMAIL_WEBHOOK_URL: ${EMAIL_WEBHOOK_URL:-}
      EMAIL_WEBHOOK_SECRET_FILE: /run/secrets/email_webhook_secret
      EMAIL_BRAND_NAME: ${EMAIL_BRAND_NAME:-Alazab}
      EMAIL_COMPANY_NAME: ${EMAIL_COMPANY_NAME:-شركة العزب}
      EMAIL_LOGO_URL: https://alazab.com/w.gif
      EMAIL_SUPPORT_EMAIL: ${EMAIL_SUPPORT_EMAIL:-support@alazab.com}
      EMAIL_WEBSITE_URL: https://alazab.com
      EMAIL_FROM_AUTH: ${EMAIL_FROM_AUTH:-auth@alazab.com}
      EMAIL_FROM_SUPPORT: ${EMAIL_FROM_SUPPORT:-support@alazab.com}
      EMAIL_FROM_DEVOPS: ${EMAIL_FROM_DEVOPS:-devops@alazab.com}
      EMAIL_FROM_CORE: ${EMAIL_FROM_CORE:-noreply@alazab.com}
      EMAIL_FROM_FINANCE: ${EMAIL_FROM_FINANCE:-finance@alazab.com}
      EMAIL_FROM_MAINT: ${EMAIL_FROM_MAINT:-maintenance@alazab.com}
      EMAIL_FROM_PAYMENTS: ${EMAIL_FROM_PAYMENTS:-billing@alazab.com}
      EMAIL_FROM_PRODUCTS: ${EMAIL_FROM_PRODUCTS:-products@alazab.com}
      EMAIL_FROM_PROJECTS: ${EMAIL_FROM_PROJECTS:-projects@alazab.com}
      EMAIL_FROM_AI: ${EMAIL_FROM_AI:-ai@alazab.com}
    volumes:
      - ../apps/email-templates/secrets/templates_api_token:/run/secrets/templates_api_token:ro
      - ../apps/email-templates/secrets/resend_api_key:/run/secrets/resend_api_key:ro
      - ../apps/email-templates/secrets/email_webhook_secret:/run/secrets/email_webhook_secret:ro
    healthcheck:
      test:
        - CMD
        - deno
        - eval
        - --allow-net=127.0.0.1:8080
        - "const r=await fetch('http://127.0.0.1:8080/healthz');if(!r.ok)Deno.exit(1)"
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
'''

if service_key not in text:
    marker = '\n  kong:\n'
    if marker not in text:
        raise SystemExit('STOP: service insertion marker "  kong:" not found in main docker-compose.yml')
    text = text.replace(marker, '\n' + service + marker, 1)
    compose.write_text(text, encoding='utf-8')
    print('Added email-templates to the main docker-compose.yml.')
else:
    print('email-templates already exists in the main docker-compose.yml; no duplicate added.')
PY

cd "$COMPOSE_DIR"
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d --build email-templates

docker compose --env-file .env ps email-templates
docker inspect supabase-email-templates \
  --format 'Status={{.State.Status}} Health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}'

printf '\nInternal service URL: http://email-templates:8080\n'
printf 'Approved logo: %s\n' "$LOGO_URL"
