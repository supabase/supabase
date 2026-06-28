# gstack Rules

gstack workflows are active in this project. In Amazon Q chat, type `@gstack` to activate.

## Auto-routing
Describe what you want — gstack executes the right workflow automatically:
- "there's a bug" → INVESTIGATE
- "review my code" → REVIEW
- "ship this" → SHIP
- "QA http://localhost:3000" → QA + BROWSE
- "security audit" → CSO
- "weekly retro" → RETRO
- "I want to build X" → OFFICE-HOURS

## Browse tool
```
node "C:\\Users\\aarti\\.gstack\\browse.cjs" goto https://example.com
node "C:\\Users\\aarti\\.gstack\\browse.cjs" snapshot -i
node "C:\\Users\\aarti\\.gstack\\browse.cjs" screenshot
```
