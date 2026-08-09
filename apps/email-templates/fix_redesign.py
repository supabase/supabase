import os
import re

TEMPLATE_DIR = "/opt/supabase/apps/email-templates/templates"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update .card radius to 24px
    html = re.sub(
        r'border-radius:12px;',
        'border-radius:24px;',
        html
    )

    # 2. Update header: solid color, rounded top corners
    html = re.sub(
        r'background:\s*linear-gradient\([^)]+\)',
        'background: #030957; border-radius: 24px 24px 0 0',
        html
    )
    
    html = re.sub(
        r'background:linear-gradient\([^)]+\)',
        'background:#030957',
        html
    )

    # 3. Remove the yellow top border entirely
    html = re.sub(
        r'<tr>\s*<td class="header-top-border"[^>]*>&nbsp;</td>\s*</tr>',
        '',
        html
    )
    html = re.sub(
        r'\.header-top-border\s*\{[^}]+\}',
        '',
        html
    )

    # 4. Title color to Navy
    html = re.sub(
        r'\.title\s*\{[^}]+color:#111827;',
        lambda m: m.group(0).replace('color:#111827', 'color:#030957'),
        html
    )
    html = re.sub(
        r'class="title"[^>]+color:#111827;',
        lambda m: m.group(0).replace('color:#111827', 'color:#030957'),
        html
    )

    # 5. Buttons to pill shape
    html = re.sub(
        r'border-radius:8px;',
        'border-radius:9999px;',
        html
    )

    # 6. Details table styling: make it look like a unified gray box
    # Replace background:#ffffff of details-value with transparent or same gray
    html = re.sub(
        r'background:#ffffff;',
        'background:transparent;',
        html
    )
    # Actually details-value in the inline style had background:#ffffff; let's fix it
    html = re.sub(
        r'class="details-value" style="([^"]*?)background:#ffffff;"',
        r'class="details-value" style="\1"',
        html
    )
    # Remove borders from details-label and details-value to make it a unified block
    html = re.sub(
        r'border-bottom:1px solid #e5e7eb;',
        'border-bottom:none;',
        html
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html)

for root, _, files in os.walk(TEMPLATE_DIR):
    for file in files:
        if file.endswith('.html'):
            fix_file(os.path.join(root, file))

print("Fix complete.")
