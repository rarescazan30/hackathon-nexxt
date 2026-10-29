// @ts-check
// LifeGrowth code documentation (Docusaurus). Run from docs-site/: npm start / npm run build.
import { themes as prismThemes } from 'prism-react-renderer'

const REPO = 'https://github.com/rarescazan30/hackathon-nexxt'
const APP = 'https://hackathon-nexxt.vercel.app'

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'LifeGrowth Docs',
  tagline: 'How LifeGrowth works: product, architecture and code',
  favicon: 'img/logo.svg',

  // Production URL of the docs site (its own Vercel project). Change if it gets another address.
  url: 'https://lifegrowth-docs.vercel.app',
  baseUrl: '/',

  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: { onBrokenMarkdownLinks: 'throw' },
  },
  themes: ['@docusaurus/theme-mermaid'],

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: `${REPO}/tree/main/docs-site/`,
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: { respectPrefersColorScheme: true },
      navbar: {
        title: 'LifeGrowth',
        logo: { alt: 'LifeGrowth', src: 'img/logo.svg' },
        items: [
          { type: 'docSidebar', sidebarId: 'guide', position: 'left', label: 'Guide' },
          { type: 'docSidebar', sidebarId: 'architecture', position: 'left', label: 'Architecture' },
          { type: 'docSidebar', sidebarId: 'features', position: 'left', label: 'Features' },
          { type: 'docSidebar', sidebarId: 'reference', position: 'left', label: 'Reference' },
          { type: 'docSidebar', sidebarId: 'business', position: 'left', label: 'Business' },
          { href: APP, label: 'Open the app', position: 'right' },
          { href: REPO, label: 'GitHub', position: 'right' },
        ],
      },
      docs: { sidebar: { hideable: true } },
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Guide', to: '/docs/guide/introduction' },
              { label: 'Architecture', to: '/docs/architecture/overview' },
              { label: 'Features', to: '/docs/features/onboarding' },
              { label: 'Reference', to: '/docs/reference/money-rules' },
            ],
          },
          {
            title: 'Project',
            items: [
              { label: 'Live app', href: APP },
              { label: 'GitHub', href: REPO },
              { label: 'Business model', to: '/docs/business/business-model' },
            ],
          },
        ],
        copyright: `LifeGrowth · nexxt hackathon "Rethinking Financial Futures" · Prototype: test money and fictional bank data only. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'sql', 'json'],
      },
      mermaid: { theme: { light: 'neutral', dark: 'dark' } },
    }),
}

export default config
