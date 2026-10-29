# LifeGrowth Docs

The code documentation site for LifeGrowth, built with [Docusaurus](https://docusaurus.io). It is a separate project from the app: its own `package.json`, ignored by the app's TypeScript and ESLint.

## Run it

```bash
cd docs-site
npm install
npm start        # http://localhost:3000, live reload
npm run build    # static site in docs-site/build
```

## Where things are

| Path | What |
|---|---|
| `docs/guide/` | Guide tab: introduction, try it, run locally, deployment, demo script |
| `docs/architecture/` | Architecture tab: overview, request lifecycle, structure, data model, security |
| `docs/features/` | Features tab: one page per feature |
| `docs/reference/` | Reference tab: money rules, server actions, environment, scripts, glossary |
| `docs/business/` | Business tab: business model, legal context, limitations and roadmap |
| `sidebars.js` | the chapters of each tab |
| `docusaurus.config.js` | navbar, footer, theme, Mermaid diagrams |
| `src/pages/index.js` | the home page |
| `src/css/custom.css` | LifeGrowth colours |

Diagrams are written in Mermaid inside the Markdown files.

## Deploy

Create a Vercel project from the same repository with **Root Directory** = `docs-site` (framework preset: Docusaurus). If it gets an address other than `lifegrowth-docs.vercel.app`, update `url` in `docusaurus.config.js`.
