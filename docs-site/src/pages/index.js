// The docs home page: what LifeGrowth is, and one card per chapter (navbar tab).
import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import Layout from '@theme/Layout'
import Heading from '@theme/Heading'
import styles from './index.module.css'

const CHAPTERS = [
  { label: 'Guide', title: 'Start here', text: 'What LifeGrowth is, how to try it in 5 minutes, run it locally and deploy it.', to: '/docs/guide/introduction' },
  { label: 'Architecture', title: 'How it fits together', text: 'Next.js + Supabase + Stripe, the request lifecycle, the database and security.', to: '/docs/architecture/overview' },
  { label: 'Features', title: 'Every screen, explained', text: 'Onboarding, the retirement model, levels, the monthly loop, Open Banking, Stripe, the PDF reader.', to: '/docs/features/onboarding' },
  { label: 'Reference', title: 'The details', text: 'Money rules and their sources, server actions, environment variables, scripts and tests.', to: '/docs/reference/money-rules' },
  { label: 'Business', title: 'Why it can work', text: 'How LifeGrowth makes money, the legal context, limitations and next steps.', to: '/docs/business/business-model' },
]

export default function Home() {
  return (
    <Layout title="LifeGrowth Docs" description="How LifeGrowth works: product, architecture and code.">
      <header className={styles.hero}>
        <img src={useBaseUrl('/img/logo.svg')} alt="" className={styles.logo} />
        <Heading as="h1" className={styles.title}>
          LifeGrowth Docs
        </Heading>
        <p className={styles.subtitle}>
          See how you&rsquo;ll live in retirement, as a 3D island built from your real pension numbers, and grow it with the
          round-ups of your card payments. This site explains how it works, from the product to the code.
        </p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/guide/introduction">
            Start reading
          </Link>
          <Link className="button button--secondary button--lg" href="https://hackathon-nexxt.vercel.app">
            Open the app
          </Link>
        </div>
      </header>
      <main className="container">
        <div className={styles.grid}>
          {CHAPTERS.map((chapter) => (
            <Link key={chapter.label} to={chapter.to} className={styles.card}>
              <span className={styles.cardLabel}>{chapter.label}</span>
              <Heading as="h3" className={styles.cardTitle}>
                {chapter.title}
              </Heading>
              <p className={styles.cardText}>{chapter.text}</p>
            </Link>
          ))}
        </div>
      </main>
    </Layout>
  )
}
