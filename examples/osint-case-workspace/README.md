# Fieldnote case workspace prototype

A static, interactive prototype for a team case workspace with a relationship map, evidence register, and scenario planner.

## Run locally

Open `index.html` in a browser. The prototype uses local demo data and does not require an install step or a Supabase connection.

## Included

- Search and filter fictional cases
- Switch between a case relationship map, evidence register, and scenario planner
- Select graph entities to inspect the case context
- Create a case in the current browser session
- Compare illustrative scenario assumptions

All case names, entities, and evidence are fictional. The scenario planner returns fixed example guidance; it is not an AI model, a verified finding, or a forecast. This prototype does not collect data from external sources, persist case data, or implement authentication and access policies.

Before using real case data, connect a Supabase project, enable authentication, restrict database rows and file storage by workspace membership, and review the access policies with your team's security requirements.
