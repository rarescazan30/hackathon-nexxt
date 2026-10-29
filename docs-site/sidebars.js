// @ts-check
// One sidebar per navbar tab. Each entry is a doc id: docs/<folder>/<file>.

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  guide: ['guide/introduction', 'guide/try-it', 'guide/run-locally', 'guide/deployment', 'guide/demo-script'],
  architecture: [
    'architecture/overview',
    'architecture/request-lifecycle',
    'architecture/project-structure',
    'architecture/data-model',
    'architecture/security',
  ],
  features: [
    {
      type: 'category',
      label: 'Getting started in the app',
      collapsed: false,
      items: ['features/onboarding', 'features/retirement-model', 'features/levels-and-island'],
    },
    {
      type: 'category',
      label: 'Money',
      collapsed: false,
      items: ['features/monthly-loop', 'features/open-banking', 'features/stripe-payments'],
    },
    {
      type: 'category',
      label: 'More',
      collapsed: false,
      items: ['features/pdf-reader', 'features/sharing', 'features/admin'],
    },
  ],
  reference: [
    'reference/money-rules',
    'reference/server-actions',
    'reference/environment',
    'reference/scripts-and-tests',
    'reference/glossary',
  ],
  business: ['business/business-model', 'business/legal', 'business/limitations-roadmap'],
}

export default sidebars
