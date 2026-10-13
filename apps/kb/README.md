# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Federated troubleshooting content

`src/content/troubleshooting/` isn't hand-written — it's fetched from a private repo by
`scripts/federated-content/fetch-federated-content.ts` as part of the build (`pnpm run fetch:federated-content`)
and is gitignored. See `AGENTS.md` for how it works and what's intentionally left out for now.

## Workflows

`.github/workflows/kb-troubleshooting-sync.yml` runs on every push to `master`: it fetches troubleshooting
content, creates a GitHub Discussion for any guide that doesn't have one yet
(`sync:troubleshooting-entries`), and pushes title/content updates to discussions whose guide has since
changed (`sync:troubleshooting-updates`). This is separate from kb's own build — it has real side effects
(creating/updating Discussions, writing DB rows), so it never runs as part of `pnpm build`/`prebuild`.
